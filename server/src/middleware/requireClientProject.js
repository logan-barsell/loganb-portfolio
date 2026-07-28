const { getValidClientSession, destroyClientSession } = require('../auth/clientSessions');
const {
  getClientSessionToken,
  clearClientSessionCookie,
} = require('../auth/clientCookies');
const { setNoStore } = require('../auth/cookies');

function requireClientProject(req, res, next) {
  setNoStore(res);

  const projectId = String(req.params.id || '').trim();
  const token = getClientSessionToken(req);
  const session = getValidClientSession(token);

  if (!session || session.project_id !== projectId) {
    clearClientSessionCookie(res);
    if (token) destroyClientSession(token);
    return res.status(401).json({
      ok: false,
      code: 'UNAUTHORIZED',
      message: 'Authentication required.',
    });
  }

  req.clientSession = session;
  req.clientProjectId = projectId;
  return next();
}

module.exports = { requireClientProject };
