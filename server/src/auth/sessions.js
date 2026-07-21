const crypto = require('crypto');
const { config } = require('../config');
const {
  createSession,
  getSessionByTokenHash,
  touchSession,
  deleteSessionByTokenHash,
  deleteExpiredSessions,
  deleteSessionsByFingerprint,
} = require('../db');

function hashToken(token) {
  return crypto.createHmac('sha256', config.adminSessionSecret).update(token).digest('hex');
}

function credentialFingerprint() {
  return crypto.createHash('sha256').update(config.adminPasswordHash || '').digest('hex');
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function createAdminSession() {
  deleteExpiredSessions();
  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const fingerprint = credentialFingerprint();
  const expiresAt = new Date(Date.now() + config.adminSessionTtlSeconds * 1000).toISOString();
  createSession({
    tokenHash,
    credentialFingerprint: fingerprint,
    expiresAt,
  });
  return { token, expiresAt };
}

function getValidSession(token) {
  if (!token) return null;
  deleteExpiredSessions();
  const tokenHash = hashToken(token);
  const session = getSessionByTokenHash(tokenHash);
  if (!session) return null;

  const now = Date.now();
  const expiresAt = Date.parse(session.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    deleteSessionByTokenHash(tokenHash);
    return null;
  }

  if (session.credential_fingerprint !== credentialFingerprint()) {
    deleteSessionsByFingerprint(session.credential_fingerprint);
    return null;
  }

  touchSession(tokenHash);
  return session;
}

function destroySession(token) {
  if (!token) return;
  deleteSessionByTokenHash(hashToken(token));
}

module.exports = {
  hashToken,
  credentialFingerprint,
  createAdminSession,
  getValidSession,
  destroySession,
};
