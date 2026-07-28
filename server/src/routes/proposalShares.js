const express = require('express');
const {
  PACKAGE_LABELS,
  CLIENT_PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_LABELS,
  DEFAULT_PAYMENT_SCHEDULE,
  paymentScheduleLabel,
  formatRevisionLimitLabel,
  LIMITS,
} = require('../constants');
const {
  getProposalShareByRawToken,
  acceptProposal,
  declineProposal,
  requestProposalRevision,
  listRevisionRequestsForProposal,
  getProposalById,
} = require('../db');
const {
  sendProposalAcceptedEmails,
  sendProposalRevisionEmails,
  sendProposalDeclinedEmails,
} = require('../email');
const { createHttpError, trimToNull, enforceMaxLength } = require('../utils/normalize');
const { proposalShareLimiter, proposalShareActionLimiter } = require('../middleware/rateLimit');

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
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: String(currency || 'usd').toUpperCase(),
    }).format(Number(cents) / 100);
  } catch {
    return `$${(Number(cents) / 100).toFixed(2)}`;
  }
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

function loadValidShare(token) {
  const raw = String(token || '').trim();
  if (!raw || raw.length < 16) {
    throw createHttpError(404, 'This proposal link is invalid or has expired.', 'NOT_FOUND');
  }

  const result = getProposalShareByRawToken(raw);
  if (!result || result.expired) {
    throw createHttpError(404, 'This proposal link is invalid or has expired.', 'NOT_FOUND');
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

router.get('/:token', proposalShareLimiter, (req, res, next) => {
  try {
    const { share, proposal } = loadValidShare(req.params.token);
    const revisions = listRevisionRequestsForProposal(proposal.id);

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      share: mapSharePayload(proposal, share, revisions),
    });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/:token/accept',
  proposalShareActionLimiter,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const { share, proposal } = loadValidShare(req.params.token);
      const result = acceptProposal(proposal.id);
      if (!result) {
        throw createHttpError(404, 'This proposal link is invalid or has expired.', 'NOT_FOUND');
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

      res.set('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        already: Boolean(result.already),
        emailSent,
        share: buildShareResponse(proposal.id, share),
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:token/revise',
  proposalShareActionLimiter,
  express.json({ limit: '32kb' }),
  async (req, res, next) => {
    try {
      const { share, proposal } = loadValidShare(req.params.token);
      let message;
      try {
        message = enforceMaxLength(
          trimToNull(req.body?.message),
          LIMITS.proposalRevisionMessage
        );
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
        throw createHttpError(404, 'This proposal link is invalid or has expired.', 'NOT_FOUND');
      }

      const emailSent = await sendDecisionEmailsSafe(() =>
        sendProposalRevisionEmails(result.proposal, message)
      );

      res.set('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        emailSent,
        share: buildShareResponse(proposal.id, share),
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:token/decline',
  proposalShareActionLimiter,
  express.json({ limit: '32kb' }),
  async (req, res, next) => {
    try {
      const { share, proposal } = loadValidShare(req.params.token);
      let reason = null;
      try {
        reason = enforceMaxLength(
          trimToNull(req.body?.reason),
          LIMITS.proposalDeclineReason
        );
      } catch (err) {
        throw createHttpError(400, err.message || 'Reason is too long.', 'VALIDATION_ERROR', {
          reason: err.message || 'Reason is too long.',
        });
      }

      const result = declineProposal(proposal.id, reason);
      if (!result) {
        throw createHttpError(404, 'This proposal link is invalid or has expired.', 'NOT_FOUND');
      }

      let emailSent = true;
      if (!result.already) {
        emailSent = await sendDecisionEmailsSafe(() =>
          sendProposalDeclinedEmails(result.proposal, reason)
        );
      }

      res.set('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        already: Boolean(result.already),
        emailSent,
        share: buildShareResponse(proposal.id, share),
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
