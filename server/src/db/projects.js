const { randomUUID } = require('crypto');
const { getDb } = require('./client');
const { PROJECT_STATUSES } = require('../config/constants');
const { createHttpError } = require('../utils/normalize');
const { escapeLike } = require('./helpers');
const { syncInquiryPipeline } = require('./inquiries');

const PROJECT_SORT_COLUMNS = {
  created_at: 'p.created_at',
  name: 'p.name',
  status: 'p.status',
};

/**
 * Architecture helper for later accept-proposal flow. Syncs inquiry pipeline.
 */
function createProject(payload, database = getDb()) {
  const id = payload.id || randomUUID();
  database
    .prepare(
      `INSERT INTO projects (
         id, client_id, proposal_id, inquiry_id, status, name,
         domain_name, domain_status
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      payload.clientId,
      payload.proposalId,
      payload.inquiryId ?? null,
      payload.status || 'on_hold',
      payload.name,
      payload.domainName ?? null,
      payload.domainStatus || 'unknown'
    );

  if (payload.inquiryId) {
    syncInquiryPipeline(payload.inquiryId, database);
  }

  return database.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
}

function getProjectById(id, database = getDb()) {
  return database.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
}

function updateProjectFields(
  projectId,
  { domainName, domainStatus, workingBrief } = {},
  database = getDb()
) {
  const existing = getProjectById(projectId, database);
  if (!existing) return null;

  const nextName = domainName !== undefined ? domainName : existing.domain_name;
  const nextStatus =
    domainStatus !== undefined ? domainStatus : existing.domain_status || 'unknown';
  const nextBrief =
    workingBrief !== undefined ? workingBrief : existing.working_brief;

  database
    .prepare(
      `UPDATE projects SET
         domain_name = ?,
         domain_status = ?,
         working_brief = ?,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(nextName || null, nextStatus || 'unknown', nextBrief || null, projectId);

  return getProjectById(projectId, database);
}

/** @deprecated Prefer updateProjectFields */
function updateProjectDomain(projectId, patch, database = getDb()) {
  return updateProjectFields(projectId, patch, database);
}

function getProjectByProposalId(proposalId, database = getDb()) {
  return database.prepare(`SELECT * FROM projects WHERE proposal_id = ?`).get(proposalId);
}

function getProjectForInquiry(inquiryId, database = getDb()) {
  return database
    .prepare(
      `SELECT
         p.id, p.status, p.name, p.created_at, p.updated_at, p.proposal_id, p.inquiry_id, p.client_id,
         pr.package_slug AS proposal_package_slug,
         pr.kickoff_date AS proposal_kickoff_date,
         c.name AS client_name,
         c.business_name AS client_business_name,
         i.business_name AS inquiry_business_name
       FROM projects p
       LEFT JOIN proposals pr ON pr.id = p.proposal_id
       LEFT JOIN clients c ON c.id = p.client_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       WHERE p.inquiry_id = ?
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT 1`
    )
    .get(inquiryId);
}

/**
 * Architecture helper for later pause/resume/complete/cancel flows.
 */
function updateProjectStatus(projectId, status, database = getDb()) {
  if (!PROJECT_STATUSES.includes(status)) {
    throw createHttpError(400, 'Invalid project status.', 'VALIDATION_ERROR', { status });
  }

  const existing = database.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId);
  if (!existing) return null;

  database
    .prepare(
      `UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(status, projectId);

  if (existing.inquiry_id) {
    syncInquiryPipeline(existing.inquiry_id, database);
  }

  return database.prepare(`SELECT * FROM projects WHERE id = ?`).get(projectId);
}

function listAdminProjects({
  search = '',
  status = '',
  sort = 'created_at',
  dir = 'desc',
  page = 1,
  pageSize = 20,
} = {}) {
  const database = getDb();
  const where = [];
  const params = {};

  const q = String(search || '').trim();
  if (q) {
    where.push(
      `(p.name LIKE @search ESCAPE '\\' OR c.name LIKE @search ESCAPE '\\' OR c.business_name LIKE @search ESCAPE '\\' OR IFNULL(i.business_name, '') LIKE @search ESCAPE '\\' OR c.email LIKE @search ESCAPE '\\')`
    );
    params.search = `%${escapeLike(q)}%`;
  }

  if (['active', 'on_hold', 'completed', 'cancelled'].includes(status)) {
    where.push('p.status = @status');
    params.status = status;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortColumn = PROJECT_SORT_COLUMNS[sort] || PROJECT_SORT_COLUMNS.created_at;
  const sortDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const total = database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM projects p
       INNER JOIN clients c ON c.id = p.client_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       LEFT JOIN proposals pr ON pr.id = p.proposal_id
       ${whereSql}`
    )
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT
         p.id, p.name, p.status, p.proposal_id, p.inquiry_id, p.client_id,
         p.created_at, p.updated_at,
         p.design_payment_status, p.hosting_status,
         c.name AS client_name, c.business_name AS client_business_name, c.email AS client_email,
         i.stage AS inquiry_stage, i.type AS inquiry_type,
         i.package_slug AS inquiry_package_slug,
         i.business_name AS inquiry_business_name,
         pr.package_slug AS proposal_package_slug
       FROM projects p
       INNER JOIN clients c ON c.id = p.client_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       LEFT JOIN proposals pr ON pr.id = p.proposal_id
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}, p.id ${sortDir}
       LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: safePageSize, offset });

  return {
    rows,
    total,
    page: safePage,
    pageSize: safePageSize,
    totalPages: Math.max(1, Math.ceil(total / safePageSize)),
  };
}

