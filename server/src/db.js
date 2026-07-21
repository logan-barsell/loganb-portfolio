const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { config } = require('./config');
const { INQUIRY_STAGES } = require('./constants');

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
    const apply = database.transaction(() => {
      database.exec(sql);
      insert.run(file);
    });
    apply();
  }
}

function insertInquiry(payload) {
  const database = getDb();
  const stmt = database.prepare(`
    INSERT INTO inquiries (
      id, type, name, email, message, phone, business_name, package_slug,
      website_goals, current_website, requested_features, inspiration_links,
      domain_info, branding_notes, content_readiness, timeline, budget,
      notification_status, stage
    ) VALUES (
      @id, @type, @name, @email, @message, @phone, @business_name, @package_slug,
      @website_goals, @current_website, @requested_features, @inspiration_links,
      @domain_info, @branding_notes, @content_readiness, @timeline, @budget,
      @notification_status, @stage
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
  const attachments = database
    .prepare('SELECT * FROM attachments WHERE inquiry_id = ? ORDER BY created_at ASC')
    .all(id);
  return { ...inquiry, attachments };
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

function listAdminInquiries({
  search = '',
  type = '',
  stage = '',
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
  const sortColumn = SORT_COLUMNS[sort] || SORT_COLUMNS.created_at;
  const sortDir = String(dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const safePage = Math.max(1, Number(page) || 1);
  const safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 20));
  const offset = (safePage - 1) * safePageSize;

  const total = database
    .prepare(`SELECT COUNT(*) AS count FROM inquiries ${whereSql}`)
    .get(params).count;

  const rows = database
    .prepare(
      `SELECT id, type, name, email, business_name, package_slug, stage, created_at
       FROM inquiries
       ${whereSql}
       ORDER BY ${sortColumn} ${sortDir}, id ${sortDir}
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

module.exports = {
  getDb,
  closeDb,
  runMigrations,
  insertInquiry,
  insertAttachments,
  updateNotificationStatus,
  getInquiryWithAttachments,
  createSession,
  getSessionByTokenHash,
  touchSession,
  deleteSessionByTokenHash,
  deleteExpiredSessions,
  deleteSessionsByFingerprint,
  listAdminInquiries,
  getAdminInquiryById,
  getAdminAttachment,
};
