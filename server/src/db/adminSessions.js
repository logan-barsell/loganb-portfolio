const { getDb } = require('./client');

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

module.exports = {
  createSession,
  getSessionByTokenHash,
  touchSession,
  deleteSessionByTokenHash,
  deleteExpiredSessions,
  deleteSessionsByFingerprint,
};