function getAdminProjectById(id, database = getDb()) {
  const row = database
    .prepare(
      `SELECT
         p.id, p.name, p.status, p.proposal_id, p.inquiry_id, p.client_id,
         p.created_at, p.updated_at,
         p.portal_password_hash, p.portal_setup_token_hash, p.portal_setup_expires_at,
         p.portal_password_set_at,
         p.domain_name, p.domain_status, p.working_brief,
         p.design_payment_status, p.hosting_status,
         p.stripe_subscription_id, p.started_at, p.started_by,
         p.ready_for_launch_at,
         p.stripe_hosting_price_id, p.hosting_cancel_at_period_end,
         p.hosting_current_period_end, p.hosting_canceled_at,
         c.name AS client_name, c.business_name AS client_business_name,
         c.email AS client_email, c.phone AS client_phone,
         i.stage AS inquiry_stage, i.type AS inquiry_type,
         i.package_slug AS inquiry_package_slug, i.name AS inquiry_name,
         i.business_name AS inquiry_business_name, i.email AS inquiry_email,
         i.message AS inquiry_message, i.phone AS inquiry_phone,
         i.website_goals, i.current_website, i.requested_features,
         i.inspiration_links, i.domain_info, i.domain_name AS inquiry_domain_name,
         i.branding_notes,
         i.content_readiness, i.timeline AS inquiry_timeline, i.budget AS inquiry_budget,
         i.created_at AS inquiry_created_at,
         pr.status AS proposal_status, pr.design_amount_cents, pr.hosting_monthly_cents,
         pr.hosting_plan AS proposal_hosting_plan,
         pr.currency AS proposal_currency, pr.summary AS proposal_summary,
         pr.scope AS proposal_scope, pr.deliverables AS proposal_deliverables,
         pr.exclusions AS proposal_exclusions, pr.timeline_summary AS proposal_timeline_summary,
         pr.payment_schedule AS proposal_payment_schedule, pr.kickoff_date AS proposal_kickoff_date,
         pr.revision_limit AS proposal_revision_limit,
         pr.package_slug AS proposal_package_slug,
         pr.decline_reason AS proposal_decline_reason,
         pr.sent_at AS proposal_sent_at, pr.accepted_at AS proposal_accepted_at,
         pr.declined_at AS proposal_declined_at, pr.updated_at AS proposal_updated_at,
         pr.created_at AS proposal_created_at
       FROM projects p
       INNER JOIN clients c ON c.id = p.client_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       LEFT JOIN proposals pr ON pr.id = p.proposal_id
       WHERE p.id = ?`
    )
    .get(id);

  return row || null;
}

module.exports = {
  createProject,
  getProjectById,
  updateProjectFields,
  updateProjectDomain,
  getProjectByProposalId,
  getProjectForInquiry,
  updateProjectStatus,
  listAdminProjects,
  getAdminProjectById,
};
