const fs = require('fs');
const path = require('path');
const express = require('express');
const {
  PACKAGE_LABELS,
  PROJECT_STATUS_LABELS,
  INQUIRY_STAGE_LABELS,
  PROPOSAL_STATUS_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  formatRevisionLimitLabel,
  INVOICE_KIND_LABELS,
  INVOICE_STATUS_LABELS,
  DOMAIN_STATUSES,
  DOMAIN_STATUS_LABELS,
  DESIGN_PAYMENT_STATUS_LABELS,
  HOSTING_STATUS_LABELS,
  intakeOptionLabel,
} = require('../constants');
const { config } = require('../config');
const {
  getProjectById,
  getProjectForPortalSetup,
  completePortalPasswordSetup,
  getPortalProjectBundle,
  insertAttachments,
  deleteAttachmentById,
  listAttachmentsForInquiry,
  getAdminAttachment,
  updateProjectDomain,
} = require('../db');
const {
  listInvoicesForProject,
  markInvoiceCheckoutSession,
  getInvoiceById,
  activationBlockReason,
  maybeActivateProject,
  stripePriceIdForPlan,
  findHostingInvoiceForProject,
} = require('../billing/invoices');
const {
  isStripeEnabled,
  createDesignCheckoutSession,
  createHostingCheckoutSession,
  createBillingPortalSession,
} = require('../stripe');
const { runActivationTickIfNeeded } = require('../billing/activationTick');
const { assertRealHostingPriceId } = require('../billing/subscriptionSync');
const { hashPassword, verifyPassword } = require('../auth/password');
const { trimToNull, enforceMaxLength, createHttpError } = require('../utils/normalize');
const { LIMITS } = require('../constants');
const {
  createProjectClientSession,
  getValidClientSession,
  destroyClientSession,
} = require('../auth/clientSessions');
const {
  getClientSessionToken,
  setClientSessionCookie,
  clearClientSessionCookie,
} = require('../auth/clientCookies');
const { setNoStore, requireSameOrigin } = require('../auth/cookies');
const { requireClientProject } = require('../middleware/requireClientProject');
const { clientPortalAuthLimiter } = require('../middleware/rateLimit');
const { upload, mapUploadedFiles, removeFiles } = require('../utils/uploads');

const router = express.Router();

const PREVIEWABLE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
]);

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
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    }).format(Number(cents) / 100);
  } catch {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  }
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

