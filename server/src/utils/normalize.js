function trimToNull(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function normalizeEmail(value) {
  const email = trimToNull(value);
  return email ? email.toLowerCase() : null;
}

function isValidEmail(email) {
  if (!email) return false;
  // Practical validation — not a full RFC parser
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function enforceMaxLength(value, max) {
  if (value === null || value === undefined) return null;
  const text = String(value);
  if (text.length > max) {
    const error = new Error(`Field exceeds maximum length of ${max} characters.`);
    error.status = 400;
    error.code = 'FIELD_TOO_LONG';
    throw error;
  }
  return text;
}

function createHttpError(status, message, code = 'BAD_REQUEST', details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
}

module.exports = {
  trimToNull,
  normalizeEmail,
  isValidEmail,
  enforceMaxLength,
  createHttpError,
};
