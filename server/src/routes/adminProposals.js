const express = require('express');
const {
  PACKAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUSES,
  INQUIRY_STAGE_LABELS,
  PAYMENT_SCHEDULES,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  formatRevisionLimitLabel,
  HOSTING_PLANS,
  DEFAULT_HOSTING_PLAN,
  resolveHostingPlan,
  hostingPlanFromCents,
  LIMITS,
} = require('../constants');
const {
  listAdminProposals,
  getProposalById,
  createProposal,
  updateProposal,
  markProposalSent,
  getAdminInquiryById,
  listProposalsByInquiryId,
  createProposalShare,
  prepareProposalShareToken,
  listRevisionRequestsForProposal,
  listAttachmentsForInquiry,
} = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../auth/cookies');
const {
  trimToNull,
  enforceMaxLength,
  createHttpError,
  normalizeEmail,
  isValidEmail,
} = require('../utils/normalize');
const { config } = require('../config');
const { sendProposalShareEmail } = require('../email');

const router = express.Router();

function toIsoUtc(sqliteDatetime) {
  if (!sqliteDatetime) return null;
  const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(sqliteDatetime)
    ? sqliteDatetime
    : `${String(sqliteDatetime).replace(' ', 'T')}Z`;
  const ms = Date.parse(normalized);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

function formatMoney(cents, currency = 'usd') {
  if (cents === null || cents === undefined) return null;
  const amount = Number(cents) / 100;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    }).format(amount);
  } catch {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  }
}

function mapProposalListRow(row) {
  return {
    id: row.id,
    status: row.status,
    statusLabel: PROPOSAL_STATUS_LABELS[row.status] || row.status,
    designAmountCents: row.design_amount_cents,
    designAmountLabel: formatMoney(row.design_amount_cents, row.currency),
    hostingMonthlyCents: row.hosting_monthly_cents,
    hostingMonthlyLabel: formatMoney(row.hosting_monthly_cents, row.currency),
    hostingPlan: row.hosting_plan || hostingPlanFromCents(row.hosting_monthly_cents),
    hostingPlanLabel: resolveHostingPlan(
      row.hosting_plan || hostingPlanFromCents(row.hosting_monthly_cents)
    ).label,
    currency: row.currency,
    sentAt: toIsoUtc(row.sent_at),
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
    inquiryId: row.inquiry_id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientBusinessName: row.client_business_name,
    clientEmail: row.client_email,
    inquiryStage: row.inquiry_stage || null,
    inquiryStageLabel: row.inquiry_stage
      ? INQUIRY_STAGE_LABELS[row.inquiry_stage] || row.inquiry_stage
      : null,
    inquiryType: row.inquiry_type || null,
    packageSlug: row.inquiry_package_slug || null,
    packageLabel: row.inquiry_package_slug
      ? PACKAGE_LABELS[row.inquiry_package_slug] || row.inquiry_package_slug
      : null,
  };
}

function mapAttachmentMeta(row) {
  return {
    id: row.id,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    createdAt: toIsoUtc(row.created_at),
  };
}

