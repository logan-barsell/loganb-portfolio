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

function clientCookieName() {
  return config.clientSessionCookieName;
}

function getClientSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[clientCookieName()] || null;
}

function buildClientCookieParts({ token = '', maxAgeSeconds }) {
  const parts = [
    `${clientCookieName()}=${token ? encodeURIComponent(token) : ''}`,
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

function setClientSessionCookie(res, token, expiresAtIso) {
  const expiresAt = Date.parse(expiresAtIso);
  const maxAgeSeconds = Number.isFinite(expiresAt)
    ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    : config.clientSessionTtlSeconds;

  const parts = buildClientCookieParts({ token, maxAgeSeconds });
  if (Number.isFinite(expiresAt)) {
    parts.push(`Expires=${new Date(expiresAt).toUTCString()}`);
  }
  res.append('Set-Cookie', parts.join('; '));
}

function clearClientSessionCookie(res) {
  const parts = buildClientCookieParts({ token: '', maxAgeSeconds: 0 });
  parts.push('Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.append('Set-Cookie', parts.join('; '));
}

module.exports = {
  getClientSessionToken,
  setClientSessionCookie,
  clearClientSessionCookie,
};
