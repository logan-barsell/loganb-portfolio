const rateLimit = require('express-rate-limit');

const inquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    code: 'RATE_LIMITED',
    message: 'Too many submissions. Please wait a few minutes and try again.',
  },
});

module.exports = { inquiryLimiter };
