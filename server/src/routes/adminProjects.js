const express = require('express');
const {
  PROJECT_STATUS_LABELS,
  INQUIRY_STAGE_LABELS,
  PACKAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  formatRevisionLimitLabel,
  intakeOptionLabel,
  DOMAIN_STATUSES,
  DOMAIN_STATUS_LABELS,
  DESIGN_PAYMENT_STATUS_LABELS,
  HOSTING_STATUS_LABELS,
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
  LIMITS,
  resolveHostingPlan,
  hostingPlanFromCents,
} = require('../config/constants');
const {
  listAdminProjects,
  getAdminProjectById,
  listAttachmentsForInquiry,
  updateProjectFields,
} = require('../db');
const {
  listInvoicesForProject,
  activationBlockReason,
} = require('../services/billing/invoices');
const { runActivationTickIfNeeded } = require('../services/billing/activationTick');
const { resendPortalAccess } = require('../services/portal');
const {
  startProjectByAdmin,
  completeProject,
  setReadyForLaunch,
  maybeActivateAndNotify,
} = require('../services/projects');
const { requireAdmin } = require('../middleware/requireAdmin');
const { setNoStore, requireSameOrigin } = require('../services/auth/cookies');
const { createHttpError, trimToNull, enforceMaxLength } = require('../utils/normalize');
const { toIsoUtc, formatMoney, mapAttachmentMeta } = require('../lib/format');

const router = express.Router();

function mapProjectListRow(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] || row.status,
    designPaymentStatus: row.design_payment_status || 'unpaid',
    designPaymentStatusLabel:
      DESIGN_PAYMENT_STATUS_LABELS[row.design_payment_status] || row.design_payment_status,
    hostingStatus: row.hosting_status || 'none',
    hostingStatusLabel: HOSTING_STATUS_LABELS[row.hosting_status] || row.hosting_status,
    proposalId: row.proposal_id,
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
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
  };
}

function mapInvoice(inv, currency = 'usd') {
  return {
    id: inv.id,
    kind: inv.kind,
    kindLabel: INVOICE_KIND_LABELS[inv.kind] || inv.kind,
    status: inv.status,
    statusLabel: INVOICE_STATUS_LABELS[inv.status] || inv.status,
    amountCents: inv.amount_cents,
    amountLabel: formatMoney(inv.amount_cents, inv.currency || currency),
    label: inv.label,
    paidAt: toIsoUtc(inv.paid_at),
    createdAt: toIsoUtc(inv.created_at),
  };
}