function mapPortalOverview(bundle) {
  const { project, client, inquiry, proposal, attachments } = bundle;
  const designCents = proposal?.design_amount_cents ?? null;
  const hostingCents = proposal?.hosting_monthly_cents ?? null;
  const currency = proposal?.currency || 'usd';
  const schedule = proposal?.payment_schedule || DEFAULT_PAYMENT_SCHEDULE;
  const invoices = listInvoicesForProject(project.id).map((inv) => ({
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
  }));

  const dueDesign = invoices.filter(
    (inv) => inv.status === 'due' && ['deposit', 'balance', 'full'].includes(inv.kind)
  );
  const lineItems = dueDesign.map((inv) => ({
    key: inv.kind,
    invoiceId: inv.id,
    label: inv.label || inv.kindLabel,
    amountCents: inv.amountCents,
    amountLabel: inv.amountLabel,
    due: true,
  }));

  const hostingInvoice = invoices.find((inv) => inv.kind === 'hosting');
  const blockReason = activationBlockReason(project, proposal, listInvoicesForProject(project.id));
  const cancelAtPeriodEnd = Boolean(project.hosting_cancel_at_period_end);
  const periodEndIso = toIsoUtc(project.hosting_current_period_end);

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    statusLabel: PROJECT_STATUS_LABELS[project.status] || project.status,
    designPaymentStatus: project.design_payment_status || 'unpaid',
    designPaymentStatusLabel:
      DESIGN_PAYMENT_STATUS_LABELS[project.design_payment_status] || project.design_payment_status,
    hostingStatus: project.hosting_status || 'none',
    hostingStatusLabel: HOSTING_STATUS_LABELS[project.hosting_status] || project.hosting_status,
    hostingCancelAtPeriodEnd: cancelAtPeriodEnd,
    hostingCurrentPeriodEnd: periodEndIso,
    hostingCanceledAt: toIsoUtc(project.hosting_canceled_at),
    domainName: project.domain_name || null,
    domainStatus: project.domain_status || 'unknown',
    domainStatusLabel: DOMAIN_STATUS_LABELS[project.domain_status] || project.domain_status,
    readyForLaunch: Boolean(project.ready_for_launch_at),
    readyForLaunchAt: toIsoUtc(project.ready_for_launch_at),
    activationBlockReason: blockReason,
    createdAt: toIsoUtc(project.created_at),
    portalPasswordSet: Boolean(project.portal_password_hash),
    client: client
      ? {
          name: client.name || null,
          businessName: client.business_name || null,
          email: client.email || null,
          phone: client.phone || null,
        }
      : null,
    inquiry: inquiry
      ? {
          type: inquiry.type || null,
          name: inquiry.name || null,
          email: inquiry.email || null,
          phone: inquiry.phone || null,
          businessName: inquiry.business_name || null,
          message: inquiry.message || null,
          packageSlug: inquiry.package_slug || null,
          packageLabel: inquiry.package_slug
            ? PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug
            : null,
          websiteGoals: inquiry.website_goals || null,
          currentWebsite: inquiry.current_website || null,
          requestedFeatures: inquiry.requested_features || null,
          inspirationLinks: inquiry.inspiration_links || null,
          domainInfo: inquiry.domain_info || null,
          domainName: inquiry.domain_name || null,
          brandingNotes: inquiry.branding_notes || null,
          contentReadiness: intakeOptionLabel(CONTENT_READINESS_LABELS, inquiry.content_readiness),
          timeline: intakeOptionLabel(TIMELINE_LABELS, inquiry.timeline),
          budget: intakeOptionLabel(BUDGET_LABELS, inquiry.budget),
          stage: inquiry.stage || null,
          stageLabel: inquiry.stage
            ? INQUIRY_STAGE_LABELS[inquiry.stage] || inquiry.stage
            : null,
          createdAt: toIsoUtc(inquiry.created_at),
        }
      : null,
    proposal: proposal
      ? {
          status: proposal.status || null,
          statusLabel: proposal.status
            ? PROPOSAL_STATUS_LABELS[proposal.status] || proposal.status
            : null,
          summary: proposal.summary || null,
          scope: proposal.scope || null,
          deliverables: proposal.deliverables || null,
          exclusions: proposal.exclusions || null,
          timelineSummary: proposal.timeline_summary || null,
          paymentSchedule: schedule,
          paymentTermsLabel: paymentScheduleLabel(schedule),
          paymentTerms: paymentScheduleLabel(schedule),
          kickoffDate: proposal.kickoff_date || null,
          revisionLimit: proposal.revision_limit ?? null,
          revisionLimitLabel: formatRevisionLimitLabel(proposal.revision_limit),
          hostingPlan: proposal.hosting_plan || null,
          designAmountCents: designCents,
          designAmountLabel: formatMoney(designCents, currency),
          hostingMonthlyCents: hostingCents,
          hostingMonthlyLabel: formatMoney(hostingCents, currency),
          currency,
          sentAt: toIsoUtc(proposal.sent_at),
        }
      : null,
    attachments: (attachments || []).map(mapAttachmentMeta),
    invoices,
    billing: {
      schedule,
      stripeEnabled: isStripeEnabled(),
      lineItems,
      hasHosting: Boolean(hostingInvoice || (proposal?.hosting_plan && proposal.hosting_plan !== 'none')),
      hostingInvoiceId: hostingInvoice?.id || null,
      hostingSubscriptionActive: Boolean(project.stripe_subscription_id),
      hostingCheckoutAllowed: Boolean(project.ready_for_launch_at),
      hostingCancelAtPeriodEnd: cancelAtPeriodEnd,
      hostingCurrentPeriodEnd: periodEndIso,
      hostingMonthlyLabel: formatMoney(hostingCents, currency),
    },
  };
}

