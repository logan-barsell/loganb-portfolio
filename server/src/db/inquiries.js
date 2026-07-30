const { getDb } = require('./client');
const { INQUIRY_STAGES } = require('../config/constants');
const { computePipelineStatus } = require('../lib/pipeline');
const { createHttpError } = require('../utils/normalize');
const { escapeLike } = require('./helpers');
const { listAttachmentsForInquiry } = require('./attachments');

const SORT_COLUMNS = {
  created_at: 'created_at',
  name: 'name',
  package_slug: 'package_slug',
  stage: 'stage',
};

const PIPELINE_ORDER_SQL = `CASE stage
  WHEN 'new' THEN 0
  WHEN 'contacted' THEN 1
  WHEN 'draft_proposal' THEN 2
  WHEN 'sent_proposal' THEN 3
  WHEN 'revision_proposal' THEN 4
  WHEN 'declined_proposal' THEN 5
  WHEN 'active_project' THEN 6
  WHEN 'on_hold_project' THEN 7
  WHEN 'completed_project' THEN 8
  WHEN 'cancelled_project' THEN 9
  ELSE 99
END`;

function insertInquiry(payload) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO inquiries (
      id, type, name, email, message, phone, business_name, package_slug,
      website_goals, current_website, requested_features, inspiration_links,
      domain_info, domain_name, branding_notes, content_readiness, timeline, budget,
      notification_status, stage, client_id
    ) VALUES (
      @id, @type, @name, @email, @message, @phone, @business_name, @package_slug,
      @website_goals, @current_website, @requested_features, @inspiration_links,
      @domain_info, @domain_name, @branding_notes, @content_readiness, @timeline, @budget,
      @notification_status, @stage, @client_id
    )
  `);

  stmt.run({
    id: payload.id,
    type: payload.type,
    name: payload.name,
    email: payload.email,
    message: payload.message ?? null,
    phone: payload.phone ?? null,
    business_name: payload.businessName ?? null,
    package_slug: payload.packageSlug ?? null,
    website_goals: payload.websiteGoals ?? null,
    current_website: payload.currentWebsite ?? null,
    requested_features: payload.requestedFeatures ?? null,
    inspiration_links: payload.inspirationLinks ?? null,
    domain_info: payload.domainInfo ?? null,
    domain_name: payload.domainName ?? null,
    branding_notes: payload.brandingNotes ?? null,
    content_readiness: payload.contentReadiness ?? null,
    timeline: payload.timeline ?? null,
    budget: payload.budget ?? null,
    notification_status: payload.notificationStatus || 'pending',
    stage: payload.stage || 'new',
    client_id: payload.clientId ?? null,
  });
}

function updateNotificationStatus(id, status, error = null) {
  getDb()
    .prepare(
      `UPDATE inquiries
       SET notification_status = ?, notification_error = ?
       WHERE id = ?`
    )
    .run(status, error, id);
}

function getInquiryWithAttachments(id) {
  const database = getDb();
  const inquiry = database.prepare('SELECT * FROM inquiries WHERE id = ?').get(id);
  if (!inquiry) return null;
  const attachments = listAttachmentsForInquiry(id, database);
  return { ...inquiry, attachments };
}

function getLatestProposalForInquiry(inquiryId, database = getDb()) {
  return database
    .prepare(
      `SELECT id, status FROM proposals
       WHERE inquiry_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    )
    .get(inquiryId);
}

function syncInquiryPipeline(inquiryId, database = getDb()) {
  const { getProjectForInquiry } = require('./projects');

  const inquiry = database
    .prepare(`SELECT id, type, stage FROM inquiries WHERE id = ?`)
    .get(inquiryId);
  if (!inquiry) return null;

  const latestProposal = getLatestProposalForInquiry(inquiryId, database);
  const project = getProjectForInquiry(inquiryId, database);
  const nextStage = computePipelineStatus({
    type: inquiry.type,
    stage: inquiry.stage,
    latestProposal: latestProposal || null,
    project: project || null,
  });

  if (nextStage !== inquiry.stage) {
    database.prepare(`UPDATE inquiries SET stage = ? WHERE id = ?`).run(nextStage, inquiryId);
  }

  return nextStage;
}

