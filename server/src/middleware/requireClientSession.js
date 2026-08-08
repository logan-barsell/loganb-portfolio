const { getValidClientSession, destroyClientSession } = require('../services/auth/clientSessions');
const {
  getClientSessionToken,
  clearClientSessionCookie,
} = require('../services/auth/clientCookies');
const { setNoStore } = require('../services/auth/cookies');

function requireClientSession(req, res, next) {
  setNoStore(res);
  const token = getClientSessionToken(req);
  const session = getValidClientSession(token);
  if (!session) {
    clearClientSessionCookie(res);
    if (token) destroyClientSession(token);
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  req.clientSession = session;
  req.clientId = session.client_id;
  return next();
}

module.exports = { requireClientSession };
