const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { config } = require('./config');

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
      notification_status
    ) VALUES (
      @id, @type, @name, @email, @message, @phone, @business_name, @package_slug,
      @website_goals, @current_website, @requested_features, @inspiration_links,
      @domain_info, @branding_notes, @content_readiness, @timeline, @budget,
      @notification_status
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

module.exports = {
  getDb,
  closeDb,
  runMigrations,
  insertInquiry,
  insertAttachments,
  updateNotificationStatus,
  getInquiryWithAttachments,
};
