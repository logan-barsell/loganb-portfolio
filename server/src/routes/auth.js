const express = require('express');
const { config } = require('../config');
const { verifyPassword, timingSafeEqualString } = require('../auth/password');
const { createAdminSession, getValidSession, destroySession } = require('../auth/sessions');
const {
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  setNoStore,
  requireSameOrigin,
} = require('../auth/cookies');
const { assertAdminConfigured } = require('../middleware/requireAdmin');
const { loginLimiter } = require('../middleware/rateLimit');
const { normalizeEmail, isValidEmail, createHttpError } = require('../utils/normalize');

const router = express.Router();

function publicSession() {
  return {
    ok: true,
    authenticated: true,
    email: config.adminEmail,
  };
}

router.get('/session', (req, res, next) => {
  try {
    setNoStore(res);
    if (!config.adminEmail || !config.adminPasswordHash || !config.adminSessionSecret) {
      return res.status(200).json({ ok: true, authenticated: false });
    }

    const token = getSessionToken(req);
    const session = getValidSession(token);
    if (!session) {
      clearSessionCookie(res);
      return res.status(200).json({ ok: true, authenticated: false });
    }

    return res.status(200).json(publicSession());
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/login',
  loginLimiter,
  requireSameOrigin,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      setNoStore(res);
      assertAdminConfigured();

      const email = normalizeEmail(req.body?.email);
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      const emailOk = isValidEmail(email) && timingSafeEqualString(email, config.adminEmail);
      const passwordOk = await verifyPassword(password, config.adminPasswordHash);

      if (!emailOk || !passwordOk) {
        throw createHttpError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
      }

      const { token, expiresAt } = createAdminSession();
      setSessionCookie(res, token, expiresAt);
      return res.status(200).json(publicSession());
    } catch (error) {
      return next(error);
    }
  }
);

router.post('/logout', requireSameOrigin, express.json({ limit: '4kb' }), (req, res, next) => {
  try {
    setNoStore(res);
    const token = getSessionToken(req);
    destroySession(token);
    clearSessionCookie(res);
    return res.status(200).json({ ok: true, authenticated: false });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
