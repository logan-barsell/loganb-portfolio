const {
  PROPOSAL_STATUS_TO_PIPELINE,
  PROJECT_STATUS_TO_PIPELINE,
} = require('./constants');

/**
 * Derive canonical inquiry pipeline status from related rows.
 * Priority: project → latest proposal → contacted (contact only) → new.
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
