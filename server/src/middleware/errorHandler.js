/** 5xx codes whose err.message is safe/useful to return to the client. */
const CLIENT_VISIBLE_5XX_CODES = new Set([
  'STRIPE_NOT_CONFIGURED',
  'STRIPE_REQUEST_FAILED',
  'STRIPE_PRICE_NOT_CONFIGURED',
  'HOSTING_TARGET_NOT_CONFIGURED',
]);

function errorHandler(err, req, res, _next) {
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      ok: false,
      code: 'UPLOAD_LIMIT',
      message: 'Upload exceeds allowed size or file count.',
    });
  }

  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const useAppMessage =
    status < 500 || CLIENT_VISIBLE_5XX_CODES.has(code);
  const payload = {
    ok: false,
    code,
    message: useAppMessage
      ? err.message || (status >= 500 ? 'Something went wrong. Please try again.' : 'Bad request.')
      : 'Something went wrong. Please try again.',
  };

  if (err.details && status < 500) payload.details = err.details;

  if (status >= 500 || CLIENT_VISIBLE_5XX_CODES.has(code)) {
    const method = req?.method || '?';
    const path = req?.originalUrl || req?.url || '?';
    console.error(`[api] ${status} ${code} ${method} ${path} — ${err.message || err}`);
    if (status >= 500 && err.stack && !CLIENT_VISIBLE_5XX_CODES.has(code)) {
      console.error(err.stack);
    }
  }

  return res.status(status).json(payload);
}

module.exports = { errorHandler, CLIENT_VISIBLE_5XX_CODES };
