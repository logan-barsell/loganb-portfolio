const { config } = require('../config');

function parseCookies(header = '') {
  const out = {};
  String(header)
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const eq = part.indexOf('=');
      if (eq === -1) return;
      const key = part.slice(0, eq).trim();
      const value = part.slice(eq + 1).trim();
      try {
        out[key] = decodeURIComponent(value);
      } catch {
        out[key] = value;
      }
    });
  return out;
}

function cookieName() {
  return config.adminSessionCookieName;
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[cookieName()] || null;
}

function buildCookieParts({ token = '', maxAgeSeconds }) {
  const parts = [
    `${cookieName()}=${token ? encodeURIComponent(token) : ''}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (config.env === 'production') {
    parts.push('Secure');
  }
  if (typeof maxAgeSeconds === 'number') {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  return parts;
}

function setSessionCookie(res, token, expiresAtIso) {
  const expiresAt = Date.parse(expiresAtIso);
  const maxAgeSeconds = Number.isFinite(expiresAt)
    ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    : config.adminSessionTtlSeconds;

  const parts = buildCookieParts({ token, maxAgeSeconds });
  if (Number.isFinite(expiresAt)) {
    parts.push(`Expires=${new Date(expiresAt).toUTCString()}`);
  }
  res.append('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
  const parts = buildCookieParts({ token: '', maxAgeSeconds: 0 });
  parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.append('Set-Cookie', parts.join('; '));
}

function setNoStore(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
}

function originAllowed(origin) {
  if (!origin) return false;

  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }

  if (config.env !== 'production') {
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return true;
    }
  }

  if (!config.allowedOrigin) return false;

  try {
    const allowed = new URL(config.allowedOrigin);
    return url.protocol === allowed.protocol && url.host === allowed.host;
  } catch {
    return false;
  }
}

function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (!origin) {
    // Browsers send Origin on cross-site and most CORS POSTs; same-origin
    // fetches via the CRA/nginx proxy also include Origin. Reject missing
    // Origin on mutating auth requests to reduce CSRF risk.
    return res.status(403).json({
      ok: false,
      code: 'FORBIDDEN_ORIGIN',
      message: 'Request origin is not allowed.',
    });
  }

  if (originAllowed(origin)) return next();

  return res.status(403).json({
    ok: false,
    code: 'FORBIDDEN_ORIGIN',
    message: 'Request origin is not allowed.',
  });
}

module.exports = {
  parseCookies,
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  setNoStore,
  requireSameOrigin,
  originAllowed,
};