function validatePassword(password, confirmPassword) {
  const pw = String(password || '');
  const confirm = String(confirmPassword || '');
  if (pw.length < 10) {
    throw createHttpError(400, 'Password must be at least 10 characters.', 'VALIDATION_ERROR', {
      password: 'Password must be at least 10 characters.',
    });
  }
  if (pw !== confirm) {
    throw createHttpError(400, 'Passwords do not match.', 'VALIDATION_ERROR', {
      confirmPassword: 'Passwords do not match.',
    });
  }
}

function sanitizeDownloadName(name) {
  const base = path.basename(String(name || 'download')).replace(/[\r\n"]/g, '');
  return base || 'download';
}

function resolveUploadPath(storedName) {
  const uploadRoot = path.resolve(config.uploadPath);
  const resolved = path.resolve(uploadRoot, storedName);
  if (resolved !== uploadRoot && !resolved.startsWith(`${uploadRoot}${path.sep}`)) {
    return null;
  }
  return resolved;
}

function displayNameForProject(projectId) {
  const bundle = getPortalProjectBundle(projectId);
  if (!bundle) return null;
  return (
    bundle.client?.business_name ||
    bundle.inquiry?.business_name ||
    bundle.client?.name ||
    bundle.inquiry?.name ||
    'your project'
  );
}

router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/:id/setup/:token', (req, res, next) => {
  try {
    const result = getProjectForPortalSetup(req.params.id, req.params.token);
    if (!result || result.expired) {
      throw createHttpError(
        404,
        'This setup link is invalid or has expired. Ask for a new portal access email.',
        'NOT_FOUND'
      );
    }
    return res.status(200).json({
      ok: true,
      needsPassword: true,
      project: {
        id: result.project.id,
        businessName: displayNameForProject(result.project.id),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/:id/setup/:token',
  clientPortalAuthLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const result = getProjectForPortalSetup(req.params.id, req.params.token);
      if (!result || result.expired) {
        throw createHttpError(
          404,
          'This setup link is invalid or has expired. Ask for a new portal access email.',
          'NOT_FOUND'
        );
      }

      validatePassword(req.body?.password, req.body?.confirmPassword);
      const passwordHash = await hashPassword(String(req.body.password));
      completePortalPasswordSetup(result.project.id, passwordHash);

      const { token, expiresAt } = createProjectClientSession(result.project.id);
      setClientSessionCookie(res, token, expiresAt);

      const bundle = getPortalProjectBundle(result.project.id);
      return res.status(200).json({ ok: true, project: mapPortalOverview(bundle) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/login',
  clientPortalAuthLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const project = getProjectById(req.params.id);
      if (!project || !project.portal_password_hash) {
        throw createHttpError(
          401,
          'Portal access is not set up yet. Use the setup link from your email.',
          'UNAUTHORIZED'
        );
      }

      const ok = await verifyPassword(String(req.body?.password || ''), project.portal_password_hash);
      if (!ok) {
        throw createHttpError(401, 'Incorrect password.', 'UNAUTHORIZED');
      }

      const { token, expiresAt } = createProjectClientSession(project.id);
      setClientSessionCookie(res, token, expiresAt);

      const bundle = getPortalProjectBundle(project.id);
      return res.status(200).json({ ok: true, project: mapPortalOverview(bundle) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/:id/logout', requireSameOrigin, express.json({ limit: '8kb' }), (req, res, next) => {
  try {
    const token = getClientSessionToken(req);
    destroyClientSession(token);
    clearClientSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/session', (req, res, next) => {
  try {
    const project = getProjectById(req.params.id);
    if (!project) {
      throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
    }

    const token = getClientSessionToken(req);
    const session = getValidClientSession(token);
    const authenticated = Boolean(session && session.project_id === project.id);

    return res.status(200).json({
      ok: true,
      authenticated,
      mustSetPassword: !project.portal_password_hash,
      project: {
        id: project.id,
        businessName: displayNameForProject(project.id),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id', requireClientProject, (req, res, next) => {
  try {
    runActivationTickIfNeeded();
    maybeActivateProject(req.params.id);
    const bundle = getPortalProjectBundle(req.params.id);
    if (!bundle) {
      throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
    }
    return res.status(200).json({ ok: true, project: mapPortalOverview(bundle) });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/:id/checkout',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      if (!isStripeEnabled()) {
        throw createHttpError(503, 'Stripe is not configured.', 'STRIPE_NOT_CONFIGURED');
      }
      const invoiceId = trimToNull(req.body?.invoiceId);
      if (!invoiceId) {
        throw createHttpError(400, 'invoiceId is required.', 'VALIDATION_ERROR');
      }

      const invoice = getInvoiceById(invoiceId);
      if (!invoice || invoice.project_id !== req.params.id || invoice.status !== 'due') {
        throw createHttpError(404, 'Invoice not found or not payable.', 'NOT_FOUND');
      }
      if (!['deposit', 'balance', 'full'].includes(invoice.kind)) {
        throw createHttpError(400, 'This invoice cannot be paid via checkout.', 'VALIDATION_ERROR');
      }

      const bundle = getPortalProjectBundle(req.params.id);
      if (!bundle?.client) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      const session = await createDesignCheckoutSession({
        invoice,
        client: bundle.client,
        projectId: req.params.id,
      });
      markInvoiceCheckoutSession(invoice.id, session.id);

      return res.status(200).json({ ok: true, url: session.url });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/hosting/checkout',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      if (!isStripeEnabled()) {
        throw createHttpError(503, 'Stripe is not configured.', 'STRIPE_NOT_CONFIGURED');
      }

      const bundle = getPortalProjectBundle(req.params.id);
      if (!bundle?.client) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      const hostingPlan = bundle.proposal?.hosting_plan;
      const priceId =
        findHostingInvoiceForProject(req.params.id)?.stripe_price_id ||
        stripePriceIdForPlan(hostingPlan);
      if (!priceId) {
        throw createHttpError(400, 'No hosting plan is configured for this project.', 'VALIDATION_ERROR');
      }
      if (!bundle.project.ready_for_launch_at) {
        throw createHttpError(
          400,
          'Hosting is available when your site is ready to launch.',
          'HOSTING_NOT_READY'
        );
      }
      try {
        assertRealHostingPriceId(priceId);
      } catch (err) {
        throw createHttpError(err.status || 503, err.message, err.code || 'STRIPE_PRICE_NOT_CONFIGURED');
      }

      const hostingInvoice = findHostingInvoiceForProject(req.params.id);
      const session = await createHostingCheckoutSession({
        projectId: req.params.id,
        client: bundle.client,
        priceId,
        invoiceId: hostingInvoice?.id || null,
      });
      if (hostingInvoice) {
        markInvoiceCheckoutSession(hostingInvoice.id, session.id);
      }

      return res.status(200).json({ ok: true, url: session.url });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/hosting/portal',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      if (!isStripeEnabled()) {
        throw createHttpError(503, 'Stripe is not configured.', 'STRIPE_NOT_CONFIGURED');
      }

      const bundle = getPortalProjectBundle(req.params.id);
      if (!bundle?.client) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }
      if (!bundle.client.stripe_customer_id && !bundle.project.stripe_subscription_id) {
        throw createHttpError(
          400,
          'No Stripe customer yet. Start a hosting subscription first.',
          'VALIDATION_ERROR'
        );
      }

      const session = await createBillingPortalSession(bundle.client, req.params.id);
      return res.status(200).json({ ok: true, url: session.url });
    } catch (error) {
      return next(error);
    }
  }
);

router.patch(
  '/:id/domain',
  requireClientProject,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  (req, res, next) => {
    try {
      const errors = {};
      let domainName;
      let domainStatus;

      if (req.body?.domainName !== undefined) {
        domainName = enforceMaxLength(trimToNull(req.body.domainName), LIMITS.domainName);
      }
      if (req.body?.domainStatus !== undefined) {
        domainStatus = trimToNull(req.body.domainStatus) || 'unknown';
        if (!DOMAIN_STATUSES.includes(domainStatus)) {
          errors.domainStatus = 'Choose a valid domain status.';
        }
      }

      if (Object.keys(errors).length) {
        throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
      }

      const updated = updateProjectDomain(req.params.id, { domainName, domainStatus });
      if (!updated) {
        throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
      }

      const bundle = getPortalProjectBundle(req.params.id);
      return res.status(200).json({ ok: true, project: mapPortalOverview(bundle) });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:id/attachments',
  requireClientProject,
  (req, res, next) => {
    upload.array('files', 5)(req, res, (err) => {
      if (err) return next(err);
      return next();
    });
  },
  (req, res, next) => {
    let mapped = [];
    try {
      const bundle = getPortalProjectBundle(req.params.id);
      if (!bundle?.project?.inquiry_id) {
        throw createHttpError(400, 'This project has no linked inquiry for uploads.', 'BAD_REQUEST');
      }

      mapped = mapUploadedFiles(req.files || []);
      if (!mapped.length) {
        throw createHttpError(400, 'Choose at least one file to upload.', 'VALIDATION_ERROR');
      }

      insertAttachments(bundle.project.inquiry_id, mapped);
      const attachments = listAttachmentsForInquiry(bundle.project.inquiry_id).map(mapAttachmentMeta);
      return res.status(200).json({ ok: true, attachments });
    } catch (error) {
      removeFiles(mapped.length ? mapped : req.files || []);
      return next(error);
    }
  }
);

router.delete('/:id/attachments/:attachmentId', requireClientProject, (req, res, next) => {
  try {
    const bundle = getPortalProjectBundle(req.params.id);
    if (!bundle?.project?.inquiry_id) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const attachment = getAdminAttachment(bundle.project.inquiry_id, req.params.attachmentId);
    if (!attachment) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const deleted = deleteAttachmentById(attachment.id);
    if (deleted?.stored_name) {
      removeFiles([{ storedName: deleted.stored_name }]);
    }

    const attachments = listAttachmentsForInquiry(bundle.project.inquiry_id).map(mapAttachmentMeta);
    return res.status(200).json({ ok: true, attachments });
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/attachments/:attachmentId', requireClientProject, (req, res, next) => {
  try {
    const bundle = getPortalProjectBundle(req.params.id);
    if (!bundle?.project?.inquiry_id) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const attachment = getAdminAttachment(bundle.project.inquiry_id, req.params.attachmentId);
    if (!attachment) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const filePath = resolveUploadPath(attachment.stored_name);
    if (!filePath || !fs.existsSync(filePath)) {
      throw createHttpError(404, 'Attachment not found.', 'NOT_FOUND');
    }

    const downloadName = sanitizeDownloadName(attachment.original_name);
    const shouldPreview =
      req.query.preview === '1' && PREVIEWABLE_MIME_TYPES.has(attachment.mime_type);
    res.set('Content-Type', attachment.mime_type || 'application/octet-stream');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Cache-Control', 'no-store');
    if (shouldPreview) {
      res.set('Content-Security-Policy', 'sandbox');
    }
    res.set(
      'Content-Disposition',
      `${shouldPreview ? 'inline' : 'attachment'}; filename="${downloadName}"`
    );
    return res.sendFile(filePath);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.mapPortalOverview = mapPortalOverview;