function backfillInquiryPipeline(database = getDb()) {
  const hasProposals = database
    .prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'proposals'`)
    .get();
  if (!hasProposals) return;

  const ids = database.prepare(`SELECT id FROM inquiries`).all();
  for (const row of ids) {
    syncInquiryPipeline(row.id, database);
  }
}

function markInquiryContacted(inquiryId, database = getDb()) {
  const { getProjectForInquiry } = require('./projects');

  const inquiry = database.prepare(`SELECT * FROM inquiries WHERE id = ?`).get(inquiryId);
  if (!inquiry) {
    throw createHttpError(404, 'Inquiry not found.', 'NOT_FOUND');
  }
  if (inquiry.type !== 'contact') {
    throw createHttpError(
      400,
      'Only contact messages can be marked as contacted.',
      'INVALID_STAGE'
    );
  }
  if (inquiry.stage === 'contacted') {
    return inquiry;
  }
  if (inquiry.stage !== 'new') {
    throw createHttpError(
      400,
      'Only new contact messages can be marked as contacted.',
      'INVALID_STAGE'
    );
  }

  const proposal = getLatestProposalForInquiry(inquiryId, database);
  if (proposal) {
    throw createHttpError(
      400,
      'Cannot mark as contacted after a proposal exists.',
      'INVALID_STAGE'
    );
  }
  const project = getProjectForInquiry(inquiryId, database);
  if (project) {
    throw createHttpError(
      400,
      'Cannot mark as contacted after a project exists.',
      'INVALID_STAGE'
    );
  }

  database.prepare(`UPDATE inquiries SET stage = 'contacted' WHERE id = ?`).run(inquiryId);
  return database.prepare(`SELECT * FROM inquiries WHERE id = ?`).get(inquiryId);
}

function listAdminInquiries({
  search = '',
  type = '',
  stage = '',
  sort = 'stage',
  dir = 'asc',
  page = 1,
  pageSize = 20,
} = {}) {
  const database = getDb();
  const where = [];
  const params = {};

  const q = String(search || '').trim();
  if (q) {
    where.push(
      `(name LIKE @search ESCAPE '\\' OR IFNULL(business_name, '') LIKE @search ESCAPE '\\' OR email LIKE @search ESCAPE '\\')`
    );
    params.search = `%${escapeLike(q)}%`;
  }

  if (type === 'contact' || type === 'project') {
    where.push('type = @type');
    params.type = type;
  }

  if (INQUIRY_STAGES.includes(stage)) {
    where.push('stage = @stage');
    params.stage = stage;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  let orderSql;
  if (sort === 'stage' || !SORT_COLUMNS[sort]) {
    // Pipeline rank first; within a stage, newest submissions first.
    orderSql = `${PIPELINE_ORDER_SQL} ASC, created_at DESC, id DESC`;
  } else {
    const sortColumn = SORT_COLUMNS[sort];
    orderSql = `${sortColumn} ${sortDir}, id ${sortDir}`;
  }

  const total = database
    .prepare(`SELECT COUNT(*) AS count FROM inquiries ${whereSql}`)
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT id, type, name, email, business_name, package_slug, stage, created_at, client_id
       FROM inquiries
       ${whereSql}
       ORDER BY ${orderSql}
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

function getAdminInquiryById(id) {
  return getInquiryWithAttachments(id);
}

module.exports = {
  insertInquiry,
  updateNotificationStatus,
  getInquiryWithAttachments,
  getLatestProposalForInquiry,
  syncInquiryPipeline,
  backfillInquiryPipeline,
  markInquiryContacted,
  listAdminInquiries,
  getAdminInquiryById,
};
