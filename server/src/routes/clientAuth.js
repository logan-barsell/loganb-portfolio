const express = require('express');
const {
  clientSessionPayload,
  loginClient,
  requestClientPasswordReset,
  loadPasswordResetTarget,
  resetClientPassword,
} = require('../services/clientAuth');
const { getValidClientSession, destroyClientSession } = require('../services/auth/clientSessions');
const {
  getClientSessionToken,
  setClientSessionCookie,
  clearClientSessionCookie,
} = require('../services/auth/clientCookies');
const { setNoStore, requireSameOrigin } = require('../services/auth/cookies');
const { requireClientSession } = require('../middleware/requireClientSession');
const {
  clientPortalAuthLimiter,
  clientPasswordResetLimiter,
} = require('../middleware/rateLimit');

const router = express.Router();

router.use((_req, res, next) => {
  setNoStore(res);
  next();
});

router.get('/session', (req, res) => {
  const token = getClientSessionToken(req);
  const session = getValidClientSession(token);
  if (!session) {
    if (token) clearClientSessionCookie(res);
    return res.status(200).json({ ok: true, authenticated: false });
  }
  const payload = clientSessionPayload(session.client_id);
  if (!payload) {
    destroyClientSession(token);
    clearClientSessionCookie(res);
    return res.status(200).json({ ok: true, authenticated: false });
  }
  return res.status(200).json({ ok: true, authenticated: true, ...payload });
});

router.post(
  '/login',
  clientPortalAuthLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const result = await loginClient(req.body?.email, req.body?.password);
      setClientSessionCookie(res, result.session.token, result.session.expiresAt);
      return res.status(200).json({
        ok: true,
        client: result.client,
        projects: result.projects,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/logout', requireSameOrigin, express.json({ limit: '8kb' }), (req, res) => {
  const token = getClientSessionToken(req);
  destroyClientSession(token);
  clearClientSessionCookie(res);
  return res.status(200).json({ ok: true });
});

router.get('/projects', requireClientSession, (req, res) => {
  const payload = clientSessionPayload(req.clientId);
  return res.status(200).json({ ok: true, projects: payload?.projects || [] });
});

router.post(
  '/forgot-password',
  clientPasswordResetLimiter,
  requireSameOrigin,
  express.json({ limit: '8kb' }),
  async (req, res, next) => {
    try {
      await requestClientPasswordReset(req.body?.email);
      return res.status(200).json({
        ok: true,
        message:
          'If an account exists for that email, a password reset link will arrive shortly.',
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.get('/reset-password/:token', (req, res, next) => {
  try {
    loadPasswordResetTarget(req.params.token);
    return res.status(200).json({ ok: true, valid: true });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/reset-password/:token',
  clientPasswordResetLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      await resetClientPassword(
        req.params.token,
        req.body?.password,
        req.body?.confirmPassword
      );
      clearClientSessionCookie(res);
      return res.status(200).json({ ok: true });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
