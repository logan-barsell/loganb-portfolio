const { createHash, randomBytes } = require('crypto');
const { config } = require('../config');
const { getDb } = require('./client');
const { listAttachmentsForInquiry } = require('./attachments');

function hashPortalSetupToken(rawToken) {
  return createHash('sha256').update(String(rawToken)).digest('hex');
}

function sqliteExpiryDaysFromNow(days) {
  const ms = Date.now() + Number(days) * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

/**
 * Issue (or rotate) portal setup token.
 * When resetPassword is true, clears existing password and sessions immediately
 * (hard revoke). Prefer resetPassword: false for admin resend — password is
 * replaced when they complete setup via completePortalPasswordSetup.
 * Returns { rawToken, expiresAt }.
 */
function issuePortalSetupToken(projectId, { resetPassword = false } = {}, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashPortalSetupToken(rawToken);
  const expiresAt = sqliteExpiryDaysFromNow(config.clientPortalSetupTtlDays);

  if (resetPassword) {
    database
      .prepare(
        `UPDATE projects SET
           portal_password_hash = NULL,
           portal_password_set_at = NULL,
           portal_setup_token_hash = ?,
           portal_setup_expires_at = ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(tokenHash, expiresAt, projectId);
    deleteClientSessionsForProject(projectId, database);
  } else {
    database
      .prepare(
        `UPDATE projects SET
           portal_setup_token_hash = ?,
           portal_setup_expires_at = ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(tokenHash, expiresAt, projectId);
  }

  return { rawToken, expiresAt };
}

function getProjectForPortalSetup(projectId, rawToken, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project || !project.portal_setup_token_hash || !rawToken) return null;

  const tokenHash = hashPortalSetupToken(rawToken);
  if (tokenHash !== project.portal_setup_token_hash) return null;

  const expiresMs = Date.parse(
    /Z$|[+-]\d{2}:?\d{2}$/.test(project.portal_setup_expires_at)
      ? project.portal_setup_expires_at
      : `${String(project.portal_setup_expires_at).replace(' ', 'T')}Z`
  );
  if (!Number.isFinite(expiresMs) || expiresMs < Date.now()) {
    return { expired: true, project };
  }

  return { expired: false, project };
}

function completePortalPasswordSetup(projectId, passwordHash, database = getDb()) {
  const setAt = new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  database
    .prepare(
      `UPDATE projects SET
         portal_password_hash = ?,
         portal_password_set_at = ?,
         portal_setup_token_hash = NULL,
         portal_setup_expires_at = NULL,
         updated_at = datetime('now')
       WHERE id = ?`
    )
    .run(passwordHash, setAt, projectId);
  deleteClientSessionsForProject(projectId, database);
  return database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
}

function createClientSession({ tokenHash, projectId, expiresAt }, database = getDb()) {
  database
    .prepare(
      `INSERT INTO client_sessions (token_hash, project_id, expires_at)
       VALUES (?, ?, ?)`
    )
    .run(tokenHash, projectId, expiresAt);
}

function getClientSessionByTokenHash(tokenHash, database = getDb()) {
  return database.prepare('SELECT * FROM client_sessions WHERE token_hash = ?').get(tokenHash);
}

function touchClientSession(tokenHash, database = getDb()) {
  database
    .prepare(
      `UPDATE client_sessions SET last_seen_at = datetime('now') WHERE token_hash = ?`
    )
    .run(tokenHash);
}

function deleteClientSessionByTokenHash(tokenHash, database = getDb()) {
  database.prepare('DELETE FROM client_sessions WHERE token_hash = ?').run(tokenHash);
}

function deleteExpiredClientSessions(database = getDb()) {
  database.prepare(`DELETE FROM client_sessions WHERE expires_at <= datetime('now')`).run();
}

function deleteClientSessionsForProject(projectId, database = getDb()) {
  database.prepare('DELETE FROM client_sessions WHERE project_id = ?').run(projectId);
}

function getPortalProjectBundle(projectId, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  const client = database
    .prepare(
      `SELECT id, name, email, phone, business_name, stripe_customer_id FROM clients WHERE id = ?`
    )
    .get(project.client_id);

  const inquiry = project.inquiry_id
    ? database.prepare('SELECT * FROM inquiries WHERE id = ?').get(project.inquiry_id)
    : null;

  const proposal = project.proposal_id
    ? database.prepare('SELECT * FROM proposals WHERE id = ?').get(project.proposal_id)
    : null;

  const attachments = project.inquiry_id
    ? listAttachmentsForInquiry(project.inquiry_id, database)
    : [];

  return { project, client, inquiry, proposal, attachments };
}

module.exports = {
  hashPortalSetupToken,
  issuePortalSetupToken,
  getProjectForPortalSetup,
  completePortalPasswordSetup,
  createClientSession,
  getClientSessionByTokenHash,
  touchClientSession,
  deleteClientSessionByTokenHash,
  deleteExpiredClientSessions,
  deleteClientSessionsForProject,
  getPortalProjectBundle,
};
