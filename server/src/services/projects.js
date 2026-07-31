const {
  maybeActivateProject,
  markProjectStartedByAdmin,
  markProjectCompleted,
  setProjectReadyForLaunch,
} = require('./billing/invoices');
const {
  sendProjectStartedEmail,
  sendProjectCompletedEmail,
  sendProjectReadyForLaunchEmail,
} = require('./email');
const { getDb } = require('../db');
const { resolveHostingPlan } = require('../config/constants');
const { createHttpError } = require('../utils/normalize');

function loadProjectEmailBundle(projectId, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  const client = project.client_id
    ? database
        .prepare(
          `SELECT id, name, email, phone, business_name FROM clients WHERE id = ?`
        )
        .get(project.client_id)
    : null;

  const inquiry = project.inquiry_id
    ? database.prepare('SELECT * FROM inquiries WHERE id = ?').get(project.inquiry_id)
    : null;

  const proposal = project.proposal_id
    ? database.prepare('SELECT * FROM proposals WHERE id = ?').get(project.proposal_id)
    : null;

  return { project, client, inquiry, proposal };
}

function hasHostingPlan(proposal) {
  if (!proposal) return false;
  const plan = resolveHostingPlan(proposal.hosting_plan);
  return plan.key !== 'none';
}

async function sendStartedSafe(bundle, startedBy) {
  try {
    await sendProjectStartedEmail({
      project: bundle.project,
      client: bundle.client,
      inquiry: bundle.inquiry,
      startedBy,
    });
  } catch (err) {
    console.error('Project started email failed:', err.message || err);
  }
}

async function notifyIfAutoActivated(result) {
  if (!result?.activated || !result.project?.id) return result;
  const bundle = loadProjectEmailBundle(result.project.id);
  if (!bundle) return result;
  await sendStartedSafe(bundle, 'system');
  return result;
}

async function startProjectByAdmin(projectId) {
  const { project, started } = markProjectStartedByAdmin(projectId);
  if (!project) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }
  if (started) {
    const bundle = loadProjectEmailBundle(projectId);
    if (bundle) await sendStartedSafe(bundle, 'admin');
  }
  return { project, started };
}

async function completeProject(projectId) {
  const { project, completed } = markProjectCompleted(projectId);
  if (!project) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }
  if (completed) {
    const bundle = loadProjectEmailBundle(projectId);
    if (bundle) {
      try {
        await sendProjectCompletedEmail({
          project: bundle.project,
          client: bundle.client,
          inquiry: bundle.inquiry,
          hasHostingPlan: hasHostingPlan(bundle.proposal),
        });
      } catch (err) {
        console.error('Project completed email failed:', err.message || err);
      }
    }
  }
  return { project, completed };
}

async function setReadyForLaunch(projectId, ready) {
  const { project, unlocked } = setProjectReadyForLaunch(projectId, ready);
  if (!project) {
    throw createHttpError(404, 'Project not found.', 'NOT_FOUND');
  }
  if (unlocked) {
    const bundle = loadProjectEmailBundle(projectId);
    if (bundle) {
      try {
        await sendProjectReadyForLaunchEmail({
          project: bundle.project,
          client: bundle.client,
          inquiry: bundle.inquiry,
        });
      } catch (err) {
        console.error('Ready for launch email failed:', err.message || err);
      }
    }
  }
  return { project, unlocked };
}

/**
 * Run auto-activation and notify if this call activated the project.
 * @returns {{ project: object|null, activated: boolean }}
 */
async function maybeActivateAndNotify(projectId, database = getDb()) {
  const result = maybeActivateProject(projectId, database);
  await notifyIfAutoActivated(result);
  return result;
}

module.exports = {
  loadProjectEmailBundle,
  notifyIfAutoActivated,
  startProjectByAdmin,
  completeProject,
  setReadyForLaunch,
  maybeActivateAndNotify,
};