function mapProposalDetail(row) {
  const revisions = listRevisionRequestsForProposal(row.id).map((r) => ({
    id: r.id,
    message: r.message,
    createdAt: toIsoUtc(r.created_at),
  }));
  const attachments = listAttachmentsForInquiry(row.inquiry_id).map(mapAttachmentMeta);

  return {
    id: row.id,
    status: row.status,
    statusLabel: PROPOSAL_STATUS_LABELS[row.status] || row.status,
    summary: row.summary,
    scope: row.scope,
    deliverables: row.deliverables,
    exclusions: row.exclusions,
    timelineSummary: row.timeline_summary,
    paymentSchedule: row.payment_schedule || DEFAULT_PAYMENT_SCHEDULE,
    paymentTermsLabel: paymentScheduleLabel(row.payment_schedule || DEFAULT_PAYMENT_SCHEDULE),
    /** @deprecated use paymentTermsLabel */
    paymentTerms: paymentScheduleLabel(row.payment_schedule || DEFAULT_PAYMENT_SCHEDULE),
    kickoffDate: row.kickoff_date || null,
    revisionLimit: row.revision_limit ?? null,
    revisionLimitLabel: formatRevisionLimitLabel(row.revision_limit),
    designAmountCents: row.design_amount_cents,
    designAmountLabel: formatMoney(row.design_amount_cents, row.currency),
    hostingMonthlyCents: row.hosting_monthly_cents,
    hostingMonthlyLabel: formatMoney(row.hosting_monthly_cents, row.currency),
    hostingPlan: row.hosting_plan || hostingPlanFromCents(row.hosting_monthly_cents),
    hostingPlanLabel: resolveHostingPlan(
      row.hosting_plan || hostingPlanFromCents(row.hosting_monthly_cents)
    ).label,
    currency: row.currency,
    sentAt: toIsoUtc(row.sent_at),
    declineReason: row.decline_reason || null,
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
    inquiryId: row.inquiry_id,
    clientId: row.client_id,
    revisions,
    attachments,
    client: row.client
      ? {
          id: row.client.id,
          name: row.client.name,
          email: row.client.email,
          phone: row.client.phone,
          businessName: row.client.business_name,
        }
      : null,
    inquiry: row.inquiry
      ? {
          id: row.inquiry.id,
          type: row.inquiry.type,
          name: row.inquiry.name,
          email: row.inquiry.email,
          phone: row.inquiry.phone,
          businessName: row.inquiry.business_name,
          packageSlug: row.inquiry.package_slug,
          packageLabel: row.inquiry.package_slug
            ? PACKAGE_LABELS[row.inquiry.package_slug] || row.inquiry.package_slug
            : null,
          stage: row.inquiry.stage,
          stageLabel: row.inquiry.stage
            ? INQUIRY_STAGE_LABELS[row.inquiry.stage] || row.inquiry.stage
            : null,
          websiteGoals: row.inquiry.website_goals,
          createdAt: toIsoUtc(row.inquiry.created_at),
          clientId: row.inquiry.client_id,
        }
      : null,
  };
}

function parseKickoffDate(value) {
  const raw = trimToNull(value);
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: 'Kickoff date must be YYYY-MM-DD.' };
  }
  const ms = Date.parse(`${raw}T00:00:00Z`);
  if (!Number.isFinite(ms)) {
    return { error: 'Kickoff date must be a valid calendar date.' };
  }
  return { value: raw };
}

function parseRevisionLimit(value, { partial = false } = {}) {
  if (value === undefined) {
    return partial ? { omitted: true } : { value: 2 };
  }
  if (value === null || value === '') {
    return { value: null };
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 99) {
    return { error: 'Revision limit must be a positive whole number, or empty for unlimited.' };
  }
  return { value: n };
}

