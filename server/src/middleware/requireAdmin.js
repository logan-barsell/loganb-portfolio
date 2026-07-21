const { config } = require('../config');
const { getValidSession, destroySession } = require('../auth/sessions');
const {
  getSessionToken,
  clearSessionCookie,
  setNoStore,
} = require('../auth/cookies');

function requireAdmin(req, res, next) {
  setNoStore(res);

  const token = getSessionToken(req);
  const session = getValidSession(token);
  if (!session) {
    clearSessionCookie(res);
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  req.adminSession = session;
  return next();
}

function assertAdminConfigured() {
  if (!config.adminEmail || !config.adminPasswordHash || !config.adminSessionSecret) {
    const error = new Error('Admin authentication is not configured.');
    error.status = 503;
    error.code = 'AUTH_NOT_CONFIGURED';
    throw error;
  }
}

module.exports = { requireAdmin, assertAdminConfigured };
