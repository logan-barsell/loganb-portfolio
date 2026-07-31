const express = require('express');
const {
  PACKAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
  INQUIRY_STAGE_LABELS,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  formatRevisionLimitLabel,
  resolveHostingPlan,
  hostingPlanFromCents,
} = require('../config/constants');
const {
  listAdminProposals,
  getProposalById,
  createProposal,
  getAdminInquiryById,
  listProposalsByInquiryId,
  listRevisionRequestsForProposal,
  listAttachmentsForInquiry,
  proposalContentChangedSinceLastSend,
} = require('../db');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore } = require('../services/auth/cookies');
const { trimToNull, createHttpError } = require('../utils/normalize');
const { parseProposalBody, sendProposalShare, updateAdminProposal, beginAdminRevision } = require('../services/proposals');
const { toIsoUtc, formatMoney, mapAttachmentMeta } = require('../lib/format');

const router = express.Router();

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
    clientBusinessName: row.inquiry_business_name || row.client_business_name,
    clientEmail: row.client_email,
    inquiryStage: row.inquiry_stage || null,
    inquiryStageLabel: row.inquiry_stage
      ? INQUIRY_STAGE_LABELS[row.inquiry_stage] || row.inquiry_stage
      : null,
    inquiryType: row.inquiry_type || null,
    packageSlug: row.proposal_package_slug || row.inquiry_package_slug || null,
    packageLabel: (() => {
      const slug = row.proposal_package_slug || row.inquiry_package_slug;
      return slug ? PACKAGE_LABELS[slug] || slug : null;
    })(),
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
    packageSlug: row.package_slug || null,
    packageLabel: row.package_slug
      ? PACKAGE_LABELS[row.package_slug] || row.package_slug
      : null,
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
    acceptedAt: toIsoUtc(row.accepted_at),
    declinedAt: toIsoUtc(row.declined_at),
    declineReason: row.decline_reason || null,
    contentChangedSinceSend: proposalContentChangedSinceLastSend(row),
    hasBeenSent: Boolean(row.last_sent_content_hash || row.sent_at),
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
          businessName: row.inquiry?.business_name || row.client.business_name,
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
          requestedFeatures: row.inquiry.requested_features,
          createdAt: toIsoUtc(row.inquiry.created_at),
          clientId: row.inquiry.client_id,
        }
      : null,
  };
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
    if (!fields.packageSlug && inquiry.package_slug) {
      fields.packageSlug = inquiry.package_slug;
    }
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
    const fields = parseProposalBody(req.body || {}, { partial: true });
    const proposal = updateAdminProposal(req.params.id, fields);
    return res.status(200).json({ ok: true, proposal: mapProposalDetail(proposal) });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/begin-revision', (req, res, next) => {
  try {
    const proposal = beginAdminRevision(req.params.id);
    return res.status(200).json({ ok: true, proposal: mapProposalDetail(proposal) });
  } catch (error) {
    return next(error);
  }
});

router.post('/:id/send', express.json({ limit: '64kb' }), async (req, res, next) => {
  try {
    const result = await sendProposalShare(req.params.id, {
      to: req.body?.to,
      cc: req.body?.cc,
      subject: req.body?.subject,
      message: req.body?.message,
    });

    return res.status(200).json({
      ok: true,
      proposal: mapProposalDetail(result.proposal),
      share: result.share,
      revised: Boolean(result.revised),
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