function parseProposalBody(body, { partial = false } = {}) {
  const errors = {};

  const summary = enforceMaxLength(trimToNull(body.summary), LIMITS.proposalSummary);
  const scope = enforceMaxLength(trimToNull(body.scope), LIMITS.proposalScope);
  const deliverables = enforceMaxLength(trimToNull(body.deliverables), LIMITS.proposalDeliverables);
  const exclusions = enforceMaxLength(trimToNull(body.exclusions), LIMITS.proposalExclusions);
  const timelineSummary = enforceMaxLength(
    trimToNull(body.timelineSummary),
    LIMITS.proposalTimeline
  );

  let paymentSchedule;
  if (body.paymentSchedule !== undefined && body.paymentSchedule !== null && body.paymentSchedule !== '') {
    paymentSchedule = String(body.paymentSchedule);
    if (!PAYMENT_SCHEDULES.includes(paymentSchedule)) {
      errors.paymentSchedule = 'Choose a valid payment schedule.';
    }
  } else if (!partial) {
    paymentSchedule = DEFAULT_PAYMENT_SCHEDULE;
  }

  let kickoffDate;
  if (body.kickoffDate !== undefined) {
    const parsed = parseKickoffDate(body.kickoffDate);
    if (parsed.error) errors.kickoffDate = parsed.error;
    else kickoffDate = parsed.value;
  }

  let revisionLimit;
  if (body.revisionLimit !== undefined || !partial) {
    const parsed = parseRevisionLimit(body.revisionLimit, { partial });
    if (parsed.error) errors.revisionLimit = parsed.error;
    else if (!parsed.omitted) revisionLimit = parsed.value;
  }

  let designAmountCents;
  if (body.designAmountCents !== undefined && body.designAmountCents !== null && body.designAmountCents !== '') {
    designAmountCents = Number(body.designAmountCents);
    if (!Number.isInteger(designAmountCents) || designAmountCents <= 0) {
      errors.designAmountCents = 'Enter a valid design price in cents (positive whole number).';
    }
  } else if (!partial) {
    errors.designAmountCents = 'Design amount is required.';
  }

  let hostingPlan;
  let hostingMonthlyCents = null;
  if (body.hostingPlan !== undefined || body.hostingMonthlyCents !== undefined || !partial) {
    if (body.hostingPlan !== undefined && body.hostingPlan !== null && body.hostingPlan !== '') {
      hostingPlan = String(body.hostingPlan);
      if (!HOSTING_PLANS.includes(hostingPlan)) {
        errors.hostingPlan = 'Choose a valid hosting plan.';
      } else {
        hostingMonthlyCents = resolveHostingPlan(hostingPlan).amountCents;
      }
    } else if (
      body.hostingMonthlyCents !== undefined &&
      body.hostingMonthlyCents !== null &&
      body.hostingMonthlyCents !== ''
    ) {
      hostingMonthlyCents = Number(body.hostingMonthlyCents);
      if (!Number.isInteger(hostingMonthlyCents) || hostingMonthlyCents < 0) {
        errors.hostingMonthlyCents = 'Hosting amount must be a whole number of cents (0 or more).';
      } else {
        hostingPlan = hostingPlanFromCents(hostingMonthlyCents);
      }
    } else if (!partial) {
      hostingPlan = DEFAULT_HOSTING_PLAN;
      hostingMonthlyCents = resolveHostingPlan(hostingPlan).amountCents;
    }
  }

  if (Object.keys(errors).length) {
    throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
  }

  const out = {
    summary,
    scope,
    deliverables,
    exclusions,
    timelineSummary,
  };

  if (paymentSchedule !== undefined) out.paymentSchedule = paymentSchedule;
  if (body.kickoffDate !== undefined) out.kickoffDate = kickoffDate;
  if (revisionLimit !== undefined) out.revisionLimit = revisionLimit;

  if (designAmountCents !== undefined) out.designAmountCents = designAmountCents;
  if (hostingPlan !== undefined) {
    out.hostingPlan = hostingPlan;
    out.hostingMonthlyCents = hostingMonthlyCents;
  }

  if (body.status !== undefined) {
    if (!PROPOSAL_STATUSES.includes(body.status)) {
      throw createHttpError(400, 'Invalid proposal status.', 'VALIDATION_ERROR', {
        status: 'Status must be draft, sent, revision_requested, accepted, or declined.',
      });
    }
    out.status = body.status;
  }

  return out;
}

router.use(requireAdmin);
router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/', (req, res, next) => {
  try {
    const result = listAdminProposals({
      search: req.query.q || '',
      status: req.query.status || '',
      sort: req.query.sort || 'created_at',
      dir: req.query.dir || 'desc',
      page: req.query.page || 1,
      pageSize: 20,
    });
    return res.status(200).json({
      ok: true,
      items: result.rows.map(mapProposalListRow),
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const proposal = getProposalById(req.params.id);
    if (!proposal) {
      throw createHttpError(404, 'Proposal not found.', 'NOT_FOUND');
    }
    return res.status(200).json({ ok: true, proposal: mapProposalDetail(proposal) });
  } catch (error) {
    return next(error);
  }
});

