const {
  PROPOSAL_STATUS_TO_PIPELINE,
  PROJECT_STATUS_TO_PIPELINE,
} = require('../config/constants');

/**
 * Derive canonical inquiry pipeline status from related rows.
 * Priority:
 *   declined proposal → Declined Proposal (even if linked project is cancelled)
 *   project → latest proposal → contacted (contact only) → new.
 *
 * @param {{
 *   type: string,
 *   stage?: string | null,
 *   latestProposal?: { status: string } | null,
 *   project?: { status: string } | null,
 * }} input
 * @returns {string}
 */
function computePipelineStatus({ type, stage, latestProposal, project }) {
  // Decline is a proposal decision — keep stage as Declined Proposal even when
  // the linked project was cancelled as a side effect of that decline.
  if (latestProposal?.status === 'declined') {
    return 'declined_proposal';
  }

  if (project && project.status) {
    return PROJECT_STATUS_TO_PIPELINE[project.status] || 'active_project';
  }

  if (latestProposal && latestProposal.status) {
    return PROPOSAL_STATUS_TO_PIPELINE[latestProposal.status] || 'draft_proposal';
  }

  if (type === 'contact' && stage === 'contacted') {
    return 'contacted';
  }

  return 'new';
}

module.exports = {
  computePipelineStatus,
};
