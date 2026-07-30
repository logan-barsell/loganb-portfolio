const {
  PACKAGE_LABELS,
  CLIENT_PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUSES,
  PAYMENT_SCHEDULES,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  formatRevisionLimitLabel,
  HOSTING_PLANS,
  DEFAULT_HOSTING_PLAN,
  resolveHostingPlan,
  hostingPlanFromCents,
  LIMITS,
} = require('../config/constants');
const { config } = require('../config');
const {
  getProposalById,
  markProposalSent,
  createProposalShare,
  prepareProposalShareToken,
  listRevisionRequestsForProposal,
  getProposalShareByRawToken,
  acceptProposal,
  declineProposal,
  requestProposalRevision,
} = require('../db');
const {
  sendProposalShareEmail,
  sendProposalAcceptedEmails,
  sendProposalRevisionEmails,
  sendProposalDeclinedEmails,
} = require('./email');
const {
  trimToNull,
  enforceMaxLength,
  createHttpError,
  normalizeEmail,
  isValidEmail,
} = require('../utils/normalize');
const { toIsoUtc, formatMoney } = require('../lib/format');

const DEFAULT_SHARE_MESSAGE =
  'Thank you for sharing your project details. I put together a proposal for you to review. Use the button below to open it — you can accept, request a revision, or decline from that page.';

const SHARE_NOT_FOUND_MESSAGE = 'This proposal link is invalid or has expired.';

