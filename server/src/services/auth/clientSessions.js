const crypto = require('crypto');
const { config } = require('../../config');
const {
  createClientSession,
  getClientSessionByTokenHash,
  touchClientSession,
  deleteClientSessionByTokenHash,
  deleteExpiredClientSessions,
  deleteClientSessionsForClient,
} = require('../../db');

function hashClientToken(token) {
  return crypto.createHmac('sha256', config.clientSessionSecret || 'dev').update(token).digest('hex');
}

function createOpaqueToken() {
  return crypto.randomBytes(32).toString('base64url');
}

function createClientAccountSession(clientId) {
  deleteExpiredClientSessions();
  const token = createOpaqueToken();
  const tokenHash = hashClientToken(token);
  const expiresAt = new Date(Date.now() + config.clientSessionTtlSeconds * 1000).toISOString();
  createClientSession({
    tokenHash,
    clientId,
    expiresAt,
  });
  return { token, expiresAt };
}

function getValidClientSession(token) {
  if (!token) return null;
  if (!config.clientSessionSecret && config.env === 'production') return null;
  deleteExpiredClientSessions();
  const tokenHash = hashClientToken(token);
  const session = getClientSessionByTokenHash(tokenHash);
  if (!session) return null;

  const expiresAt = Date.parse(session.expires_at);
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    deleteClientSessionByTokenHash(tokenHash);
    return null;
  }

  touchClientSession(tokenHash);
  return session;
}

function destroyClientSession(token) {
  if (!token) return;
  deleteClientSessionByTokenHash(hashClientToken(token));
}

function destroyClientSessionsForClient(clientId) {
  deleteClientSessionsForClient(clientId);
}

module.exports = {
  hashClientToken,
  createOpaqueToken,
  createClientAccountSession,
  getValidClientSession,
  destroyClientSession,
  destroyClientSessionsForClient,
};
