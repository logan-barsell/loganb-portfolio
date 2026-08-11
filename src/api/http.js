export const GENERIC_SERVER_ERROR = 'Server unavailable. Please try again.';

/**
 * API error codes that may arrive as 5xx but still carry a useful JSON message.
 * Keep aligned with server CLIENT_VISIBLE_5XX_CODES + common billing codes.
 */
const SURFACED_ERROR_CODES = new Set([
  'STRIPE_NOT_CONFIGURED',
  'STRIPE_REQUEST_FAILED',
  'STRIPE_PRICE_NOT_CONFIGURED',
  'HOSTING_TARGET_NOT_CONFIGURED',
  'HOSTING_NOT_READY',
  'PROVISION_IN_PROGRESS',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN_ORIGIN',
  'NOT_FOUND',
]);

function looksLikeHtmlOrGarbage(message) {
  if (message === null || message === undefined) return false;
  const text = String(message).trim();
  if (!text) return true;
  if (/^<!DOCTYPE/i.test(text) || /^<html[\s>]/i.test(text) || text.includes('<html')) {
    return true;
  }
  if (text.startsWith('<') && text.includes('>')) return true;
  if (text.length > 280) return true;
  return false;
}

/**
 * Parse JSON body; never put raw HTML into message.
 * @returns {Promise<object>}
 */
export async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { _nonJson: true };
  }
}

/**
 * Pick a safe user-facing message from status + parsed body.
 */
export function userFacingErrorMessage(response, data, fallback = 'Request failed.') {
  if (!response) return GENERIC_SERVER_ERROR;
  if (data && data._nonJson) return GENERIC_SERVER_ERROR;

  const code = data && typeof data.code === 'string' ? data.code : null;
  const message = data && data.message;
  const hasSurfacedCode = code && SURFACED_ERROR_CODES.has(code);
  const safeMessage =
    typeof message === 'string' && message.trim() && !looksLikeHtmlOrGarbage(message)
      ? message.trim()
      : null;

  // Known app codes: prefer JSON message even on 502/503.
  if (hasSurfacedCode && safeMessage) return safeMessage;
  if (hasSurfacedCode) return fallback;

  if ([502, 503, 504].includes(response.status)) return GENERIC_SERVER_ERROR;
  if (response.status >= 500) return GENERIC_SERVER_ERROR;

  if (looksLikeHtmlOrGarbage(message)) {
    return response.ok === false ? GENERIC_SERVER_ERROR : fallback;
  }
  if (safeMessage) return safeMessage;
  return fallback;
}

export function createHttpError(response, data, fallback) {
  const error = new Error(userFacingErrorMessage(response, data, fallback));
  if (response) error.status = response.status;
  if (data && data.code) error.code = data.code;
  if (data && data.details) error.details = data.details;
  return error;
}

/** Wrap fetch so network failures get a generic message. */
export async function fetchSafe(url, options) {
  try {
    return await fetch(url, options);
  } catch {
    const error = new Error(GENERIC_SERVER_ERROR);
    error.status = 0;
    error.code = 'NETWORK_ERROR';
    throw error;
  }
}
