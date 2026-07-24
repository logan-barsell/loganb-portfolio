const express = require('express');
const {
  PACKAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUSES,
  INQUIRY_STAGE_LABELS,
  LIMITS,
} = require('../constants');
const {
  listAdminProposals,
  getProposalById,
  createProposal,
  updateProposal,
  getAdminInquiryById,
  listProposalsByInquiryId,
} = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../auth/cookies');
const {
  trimToNull,
  enforceMaxLength,
  createHttpError,
} = require('../utils/normalize');

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

function mapProposalDetail(row) {
  return {
    id: row.id,
    status: row.status,
    statusLabel: PROPOSAL_STATUS_LABELS[row.status] || row.status,
    summary: row.summary,
    scope: row.scope,
    deliverables: row.deliverables,
    exclusions: row.exclusions,
    timelineSummary: row.timeline_summary,
    paymentTerms: row.payment_terms,
    revisionLimit: row.revision_limit,
    designAmountCents: row.design_amount_cents,
    designAmountLabel: formatMoney(row.design_amount_cents, row.currency),
    hostingMonthlyCents: row.hosting_monthly_cents,
    hostingMonthlyLabel: formatMoney(row.hosting_monthly_cents, row.currency),
    currency: row.currency,
    sentAt: toIsoUtc(row.sent_at),
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
    inquiryId: row.inquiry_id,
    clientId: row.client_id,
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
  const paymentTerms = enforceMaxLength(
    trimToNull(body.paymentTerms),
    LIMITS.proposalPaymentTerms
  );
  const revisionLimit = enforceMaxLength(
    trimToNull(body.revisionLimit),
    LIMITS.proposalRevisionLimit
  );

  let designAmountCents;
  if (body.designAmountCents !== undefined && body.designAmountCents !== null && body.designAmountCents !== '') {
    designAmountCents = Number(body.designAmountCents);
    if (!Number.isInteger(designAmountCents) || designAmountCents <= 0) {
      errors.designAmountCents = 'Enter a valid design price in cents (positive whole number).';
    }
  } else if (!partial) {
    errors.designAmountCents = 'Design amount is required.';
  }

  let hostingMonthlyCents = null;
  if (
    body.hostingMonthlyCents !== undefined &&
    body.hostingMonthlyCents !== null &&
    body.hostingMonthlyCents !== ''
  ) {
    hostingMonthlyCents = Number(body.hostingMonthlyCents);
    if (!Number.isInteger(hostingMonthlyCents) || hostingMonthlyCents < 0) {
      errors.hostingMonthlyCents = 'Hosting amount must be a whole number of cents (0 or more).';
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
    paymentTerms,
    revisionLimit,
  };

  if (designAmountCents !== undefined) out.designAmountCents = designAmountCents;
  if (
    body.hostingMonthlyCents !== undefined ||
    body.hostingMonthlyCents === null ||
    body.hostingMonthlyCents === ''
  ) {
    out.hostingMonthlyCents = hostingMonthlyCents;
  }

  if (body.status !== undefined) {
    if (!PROPOSAL_STATUSES.includes(body.status)) {
      throw createHttpError(400, 'Invalid proposal status.', 'VALIDATION_ERROR', {
        status: 'Status must be draft, sent, or declined.',
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

module.exports = router;