function mapProjectDetail(row) {
  const attachments = listAttachmentsForInquiry(row.inquiry_id).map(mapAttachmentMeta);
  const invoices = listInvoicesForProject(row.id).map((inv) =>
    mapInvoice(inv, row.proposal_currency || 'usd')
  );
  const proposalLike = row.proposal_id
    ? {
        payment_schedule: row.proposal_payment_schedule,
        kickoff_date: row.proposal_kickoff_date,
      }
    : null;
  const blockReason = activationBlockReason(row, proposalLike, listInvoicesForProject(row.id));
  const hostingPlan =
    row.proposal_hosting_plan || hostingPlanFromCents(row.hosting_monthly_cents);

  return {
    id: row.id,
    name: row.name,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] || row.status,
    designPaymentStatus: row.design_payment_status || 'unpaid',
    designPaymentStatusLabel:
      DESIGN_PAYMENT_STATUS_LABELS[row.design_payment_status] || row.design_payment_status,
    hostingStatus: row.hosting_status || 'none',
    hostingStatusLabel: HOSTING_STATUS_LABELS[row.hosting_status] || row.hosting_status,
    hostingCancelAtPeriodEnd: Boolean(row.hosting_cancel_at_period_end),
    hostingCurrentPeriodEnd: toIsoUtc(row.hosting_current_period_end),
    hostingCanceledAt: toIsoUtc(row.hosting_canceled_at),
    domainName: row.domain_name || null,
    domainStatus: row.domain_status || 'unknown',
    domainStatusLabel: DOMAIN_STATUS_LABELS[row.domain_status] || row.domain_status,
    workingBrief: row.working_brief || null,
    startedAt: toIsoUtc(row.started_at),
    startedBy: row.started_by || null,
    readyForLaunch: Boolean(row.ready_for_launch_at),
    readyForLaunchAt: toIsoUtc(row.ready_for_launch_at),
    activationBlockReason: blockReason,
    stripeSubscriptionId: row.stripe_subscription_id || null,
    proposalId: row.proposal_id,
    inquiryId: row.inquiry_id,
    clientId: row.client_id,
    createdAt: toIsoUtc(row.created_at),
    updatedAt: toIsoUtc(row.updated_at),
    attachments,
    invoices,
    client: {
      id: row.client_id,
      name: row.client_name,
      businessName: row.inquiry_business_name || row.client_business_name,
      email: row.client_email,
      phone: row.client_phone || null,
    },
    inquiry: row.inquiry_id
      ? {
          id: row.inquiry_id,
          type: row.inquiry_type || null,
          name: row.inquiry_name || null,
          businessName: row.inquiry_business_name || null,
          email: row.inquiry_email || null,
          phone: row.inquiry_phone || null,
          message: row.inquiry_message || null,
          packageSlug: row.inquiry_package_slug || null,
          packageLabel: row.inquiry_package_slug
            ? PACKAGE_LABELS[row.inquiry_package_slug] || row.inquiry_package_slug
            : null,
          websiteGoals: row.website_goals || null,
          currentWebsite: row.current_website || null,
          requestedFeatures: row.requested_features || null,
          inspirationLinks: row.inspiration_links || null,
          domainInfo: row.domain_info || null,
          domainName: row.inquiry_domain_name || null,
          brandingNotes: row.branding_notes || null,
          contentReadiness: intakeOptionLabel(CONTENT_READINESS_LABELS, row.content_readiness),
          timeline: intakeOptionLabel(TIMELINE_LABELS, row.inquiry_timeline),
          budget: intakeOptionLabel(BUDGET_LABELS, row.inquiry_budget),
          stage: row.inquiry_stage || null,
          stageLabel: row.inquiry_stage
            ? INQUIRY_STAGE_LABELS[row.inquiry_stage] || row.inquiry_stage
            : null,
          createdAt: toIsoUtc(row.inquiry_created_at),
        }
      : null,
    proposal: row.proposal_id
      ? {
          id: row.proposal_id,
          status: row.proposal_status || null,
          statusLabel: row.proposal_status
            ? PROPOSAL_STATUS_LABELS[row.proposal_status] || row.proposal_status
            : null,
          summary: row.proposal_summary || null,
          scope: row.proposal_scope || null,
          deliverables: row.proposal_deliverables || null,
          exclusions: row.proposal_exclusions || null,
          timelineSummary: row.proposal_timeline_summary || null,
          paymentSchedule: row.proposal_payment_schedule || DEFAULT_PAYMENT_SCHEDULE,
          paymentTermsLabel: paymentScheduleLabel(
            row.proposal_payment_schedule || DEFAULT_PAYMENT_SCHEDULE
          ),
          paymentTerms: paymentScheduleLabel(
            row.proposal_payment_schedule || DEFAULT_PAYMENT_SCHEDULE
          ),
          kickoffDate: row.proposal_kickoff_date || null,
          revisionLimit: row.proposal_revision_limit ?? null,
          revisionLimitLabel: formatRevisionLimitLabel(row.proposal_revision_limit),
          packageSlug: row.proposal_package_slug || null,
          packageLabel: row.proposal_package_slug
            ? PACKAGE_LABELS[row.proposal_package_slug] || row.proposal_package_slug
            : null,
          declineReason: row.proposal_decline_reason || null,
          hostingPlan,
          hostingPlanLabel: resolveHostingPlan(hostingPlan).label,
          designAmountCents: row.design_amount_cents,
          designAmountLabel: formatMoney(row.design_amount_cents, row.proposal_currency),
          hostingMonthlyCents: row.hosting_monthly_cents,
          hostingMonthlyLabel: formatMoney(row.hosting_monthly_cents, row.proposal_currency),
          currency: row.proposal_currency || 'usd',
          sentAt: toIsoUtc(row.proposal_sent_at),
          acceptedAt: toIsoUtc(row.proposal_accepted_at),
          declinedAt: toIsoUtc(row.proposal_declined_at),
          createdAt: toIsoUtc(row.proposal_created_at),
          updatedAt: toIsoUtc(row.proposal_updated_at),
        }
      : null,
    portal: {
      passwordSet: Boolean(row.portal_password_hash),
      passwordSetAt: toIsoUtc(row.portal_password_set_at),
      setupPending: Boolean(row.portal_setup_token_hash),
      setupExpiresAt: toIsoUtc(row.portal_setup_expires_at),
    },
  };
}

