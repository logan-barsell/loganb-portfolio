const { createHash, randomBytes } = require('crypto');
const { config } = require('../config');
const { getDb } = require('./client');
const { listClientVisibleAttachmentsForInquiry } = require('./attachments');

function hashClientAuthToken(rawToken) {
  return createHash('sha256').update(String(rawToken)).digest('hex');
}

const hashPortalSetupToken = hashClientAuthToken;

function sqliteExpiryDaysFromNow(days) {
  const ms = Date.now() + Number(days) * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

function sqliteExpiryMinutesFromNow(minutes) {
  const ms = Date.now() + Number(minutes) * 60 * 1000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
}

function issueClientAuthToken(
  { clientId, projectId = null, purpose, expiresAt },
  database = getDb()
) {
  const rawToken = randomBytes(32).toString('base64url');
  const tokenHash = hashClientAuthToken(rawToken);

  database
    .prepare(
      `INSERT INTO client_auth_tokens
         (token_hash, client_id, project_id, purpose, expires_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(tokenHash, clientId, projectId, purpose, expiresAt);

  return { rawToken, expiresAt };
}

/**
 * Issue (or rotate) a project-context setup token for the project's client.
 * Returns { rawToken, expiresAt }.
 */
function issuePortalSetupToken(projectId, _options = {}, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project?.client_id) return null;

  const expiresAt = sqliteExpiryDaysFromNow(config.clientPortalSetupTtlDays);
  database
    .prepare(
      `DELETE FROM client_auth_tokens
       WHERE client_id = ? AND project_id = ? AND purpose = 'setup'`
    )
    .run(project.client_id, projectId);
  return issueClientAuthToken(
    { clientId: project.client_id, projectId, purpose: 'setup', expiresAt },
    database
  );
}

function issuePasswordResetToken(clientId, database = getDb()) {
  const client = database.prepare('SELECT id FROM clients WHERE id = ?').get(clientId);
  if (!client) return null;

  const expiresAt = sqliteExpiryMinutesFromNow(config.clientPasswordResetTtlMinutes);
  database
    .prepare(`DELETE FROM client_auth_tokens WHERE client_id = ? AND purpose = 'password_reset'`)
    .run(clientId);
  return issueClientAuthToken(
    { clientId, purpose: 'password_reset', expiresAt },
    database
  );
}

function getClientAuthToken(rawToken, purpose, database = getDb()) {
  if (!rawToken) return null;
  const tokenHash = hashClientAuthToken(rawToken);
  const token = database
    .prepare(
      `SELECT *
       FROM client_auth_tokens
       WHERE token_hash = ? AND purpose = ? AND consumed_at IS NULL`
    )
    .get(tokenHash, purpose);
  if (!token) return null;

  const client = database.prepare('SELECT * FROM clients WHERE id = ?').get(token.client_id);
  const project = token.project_id
    ? database.prepare('SELECT * FROM projects WHERE id = ?').get(token.project_id)
    : null;
  const expiresAt = Date.parse(
    /Z$|[+-]\d{2}:?\d{2}$/.test(token.expires_at)
      ? token.expires_at
      : `${String(token.expires_at).replace(' ', 'T')}Z`
  );
  return {
    expired: !Number.isFinite(expiresAt) || expiresAt <= Date.now(),
    token,
    client,
    project,
  };
}

function getProjectForPortalSetup(projectId, rawToken, database = getDb()) {
  const result = getClientAuthToken(rawToken, 'setup', database);
  if (!result || result.project?.id !== projectId || result.project?.client_id !== result.client?.id) {
    return null;
  }
  return result;
}

function completeClientPasswordWithToken(
  { clientId, passwordHash, rawToken, purpose },
  database = getDb()
) {
  const tokenHash = hashClientAuthToken(rawToken);
  const setAt = new Date().toISOString().replace(/\.\d{3}Z$/, '').replace('T', ' ');
  const complete = database.transaction(() => {
    const claimed = database
      .prepare(
        `UPDATE client_auth_tokens
         SET consumed_at = datetime('now')
         WHERE token_hash = ?
           AND client_id = ?
           AND purpose = ?
           AND consumed_at IS NULL
           AND expires_at > datetime('now')`
      )
      .run(tokenHash, clientId, purpose);
    if (claimed.changes !== 1) return false;

    database
      .prepare(
        `UPDATE clients SET
           portal_password_hash = ?,
           portal_password_set_at = ?,
           updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(passwordHash, setAt, clientId);
    database.prepare('DELETE FROM client_auth_tokens WHERE client_id = ?').run(clientId);
    deleteClientSessionsForClient(clientId, database);
    return true;
  });

  if (!complete()) return null;
  return database.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
}

function createClientSession({ tokenHash, clientId, expiresAt }, database = getDb()) {
  database
    .prepare(
      `INSERT INTO client_sessions (token_hash, client_id, expires_at)
       VALUES (?, ?, ?)`
    )
    .run(tokenHash, clientId, expiresAt);
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

function deleteClientSessionsForClient(clientId, database = getDb()) {
  database.prepare('DELETE FROM client_sessions WHERE client_id = ?').run(clientId);
}

function listPortalProjectsForClient(clientId, database = getDb()) {
  return database
    .prepare(
      `SELECT
         p.id,
         p.name,
         p.status,
         COALESCE(i.business_name, c.business_name, p.name) AS business_name
       FROM projects p
       JOIN clients c ON c.id = p.client_id
       LEFT JOIN inquiries i ON i.id = p.inquiry_id
       WHERE p.client_id = ? AND p.status IN ('active', 'on_hold', 'completed')
       ORDER BY
         CASE p.status WHEN 'active' THEN 1 WHEN 'on_hold' THEN 2 ELSE 3 END,
         p.created_at DESC,
         p.id DESC`
    )
    .all(clientId);
}

function getPortalProjectBundle(projectId, database = getDb()) {
  const project = database.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
  if (!project) return null;

  const client = database
    .prepare(
      `SELECT
         id, name, email, phone, business_name, stripe_customer_id,
         portal_password_hash, portal_password_set_at
       FROM clients
       WHERE id = ?`
    )
    .get(project.client_id);

  const inquiry = project.inquiry_id
    ? database.prepare('SELECT * FROM inquiries WHERE id = ?').get(project.inquiry_id)
    : null;

  const proposal = project.proposal_id
    ? database.prepare('SELECT * FROM proposals WHERE id = ?').get(project.proposal_id)
    : null;

  const attachments = project.inquiry_id
    ? listClientVisibleAttachmentsForInquiry(project.inquiry_id, database)
    : [];

  return { project, client, inquiry, proposal, attachments };
}

module.exports = {
  hashPortalSetupToken,
  hashClientAuthToken,
  issuePortalSetupToken,
  issuePasswordResetToken,
  getClientAuthToken,
  getProjectForPortalSetup,
  completeClientPasswordWithToken,
  createClientSession,
  getClientSessionByTokenHash,
  touchClientSession,
  deleteClientSessionByTokenHash,
  deleteExpiredClientSessions,
  deleteClientSessionsForClient,
  listPortalProjectsForClient,
  getPortalProjectBundle,
};
