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
  DOMAIN_STATUS_LABELS,
  DESIGN_PAYMENT_STATUS_LABELS,
  HOSTING_STATUS_LABELS,
  intakeOptionLabel,
} = require('../config/constants');
const { config } = require('../config');
const {
  getProjectById,
  getAdminProjectById,
  getProjectForPortalSetup,
  completePortalPasswordSetup,
  getPortalProjectBundle,
  issuePortalSetupToken,
} = require('../db');
const {
  listInvoicesForProject,
  markInvoiceCheckoutSession,
  getInvoiceById,
  activationBlockReason,
  stripePriceIdForPlan,
  findHostingInvoiceForProject,
} = require('./billing/invoices');
const {
  isStripeEnabled,
  createDesignCheckoutSession,
  createHostingCheckoutSession,
  createBillingPortalSession,
} = require('./billing/stripeClient');
const { assertRealHostingPriceId } = require('./billing/subscriptionSync');
const { hashPassword, verifyPassword } = require('./auth/password');
const { createProjectClientSession } = require('./auth/clientSessions');
const { sendPortalAccessEmail } = require('./email');
const { createHttpError } = require('../utils/normalize');
const { toIsoUtc, formatMoney, mapAttachmentMeta } = require('../lib/format');

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

function loadSetupTarget(projectId, token) {
  const result = getProjectForPortalSetup(projectId, token);
  if (!result || result.expired) {
    throw createHttpError(
      404,
      'This setup link is invalid or has expired. Ask for a new portal access email.',
      'NOT_FOUND'
    );
  }
  return result;
}

async function completePortalSetup(projectId, token, { password, confirmPassword }) {
  const result = loadSetupTarget(projectId, token);

  validatePassword(password, confirmPassword);
  const passwordHash = await hashPassword(String(password));
  completePortalPasswordSetup(result.project.id, passwordHash);

  const session = createProjectClientSession(result.project.id);
  const bundle = getPortalProjectBundle(result.project.id);

  return { session, project: mapPortalOverview(bundle) };
}

async function loginToPortal(projectId, password) {
  const project = getProjectById(projectId);
  if (!project || !project.portal_password_hash) {
    throw createHttpError(
      401,
      'Portal access is not set up yet. Use the setup link from your email.',
      'UNAUTHORIZED'
    );
  }

  const ok = await verifyPassword(String(password || ''), project.portal_password_hash);
  if (!ok) {
    throw createHttpError(401, 'Incorrect password.', 'UNAUTHORIZED');
  }

  const session = createProjectClientSession(project.id);
  const bundle = getPortalProjectBundle(project.id);

  return { session, project: mapPortalOverview(bundle) };
}

function requireStripe() {
  if (!isStripeEnabled()) {
    throw createHttpError(503, 'Stripe is not configured.', 'STRIPE_NOT_CONFIGURED');
  }
}

function requirePortalBundle(projectId) {
  const bundle = getPortalProjectBundle(projectId);
  if (!bundle?.client) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }
  return bundle;
}

async function startDesignCheckout(projectId, invoiceId) {
  requireStripe();
  if (!invoiceId) {
    throw createHttpError(400, 'invoiceId is required.', 'VALIDATION_ERROR');
  }

  const invoice = getInvoiceById(invoiceId);
  if (!invoice || invoice.project_id !== projectId || invoice.status !== 'due') {
    throw createHttpError(404, 'Invoice not found or not payable.', 'NOT_FOUND');
  }
  if (!['deposit', 'balance', 'full'].includes(invoice.kind)) {
    throw createHttpError(400, 'This invoice cannot be paid via checkout.', 'VALIDATION_ERROR');
  }

  const bundle = requirePortalBundle(projectId);

  const session = await createDesignCheckoutSession({
    invoice,
    client: bundle.client,
    projectId,
  });
  markInvoiceCheckoutSession(invoice.id, session.id);

  return { url: session.url };
}

async function startHostingCheckout(projectId) {
  requireStripe();

  const bundle = requirePortalBundle(projectId);

  const hostingPlan = bundle.proposal?.hosting_plan;
  const priceId =
    findHostingInvoiceForProject(projectId)?.stripe_price_id || stripePriceIdForPlan(hostingPlan);
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

  const hostingInvoice = findHostingInvoiceForProject(projectId);
  const session = await createHostingCheckoutSession({
    projectId,
    client: bundle.client,
    priceId,
    invoiceId: hostingInvoice?.id || null,
  });
  if (hostingInvoice) {
    markInvoiceCheckoutSession(hostingInvoice.id, session.id);
  }

  return { url: session.url };
}

async function startBillingPortal(projectId) {
  requireStripe();

  const bundle = requirePortalBundle(projectId);
  if (!bundle.client.stripe_customer_id && !bundle.project.stripe_subscription_id) {
    throw createHttpError(
      400,
      'No Stripe customer yet. Start a hosting subscription first.',
      'VALIDATION_ERROR'
    );
  }

  const session = await createBillingPortalSession(bundle.client, projectId);
  return { url: session.url };
}

async function resendPortalAccess(projectId) {
  if (!config.publicAppUrl) {
    throw createHttpError(500, 'PUBLIC_APP_URL is not configured.', 'CONFIG_ERROR');
  }

  const row = getAdminProjectById(projectId);
  if (!row) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }

  const clientEmail = row.client_email;
  if (!clientEmail) {
    throw createHttpError(400, 'Client email is missing.', 'VALIDATION_ERROR');
  }

  const hadPassword = Boolean(row.portal_password_hash);
  // Rotate setup token only — keep existing password until they finish the new setup link.
  const portalSetup = issuePortalSetupToken(row.id, { resetPassword: false });
  if (!portalSetup) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }

  await sendPortalAccessEmail(
    {
      name: row.client_name,
      businessName: row.client_business_name,
      email: clientEmail,
    },
    {
      projectId: row.id,
      rawToken: portalSetup.rawToken,
      expiresAt: portalSetup.expiresAt,
      isReset: hadPassword,
    }
  );

  return {
    project: getAdminProjectById(row.id),
    message: hadPassword
      ? 'Portal setup link emailed. Current password still works until they finish setup.'
      : 'Portal access email sent.',
  };
}

module.exports = {
  mapPortalOverview,
  displayNameForProject,
  loadSetupTarget,
  completePortalSetup,
  loginToPortal,
  startDesignCheckout,
  startHostingCheckout,
  startBillingPortal,
  resendPortalAccess,
};
