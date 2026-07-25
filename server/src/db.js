const fs = require('fs');
const path = require('path');
const { randomUUID, createHash, randomBytes } = require('crypto');
const Database = require('better-sqlite3');
const { config } = require('./config');
const { INQUIRY_STAGES, PROJECT_STATUSES } = require('./constants');
const { computePipelineStatus } = require('./pipeline');
const { createHttpError } = require('./utils/normalize');

let db;

function getDb() {
  if (db) return db;

  const dir = path.dirname(config.databasePath);
  fs.mkdirSync(dir, { recursive: true });

  db = new Database(config.databasePath);
  db.pragma('journal_mode = WAL');
  db.pragma('busy_timeout = 5000');
  db.pragma('foreign_keys = ON');

  return db;
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

function runMigrations(database = getDb()) {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const alreadyApplied = new Set(
    database.prepare('SELECT id FROM schema_migrations').all().map((row) => row.id)
  );

  const insert = database.prepare('INSERT INTO schema_migrations (id) VALUES (?)');

  for (const file of files) {
    if (alreadyApplied.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    // Some migrations recreate tables referenced by FKs; PRAGMA foreign_keys
    // cannot be changed inside a transaction, so toggle around the apply.
    database.pragma('foreign_keys = OFF');
    try {
      const apply = database.transaction(() => {
        database.exec(sql);
        insert.run(file);
      });
      apply();
    } finally {
      database.pragma('foreign_keys = ON');
    }
  }

  backfillClients(database);
  backfillInquiryPipeline(database);
}

function normalizeClientEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

function findClientByEmail(email, database = getDb()) {
  const normalized = normalizeClientEmail(email);
  if (!normalized) return null;
  return database.prepare('SELECT * FROM clients WHERE email = ?').get(normalized);
}

function createClient({ id, name, email, phone, businessName }, database = getDb()) {
  const clientId = id || randomUUID();
  const normalizedEmail = normalizeClientEmail(email);
  database
    .prepare(
      `INSERT INTO clients (id, name, email, phone, business_name)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(clientId, name, normalizedEmail, phone ?? null, businessName);
  return database.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
}

function setInquiryClientId(inquiryId, clientId, database = getDb()) {
  database.prepare('UPDATE inquiries SET client_id = ? WHERE id = ?').run(clientId, inquiryId);
}

/**
 * Project: find-or-create client, return id.
 * Contact: return existing client id or null (orphan).
 * Never overwrites existing client fields.
 */
function resolveClientForInquiry({ type, name, email, phone, businessName }, database = getDb()) {
  const existing = findClientByEmail(email, database);
  if (existing) return existing.id;

  if (type !== 'project') return null;

  const client = createClient(
    {
      name,
      email,
      phone,
      businessName,
    },
    database
  );
  return client.id;
}

function backfillClients(database = getDb()) {
  const hasClientColumn = database
    .prepare(`PRAGMA table_info(inquiries)`)
    .all()
    .some((col) => col.name === 'client_id');
  if (!hasClientColumn) return;

  const projects = database
    .prepare(
      `SELECT id, name, email, phone, business_name
       FROM inquiries
       WHERE type = 'project' AND client_id IS NULL
       ORDER BY created_at ASC, id ASC`
    )
    .all();

  const attachProject = database.transaction((rows) => {
    for (const row of rows) {
      const email = normalizeClientEmail(row.email);
      if (!email || !row.name || !row.business_name) continue;

      let client = findClientByEmail(email, database);
      if (!client) {
        client = createClient(
          {
            name: row.name,
            email,
            phone: row.phone,
            businessName: row.business_name,
          },
          database
        );
      }
      setInquiryClientId(row.id, client.id, database);
    }
  });
  attachProject(projects);

  const contacts = database
    .prepare(
      `SELECT id, email
       FROM inquiries
       WHERE type = 'contact' AND client_id IS NULL
       ORDER BY created_at ASC, id ASC`
    )
    .all();

  const attachContacts = database.transaction((rows) => {
    for (const row of rows) {
      const client = findClientByEmail(row.email, database);
      if (!client) continue;
      setInquiryClientId(row.id, client.id, database);
    }
  });
  attachContacts(contacts);
}

function insertInquiry(payload) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO inquiries (
      id, type, name, email, message, phone, business_name, package_slug,
      website_goals, current_website, requested_features, inspiration_links,
      domain_info, branding_notes, content_readiness, timeline, budget,
      notification_status, stage, client_id
    ) VALUES (
      @id, @type, @name, @email, @message, @phone, @business_name, @package_slug,
      @website_goals, @current_website, @requested_features, @inspiration_links,
      @domain_info, @branding_notes, @content_readiness, @timeline, @budget,
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
    branding_notes: payload.brandingNotes ?? null,
    content_readiness: payload.contentReadiness ?? null,
    timeline: payload.timeline ?? null,
    budget: payload.budget ?? null,
    notification_status: payload.notificationStatus || 'pending',
    stage: payload.stage || 'new',
    client_id: payload.clientId ?? null,
  });
}

function insertAttachments(inquiryId, files) {
  if (!files || files.length === 0) return [];

  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO attachments (
      id, inquiry_id, original_name, stored_name, mime_type, size_bytes
    ) VALUES (
      @id, @inquiry_id, @original_name, @stored_name, @mime_type, @size_bytes
    )
  `);

  const saved = [];
  const insertMany = database.transaction((list) => {
    for (const file of list) {
      stmt.run({
        id: file.id,
        inquiry_id: inquiryId,
        original_name: file.originalName,
        stored_name: file.storedName,
        mime_type: file.mimeType,
        size_bytes: file.sizeBytes,
      });
      saved.push(file);
    }
  });

  insertMany(files);
  return saved;
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

function listAttachmentsForInquiry(inquiryId, database = getDb()) {
  if (!inquiryId) return [];
  return database
    .prepare('SELECT * FROM attachments WHERE inquiry_id = ? ORDER BY created_at ASC')
    .all(inquiryId);
}

function createSession({ tokenHash, credentialFingerprint, expiresAt }) {
  getDb()
    .prepare(
      `INSERT INTO admin_sessions (token_hash, credential_fingerprint, expires_at)
       VALUES (?, ?, ?)`
    )
    .run(tokenHash, credentialFingerprint, expiresAt);
}

function getSessionByTokenHash(tokenHash) {
  return getDb().prepare('SELECT * FROM admin_sessions WHERE token_hash = ?').get(tokenHash);
}

function touchSession(tokenHash) {
  getDb()
    .prepare(
      `UPDATE admin_sessions
       SET last_seen_at = datetime('now')
       WHERE token_hash = ?`
    )
    .run(tokenHash);
}

function deleteSessionByTokenHash(tokenHash) {
  getDb().prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(tokenHash);
}

function deleteExpiredSessions() {
  getDb()
    .prepare(`DELETE FROM admin_sessions WHERE expires_at <= datetime('now')`)
    .run();
}

function deleteSessionsByFingerprint(fingerprint) {
  getDb()
    .prepare('DELETE FROM admin_sessions WHERE credential_fingerprint = ?')
    .run(fingerprint);
}

function escapeLike(value) {
  return String(value).replace(/([\\%_])/g, '\\$1');
}

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

function getProjectForInquiry(inquiryId, database = getDb()) {
  return database
    .prepare(
      `SELECT id, status FROM projects
       WHERE inquiry_id = ?
       ORDER BY created_at DESC, id DESC
       LIMIT 1`
    )
    .get(inquiryId);
}

function syncInquiryPipeline(inquiryId, database = getDb()) {
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

/**
 * Architecture helper for later accept-proposal flow. Syncs inquiry pipeline.
 */
function createProject(payload, database = getDb()) {
  const id = payload.id || randomUUID();
  database
    .prepare(
      `INSERT INTO projects (id, client_id, proposal_id, inquiry_id, status, name)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      payload.clientId,
      payload.proposalId,
      payload.inquiryId ?? null,
      payload.status || 'active',
      payload.name
    );

  if (payload.inquiryId) {
    syncInquiryPipeline(payload.inquiryId, database);
  }

  return database.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
}

function getProjectById(id, database = getDb()) {
  return database.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
}

function getProjectByProposalId(proposalId, database = getDb()) {
  return database.prepare(`SELECT * FROM projects WHERE proposal_id = ?`).get(proposalId);
}

function listRevisionRequestsForProposal(proposalId, database = getDb()) {
  return database
    .prepare(
      `SELECT id, proposal_id, message, created_at
       FROM proposal_revision_requests
       WHERE proposal_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(proposalId);
}

function projectNameFromProposal(proposal) {
  const business =
    proposal.client?.business_name ||
    proposal.inquiry?.business_name ||
    proposal.client?.name ||
    proposal.inquiry?.name;
  return business ? `${business} Website` : 'Website Project';
}

/**
 * Accept proposal: set accepted, create or reactivate project.
 */
function acceptProposal(proposalId, database = getDb()) {
  const existing = getProposalById(proposalId, database);
  if (!existing) return null;
  if (existing.status === 'draft') {
    throw createHttpError(400, 'This proposal has not been sent yet.', 'INVALID_STATUS');
  }
  if (existing.status === 'accepted') {
    return { proposal: existing, project: getProjectByProposalId(proposalId, database), already: true };
  }

  const run = database.transaction(() => {
    database
      .prepare(
        `UPDATE proposals
         SET status = 'accepted', decline_reason = NULL, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(proposalId);

    let project = getProjectByProposalId(proposalId, database);
    if (project) {
      if (project.status !== 'active') {
        database
          .prepare(
            `UPDATE projects SET status = 'active', updated_at = datetime('now') WHERE id = ?`
          )
          .run(project.id);
        project = database.prepare(`SELECT * FROM projects WHERE id = ?`).get(project.id);
      }
    } else {
      project = createProject(
        {
          clientId: existing.client_id,
          proposalId: existing.id,
          inquiryId: existing.inquiry_id,
          status: 'active',
          name: projectNameFromProposal(existing),
        },
        database
      );
    }

    syncInquiryPipeline(existing.inquiry_id, database);
    return { proposal: getProposalById(proposalId, database), project, already: false };
  });

  return run();
}

/**
 * Decline proposal: set declined, cancel linked project if any.
 */
function declineProposal(proposalId, reason = null, database = getDb()) {
  const existing = getProposalById(proposalId, database);
  if (!existing) return null;
  if (existing.status === 'draft') {
    throw createHttpError(400, 'This proposal has not been sent yet.', 'INVALID_STATUS');
  }
  if (existing.status === 'declined') {
    return { proposal: existing, project: getProjectByProposalId(proposalId, database), already: true };
  }

  const run = database.transaction(() => {
    database
      .prepare(
        `UPDATE proposals
         SET status = 'declined', decline_reason = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(reason || null, proposalId);

    const project = getProjectByProposalId(proposalId, database);
    if (project && project.status !== 'cancelled') {
      database
        .prepare(
          `UPDATE projects SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`
        )
        .run(project.id);
    }

    syncInquiryPipeline(existing.inquiry_id, database);
    return {
      proposal: getProposalById(proposalId, database),
      project: getProjectByProposalId(proposalId, database),
      already: false,
    };
  });

  return run();
}

/**
 * Append a revision request and mark proposal revision_requested.
 */
function requestProposalRevision(proposalId, message, database = getDb()) {
  const existing = getProposalById(proposalId, database);
  if (!existing) return null;
  if (existing.status === 'draft') {
    throw createHttpError(400, 'This proposal has not been sent yet.', 'INVALID_STATUS');
  }

  const trimmed = String(message || '').trim();
  if (!trimmed) {
    throw createHttpError(400, 'Please describe what you would like revised.', 'VALIDATION_ERROR', {
      message: 'Please describe what you would like revised.',
    });
  }

  const run = database.transaction(() => {
    const id = randomUUID();
    database
      .prepare(
        `INSERT INTO proposal_revision_requests (id, proposal_id, message)
         VALUES (?, ?, ?)`
      )
      .run(id, proposalId, trimmed);

    database
      .prepare(
        `UPDATE proposals
         SET status = 'revision_requested', updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(proposalId);

    syncInquiryPipeline(existing.inquiry_id, database);

    return {
      proposal: getProposalById(proposalId, database),
      revision: database
        .prepare(`SELECT id, proposal_id, message, created_at FROM proposal_revision_requests WHERE id = ?`)
        .get(id),
      revisions: listRevisionRequestsForProposal(proposalId, database),
    };
  });

  return run();
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

function getAdminAttachment(inquiryId, attachmentId) {
  return getDb()
    .prepare(
      `SELECT a.*, i.id AS inquiry_exists
       FROM attachments a
       INNER JOIN inquiries i ON i.id = a.inquiry_id
       WHERE a.inquiry_id = ? AND a.id = ?`
    )
    .get(inquiryId, attachmentId);
}

const CLIENT_SORT_COLUMNS = {
  name: 'c.name',
  email: 'c.email',
  business_name: 'c.business_name',
};

function listAdminClients({
  search = '',
  sort = 'name',
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
      `(c.name LIKE @search ESCAPE '\\' OR c.business_name LIKE @search ESCAPE '\\' OR c.email LIKE @search ESCAPE '\\')`
    );
    params.search = `%${escapeLike(q)}%`;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortColumn = CLIENT_SORT_COLUMNS[sort] || CLIENT_SORT_COLUMNS.name;
  const sortDir = String(dir).toLowerCase() === 'desc' ? 'DESC' : 'ASC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const total = database
    .prepare(`SELECT COUNT(*) AS count FROM clients c ${whereSql}`)
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT
         c.id,
         c.name,
         c.email,
         c.phone,
         c.business_name,
         (
           SELECT i.stage
           FROM inquiries i
           WHERE i.client_id = c.id
           ORDER BY i.created_at DESC, i.id DESC
           LIMIT 1
         ) AS latest_stage
       FROM clients c
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}, c.id ${sortDir}
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

function getAdminClientById(id) {
  const database = getDb();
  const client = database.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  if (!client) return null;

  const inquiries = database
    .prepare(
      `SELECT id, type, name, email, business_name, package_slug, stage, created_at
       FROM inquiries
       WHERE client_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(id);

  const proposals = database
    .prepare(
      `SELECT id, inquiry_id, status, design_amount_cents, hosting_monthly_cents,
              currency, sent_at, created_at, updated_at
       FROM proposals
       WHERE client_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(id);

  return { ...client, inquiries, proposals };
}

function createProposal(payload, database = getDb()) {
  const id = payload.id || randomUUID();
  database
    .prepare(
      `INSERT INTO proposals (
         id, client_id, inquiry_id, status,
         summary, scope, deliverables, exclusions, timeline_summary,
         payment_terms, revision_limit, design_amount_cents, hosting_monthly_cents, currency
       ) VALUES (
         @id, @client_id, @inquiry_id, @status,
         @summary, @scope, @deliverables, @exclusions, @timeline_summary,
         @payment_terms, @revision_limit, @design_amount_cents, @hosting_monthly_cents, @currency
       )`
    )
    .run({
      id,
      client_id: payload.clientId,
      inquiry_id: payload.inquiryId,
      status: payload.status || 'draft',
      summary: payload.summary ?? null,
      scope: payload.scope ?? null,
      deliverables: payload.deliverables ?? null,
      exclusions: payload.exclusions ?? null,
      timeline_summary: payload.timelineSummary ?? null,
      payment_terms: payload.paymentTerms ?? null,
      revision_limit: payload.revisionLimit ?? null,
      design_amount_cents: payload.designAmountCents,
      hosting_monthly_cents: payload.hostingMonthlyCents ?? null,
      currency: payload.currency || 'usd',
    });
  syncInquiryPipeline(payload.inquiryId, database);
  return getProposalById(id, database);
}

function updateProposal(id, patch, database = getDb()) {
  const existing = database.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (!existing) return null;

  const next = {
    summary: patch.summary !== undefined ? patch.summary : existing.summary,
    scope: patch.scope !== undefined ? patch.scope : existing.scope,
    deliverables: patch.deliverables !== undefined ? patch.deliverables : existing.deliverables,
    exclusions: patch.exclusions !== undefined ? patch.exclusions : existing.exclusions,
    timeline_summary:
      patch.timelineSummary !== undefined ? patch.timelineSummary : existing.timeline_summary,
    payment_terms: patch.paymentTerms !== undefined ? patch.paymentTerms : existing.payment_terms,
    revision_limit:
      patch.revisionLimit !== undefined ? patch.revisionLimit : existing.revision_limit,
    design_amount_cents:
      patch.designAmountCents !== undefined
        ? patch.designAmountCents
        : existing.design_amount_cents,
    hosting_monthly_cents:
      patch.hostingMonthlyCents !== undefined
        ? patch.hostingMonthlyCents
        : existing.hosting_monthly_cents,
    status: patch.status !== undefined ? patch.status : existing.status,
    sent_at: existing.sent_at,
  };

  if (patch.status === 'sent' && existing.status !== 'sent') {
    next.sent_at = new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  }
  if (patch.status === 'draft' && existing.status === 'sent') {
    next.sent_at = null;
  }

  database
    .prepare(
      `UPDATE proposals SET
         summary = @summary,
         scope = @scope,
         deliverables = @deliverables,
         exclusions = @exclusions,
         timeline_summary = @timeline_summary,
         payment_terms = @payment_terms,
         revision_limit = @revision_limit,
         design_amount_cents = @design_amount_cents,
         hosting_monthly_cents = @hosting_monthly_cents,
         status = @status,
         sent_at = @sent_at,
         updated_at = datetime('now')
       WHERE id = @id`
    )
    .run({ id, ...next });

  syncInquiryPipeline(existing.inquiry_id, database);

  return getProposalById(id, database);
}

function getProposalById(id, database = getDb()) {
  const proposal = database.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (!proposal) return null;

  const client = database
    .prepare(
      `SELECT id, name, email, phone, business_name FROM clients WHERE id = ?`
    )
    .get(proposal.client_id);

  const inquiry = database
    .prepare(
      `SELECT id, type, name, email, business_name, package_slug, stage, website_goals,
              current_website, requested_features, inspiration_links, domain_info,
              branding_notes, content_readiness, timeline, budget, message, phone,
              created_at, client_id
       FROM inquiries WHERE id = ?`
    )
    .get(proposal.inquiry_id);

  return { ...proposal, client, inquiry };
}

/** Always set status=sent and refresh sent_at (used by send/resend). */
function markProposalSent(id, database = getDb()) {
  const existing = database.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
  if (!existing) return null;

  const sentAt = new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  database
    .prepare(
      `UPDATE proposals SET status = 'sent', sent_at = ?, updated_at = datetime('now') WHERE id = ?`
    )
    .run(sentAt, id);

  syncInquiryPipeline(existing.inquiry_id, database);
  return getProposalById(id, database);
}

function hashShareToken(rawToken) {
  return createHash('sha256').update(String(rawToken)).digest('hex');
}

function generateShareToken() {
  return randomBytes(32).toString('base64url');
}

function sqliteExpiryFromNow(days) {
  const ms = Date.now() + Number(days) * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

function deleteSharesForProposal(proposalId, database = getDb()) {
  database.prepare(`DELETE FROM proposal_shares WHERE proposal_id = ?`).run(proposalId);
}

/**
 * Invalidate prior shares and create a new one. Returns { id, rawToken, expiresAt }.
 * Pass precomputed rawToken/expiresAt to send email before persisting.
 */
function createProposalShare(proposalId, options = {}, database = getDb()) {
  const rawToken = options.rawToken || generateShareToken();
  const tokenHash = hashShareToken(rawToken);
  const id = randomUUID();
  const expiresAt = options.expiresAt || sqliteExpiryFromNow(config.proposalShareTtlDays);

  const run = database.transaction(() => {
    deleteSharesForProposal(proposalId, database);
    database
      .prepare(
        `INSERT INTO proposal_shares (id, proposal_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`
      )
      .run(id, proposalId, tokenHash, expiresAt);
  });
  run();

  return { id, rawToken, expiresAt };
}

function prepareProposalShareToken() {
  return {
    rawToken: generateShareToken(),
    expiresAt: sqliteExpiryFromNow(config.proposalShareTtlDays),
  };
}

function getProposalShareByRawToken(rawToken, database = getDb()) {
  const tokenHash = hashShareToken(rawToken);
  const share = database
    .prepare(`SELECT * FROM proposal_shares WHERE token_hash = ?`)
    .get(tokenHash);
  if (!share) return null;

  const expiresMs = Date.parse(
    /Z$|[+-]\d{2}:?\d{2}$/.test(share.expires_at)
      ? share.expires_at
      : `${String(share.expires_at).replace(' ', 'T')}Z`
  );
  if (!Number.isFinite(expiresMs) || expiresMs < Date.now()) {
    return { expired: true, share };
  }

  const proposal = getProposalById(share.proposal_id, database);
  if (!proposal) return null;

  return { expired: false, share, proposal };
}

function listProposalsByInquiryId(inquiryId, database = getDb()) {
  return database
    .prepare(
      `SELECT id, status, design_amount_cents, currency, sent_at, created_at
       FROM proposals
       WHERE inquiry_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .all(inquiryId);
}

const PROPOSAL_SORT_COLUMNS = {
  created_at: 'p.created_at',
  sent_at: 'p.sent_at',
  design_amount_cents: 'p.design_amount_cents',
};

function listAdminProposals({
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
      `(c.name LIKE @search ESCAPE '\\' OR c.business_name LIKE @search ESCAPE '\\' OR c.email LIKE @search ESCAPE '\\')`
    );
    params.search = `%${escapeLike(q)}%`;
  }

  if (
    status === 'draft' ||
    status === 'sent' ||
    status === 'revision_requested' ||
    status === 'accepted' ||
    status === 'declined'
  ) {
    where.push('p.status = @status');
    params.status = status;
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sortColumn = PROPOSAL_SORT_COLUMNS[sort] || PROPOSAL_SORT_COLUMNS.created_at;
  const sortDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const total = database
    .prepare(
      `SELECT COUNT(*) AS count
       FROM proposals p
       INNER JOIN clients c ON c.id = p.client_id
       ${whereSql}`
    )
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT
         p.id, p.status, p.design_amount_cents, p.hosting_monthly_cents,
         p.currency, p.sent_at, p.created_at, p.updated_at, p.inquiry_id, p.client_id,
         c.name AS client_name, c.business_name AS client_business_name, c.email AS client_email,
         i.stage AS inquiry_stage,
         i.type AS inquiry_type,
         i.package_slug AS inquiry_package_slug
       FROM proposals p
       INNER JOIN clients c ON c.id = p.client_id
       INNER JOIN inquiries i ON i.id = p.inquiry_id
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

const PROJECT_SORT_COLUMNS = {
  created_at: 'p.created_at',
  name: 'p.name',
  status: 'p.status',
};

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
      `(p.name LIKE @search ESCAPE '\\' OR c.name LIKE @search ESCAPE '\\' OR c.business_name LIKE @search ESCAPE '\\' OR c.email LIKE @search ESCAPE '\\')`
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
       ${whereSql}`
    )
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT
         p.id, p.name, p.status, p.proposal_id, p.inquiry_id, p.client_id,
         p.created_at, p.updated_at,
         c.name AS client_name, c.business_name AS client_business_name, c.email AS client_email,
         i.stage AS inquiry_stage, i.type AS inquiry_type,
         i.package_slug AS inquiry_package_slug
       FROM projects p
       INNER JOIN clients c ON c.id = p.client_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
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
         c.name AS client_name, c.business_name AS client_business_name,
         c.email AS client_email, c.phone AS client_phone,
         i.stage AS inquiry_stage, i.type AS inquiry_type,
         i.package_slug AS inquiry_package_slug, i.name AS inquiry_name,
         i.business_name AS inquiry_business_name, i.email AS inquiry_email,
         i.created_at AS inquiry_created_at,
         pr.status AS proposal_status, pr.design_amount_cents, pr.hosting_monthly_cents,
         pr.currency AS proposal_currency, pr.summary AS proposal_summary,
         pr.sent_at AS proposal_sent_at, pr.created_at AS proposal_created_at
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
  getDb,
  closeDb,
  runMigrations,
  backfillClients,
  backfillInquiryPipeline,
  syncInquiryPipeline,
  markInquiryContacted,
  createProject,
  updateProjectStatus,
  getProjectById,
  getProjectByProposalId,
  getAdminProjectById,
  acceptProposal,
  declineProposal,
  requestProposalRevision,
  listRevisionRequestsForProposal,
  insertInquiry,
  insertAttachments,
  updateNotificationStatus,
  getInquiryWithAttachments,
  listAttachmentsForInquiry,
  createSession,
  getSessionByTokenHash,
  touchSession,
  deleteSessionByTokenHash,
  deleteExpiredSessions,
  deleteSessionsByFingerprint,
  listAdminInquiries,
  getAdminInquiryById,
  getAdminAttachment,
  findClientByEmail,
  createClient,
  setInquiryClientId,
  resolveClientForInquiry,
  listAdminClients,
  getAdminClientById,
  createProposal,
  updateProposal,
  markProposalSent,
  getProposalById,
  listProposalsByInquiryId,
  listAdminProposals,
  listAdminProjects,
  createProposalShare,
  prepareProposalShareToken,
  deleteSharesForProposal,
  getProposalShareByRawToken,
  hashShareToken,
};