router.post('/', express.json({ limit: '64kb' }), (req, res, next) => {
  try {
    const inquiryId = trimToNull(req.body?.inquiryId);
    if (!inquiryId) {
      throw createHttpError(400, 'Inquiry is required.', 'VALIDATION_ERROR', {
        inquiryId: 'Inquiry is required.',
      });
    }

    const inquiry = getAdminInquiryById(inquiryId);
    if (!inquiry) {
      throw createHttpError(404, 'Inquiry not found.', 'NOT_FOUND');
    }
    if (!inquiry.client_id) {
      throw createHttpError(
        400,
        'A linked client is required before creating a proposal.',
        'CLIENT_REQUIRED'
      );
    }

    const existingProposals = listProposalsByInquiryId(inquiryId);
    if (existingProposals.length > 0) {
      throw createHttpError(
        400,
        'This inquiry already has a proposal.',
        'PROPOSAL_EXISTS'
      );
    }

    const fields = parseProposalBody(req.body || {}, { partial: false });
    const proposal = createProposal({
      inquiryId,
      clientId: inquiry.client_id,
      ...fields,
      status: 'draft',
    });

    return res.status(201).json({ ok: true, proposal: mapProposalDetail(proposal) });
  } catch (error) {
    return next(error);
  }
});

router.patch('/:id', express.json({ limit: '64kb' }), (req, res, next) => {
  try {
    const existing = getProposalById(req.params.id);
    if (!existing) {
      throw createHttpError(404, 'Proposal not found.', 'NOT_FOUND');
    }

    const fields = parseProposalBody(req.body || {}, { partial: true });
    const proposal = updateProposal(req.params.id, fields);
    return res.status(200).json({ ok: true, proposal: mapProposalDetail(proposal) });
  } catch (error) {
    return next(error);
  }
});

function parseEmailList(value) {
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split(',')
    .map((part) => normalizeEmail(part))
    .filter(Boolean);
}

router.post('/:id/send', express.json({ limit: '64kb' }), async (req, res, next) => {
  try {
    const proposal = getProposalById(req.params.id);
    if (!proposal) {
      throw createHttpError(404, 'Proposal not found.', 'NOT_FOUND');
    }
    if (!proposal.client?.email) {
      throw createHttpError(400, 'Client email is required to send a proposal.', 'CLIENT_EMAIL_REQUIRED');
    }
    if (!config.publicAppUrl) {
      throw createHttpError(500, 'PUBLIC_APP_URL is not configured.', 'CONFIG_ERROR');
    }

    const errors = {};
    const to = normalizeEmail(req.body?.to) || normalizeEmail(proposal.client.email);
    if (!isValidEmail(to)) {
      errors.to = 'Enter a valid recipient email.';
    }

    const ccList = parseEmailList(req.body?.cc);
    const invalidCc = ccList.find((email) => !isValidEmail(email));
    if (invalidCc) {
      errors.cc = 'Enter valid CC emails, separated by commas.';
    }

    let subject = enforceMaxLength(trimToNull(req.body?.subject), LIMITS.proposalEmailSubject);
    if (!subject) {
      const who = proposal.client.business_name || proposal.client.name || 'your project';
      subject = `Website proposal for ${who}`;
    }

    let message = enforceMaxLength(trimToNull(req.body?.message), LIMITS.proposalEmailMessage);
    if (!message) {
      message =
        'Thank you for sharing your project details. I put together a proposal for you to review. Use the button below to open it — you can accept, request a revision, or decline from that page.';
    }

    if (Object.keys(errors).length) {
      throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
    }

    const prepared = prepareProposalShareToken();
    const viewUrl = `${config.publicAppUrl}/p/${prepared.rawToken}`;

    try {
      await sendProposalShareEmail({
        to: [to],
        cc: ccList,
        subject,
        message,
        viewUrl,
        clientName: proposal.client.name,
      });
    } catch (err) {
      if (err.code === 'EMAIL_NOT_CONFIGURED' || err.code === 'EMAIL_SEND_FAILED') {
        throw createHttpError(502, err.message || 'Failed to send email.', err.code, err.details);
      }
      throw err;
    }

    createProposalShare(proposal.id, prepared);
    const updated = markProposalSent(proposal.id);

    return res.status(200).json({
      ok: true,
      proposal: mapProposalDetail(updated),
      share: { expiresAt: toIsoUtc(prepared.expiresAt) },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
