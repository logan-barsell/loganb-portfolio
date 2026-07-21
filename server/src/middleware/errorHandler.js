function errorHandler(err, _req, res, _next) {
  if (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      ok: false,
      code: 'UPLOAD_LIMIT',
      message: 'Upload exceeds allowed size or file count.',
    });
  }

  const status = err.status || 500;
  const payload = {
    ok: false,
    code: err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST'),
    message: status >= 500 ? 'Something went wrong. Please try again.' : err.message || 'Bad request.',
  };

  if (err.details) payload.details = err.details;

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json(payload);
}

module.exports = { errorHandler };