router.use(requireAdmin);
router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/', (req, res, next) => {
  try {
    const result = listAdminProjects({
      search: req.query.q || '',
      status: req.query.status || '',
      sort: req.query.sort || 'created_at',
      dir: req.query.dir || 'desc',
      page: req.query.page || 1,
      pageSize: 20,
    });

    return res.status(200).json({
      ok: true,
      items: result.rows.map(mapProjectListRow),
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

router.get('/:id', async (req, res, next) => {
  try {
    runActivationTickIfNeeded();
    await maybeActivateAndNotify(req.params.id);
    const row = getAdminProjectById(req.params.id);
    if (!row) {
      throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
    }
    return res.status(200).json({ ok: true, project: mapProjectDetail(row) });
  } catch (error) {
    return next(error);
  }
});

router.patch(
  '/:id',
  requireSameOrigin,
  express.json({ limit: '32kb' }),
  (req, res, next) => {
    try {
      const existing = getAdminProjectById(req.params.id);
      if (!existing) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      const errors = {};
      const patch = {};

      if (req.body?.domainName !== undefined) {
        patch.domainName = enforceMaxLength(trimToNull(req.body.domainName), LIMITS.domainName);
      }
      if (req.body?.domainStatus !== undefined) {
        const status = trimToNull(req.body.domainStatus) || 'unknown';
        if (!DOMAIN_STATUSES.includes(status)) {
          errors.domainStatus = 'Choose a valid domain status.';
        } else {
          patch.domainStatus = status;
        }
      }
      if (req.body?.workingBrief !== undefined) {
        patch.workingBrief = enforceMaxLength(
          trimToNull(req.body.workingBrief),
          LIMITS.workingBrief
        );
      }

      if (Object.keys(errors).length) {
        throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
      }

      if (Object.keys(patch).length) {
        updateProjectFields(req.params.id, patch);
      }

      const refreshed = getAdminProjectById(req.params.id);
      return res.status(200).json({ ok: true, project: mapProjectDetail(refreshed) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/mark-started',
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const existing = getAdminProjectById(req.params.id);
      if (!existing) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      await startProjectByAdmin(req.params.id);
      const refreshed = getAdminProjectById(req.params.id);
      return res.status(200).json({ ok: true, project: mapProjectDetail(refreshed) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/mark-completed',
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const existing = getAdminProjectById(req.params.id);
      if (!existing) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      await completeProject(req.params.id);
      const refreshed = getAdminProjectById(req.params.id);
      return res.status(200).json({ ok: true, project: mapProjectDetail(refreshed) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/ready-for-launch',
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const existing = getAdminProjectById(req.params.id);
      if (!existing) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      const ready = req.body?.ready;
      if (typeof ready !== 'boolean') {
        throw createHttpError(400, 'ready must be a boolean.', 'VALIDATION_ERROR');
      }

      await setReadyForLaunch(req.params.id, ready);
      const refreshed = getAdminProjectById(req.params.id);
      return res.status(200).json({ ok: true, project: mapProjectDetail(refreshed) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/resend-portal-access',
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      const result = await resendPortalAccess(req.params.id);
      return res.status(200).json({
        ok: true,
        project: mapProjectDetail(result.project),
        message: result.message,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