function parseKickoffDate(value) {
  const raw = trimToNull(value);
  if (!raw) return { value: null };
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

function parseEmailList(value) {
  if (value === undefined || value === null || value === '') return [];
  return String(value)
    .split(',')
    .map((part) => normalizeEmail(part))
    .filter(Boolean);
}

async function sendProposalShare(proposalId, { to, cc, subject, message } = {}) {
  const proposal = getProposalById(proposalId);
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
  const recipient = normalizeEmail(to) || normalizeEmail(proposal.client.email);
  if (!isValidEmail(recipient)) {
    errors.to = 'Enter a valid recipient email.';
  }

  const ccList = parseEmailList(cc);
  const invalidCc = ccList.find((email) => !isValidEmail(email));
  if (invalidCc) {
    errors.cc = 'Enter valid CC emails, separated by commas.';
  }

  let finalSubject = enforceMaxLength(trimToNull(subject), LIMITS.proposalEmailSubject);
  if (!finalSubject) {
    const who = proposal.client.business_name || proposal.client.name || 'your project';
    finalSubject = `Website proposal for ${who}`;
  }

  let finalMessage = enforceMaxLength(trimToNull(message), LIMITS.proposalEmailMessage);
  if (!finalMessage) {
    finalMessage = DEFAULT_SHARE_MESSAGE;
  }

  if (Object.keys(errors).length) {
    throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
  }

  const prepared = prepareProposalShareToken();
  const viewUrl = `${config.publicAppUrl}/p/${prepared.rawToken}`;

  try {
    await sendProposalShareEmail({
      to: [recipient],
      cc: ccList,
      subject: finalSubject,
      message: finalMessage,
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

  return {
    proposal: updated,
    share: { expiresAt: toIsoUtc(prepared.expiresAt) },
  };
}

function mapRevisions(rows) {
  return (rows || []).map((row) => ({
    id: row.id,
    message: row.message,
    createdAt: toIsoUtc(row.created_at),
  }));
}

function mapSharePayload(proposal, share, revisions = []) {
  const inquiry = proposal.inquiry || {};
  const client = proposal.client || {};
  const status = proposal.status;

  return {
    expiresAt: toIsoUtc(share.expires_at),
    client: {
      name: client.name || null,
      businessName: client.business_name || null,
      email: client.email || null,
    },
    inquiry: {
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
      brandingNotes: inquiry.branding_notes || null,
      contentReadiness: inquiry.content_readiness || null,
      timeline: inquiry.timeline || null,
      budget: inquiry.budget || null,
      createdAt: toIsoUtc(inquiry.created_at),
    },
    proposal: {
      status,
      statusLabel: PROPOSAL_STATUS_LABELS[status] || status,
      clientStatusLabel: CLIENT_PROPOSAL_STATUS_LABELS[status] || null,
      summary: proposal.summary || null,
      scope: proposal.scope || null,
      deliverables: proposal.deliverables || null,
      exclusions: proposal.exclusions || null,
      timelineSummary: proposal.timeline_summary || null,
      paymentSchedule: proposal.payment_schedule || DEFAULT_PAYMENT_SCHEDULE,
      paymentTermsLabel: paymentScheduleLabel(
        proposal.payment_schedule || DEFAULT_PAYMENT_SCHEDULE
      ),
      paymentTerms: paymentScheduleLabel(proposal.payment_schedule || DEFAULT_PAYMENT_SCHEDULE),
      kickoffDate: proposal.kickoff_date || null,
      revisionLimit: proposal.revision_limit ?? null,
      revisionLimitLabel: formatRevisionLimitLabel(proposal.revision_limit),
      designAmountCents: proposal.design_amount_cents,
      designAmountLabel: formatMoney(proposal.design_amount_cents, proposal.currency),
      hostingMonthlyCents: proposal.hosting_monthly_cents,
      hostingMonthlyLabel: formatMoney(proposal.hosting_monthly_cents, proposal.currency),
      currency: proposal.currency,
      sentAt: toIsoUtc(proposal.sent_at),
      declineReason: proposal.decline_reason || null,
    },
    revisions: mapRevisions(revisions),
  };
}

function shareNotFound() {
  return createHttpError(404, SHARE_NOT_FOUND_MESSAGE, 'NOT_FOUND');
}

function loadValidShare(token) {
  const raw = String(token || '').trim();
  if (!raw || raw.length < 16) {
    throw shareNotFound();
  }

  const result = getProposalShareByRawToken(raw);
  if (!result || result.expired) {
    throw shareNotFound();
  }

  return result;
}

function buildShareResponse(proposalId, share) {
  const proposal = getProposalById(proposalId);
  const revisions = listRevisionRequestsForProposal(proposalId);
  return mapSharePayload(proposal, share, revisions);
}

async function sendDecisionEmailsSafe(sendFn) {
  try {
    await sendFn();
    return true;
  } catch (err) {
    console.error('Proposal decision email failed:', err);
    return false;
  }
}

function getShareByToken(token) {
  const { share, proposal } = loadValidShare(token);
  const revisions = listRevisionRequestsForProposal(proposal.id);
  return mapSharePayload(proposal, share, revisions);
}

async function acceptShare(token) {
  const { share, proposal } = loadValidShare(token);
  const result = acceptProposal(proposal.id);
  if (!result) {
    throw shareNotFound();
  }

  let emailSent = true;
  if (!result.already) {
    emailSent = await sendDecisionEmailsSafe(() =>
      sendProposalAcceptedEmails(result.proposal, {
        portalSetup: result.portalSetup || null,
        projectId: result.project?.id || null,
      })
    );
  }

  return {
    already: Boolean(result.already),
    emailSent,
    share: buildShareResponse(proposal.id, share),
  };
}

async function reviseShare(token, rawMessage) {
  const { share, proposal } = loadValidShare(token);

  let message;
  try {
    message = enforceMaxLength(trimToNull(rawMessage), LIMITS.proposalRevisionMessage);
  } catch (err) {
    throw createHttpError(400, err.message || 'Revision message is too long.', 'VALIDATION_ERROR', {
      message: err.message || 'Revision message is too long.',
    });
  }

  if (!message) {
    throw createHttpError(400, 'Please describe what you would like revised.', 'VALIDATION_ERROR', {
      message: 'Please describe what you would like revised.',
    });
  }

  const result = requestProposalRevision(proposal.id, message);
  if (!result) {
    throw shareNotFound();
  }

  const emailSent = await sendDecisionEmailsSafe(() =>
    sendProposalRevisionEmails(result.proposal, message)
  );

  return {
    emailSent,
    share: buildShareResponse(proposal.id, share),
  };
}

async function declineShare(token, rawReason) {
  const { share, proposal } = loadValidShare(token);

  let reason = null;
  try {
    reason = enforceMaxLength(trimToNull(rawReason), LIMITS.proposalDeclineReason);
  } catch (err) {
    throw createHttpError(400, err.message || 'Reason is too long.', 'VALIDATION_ERROR', {
      reason: err.message || 'Reason is too long.',
    });
  }

  const result = declineProposal(proposal.id, reason);
  if (!result) {
    throw shareNotFound();
  }

  let emailSent = true;
  if (!result.already) {
    emailSent = await sendDecisionEmailsSafe(() =>
      sendProposalDeclinedEmails(result.proposal, reason)
    );
  }

  return {
    already: Boolean(result.already),
    emailSent,
    share: buildShareResponse(proposal.id, share),
  };
}

module.exports = {
  parseKickoffDate,
  parseRevisionLimit,
  parseProposalBody,
  parseEmailList,
  sendProposalShare,
  mapSharePayload,
  getShareByToken,
  acceptShare,
  reviseShare,
  declineShare,
};
