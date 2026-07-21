const {
  LIMITS,
  PACKAGE_SLUGS,
} = require('../constants');
const {
  trimToNull,
  normalizeEmail,
  isValidEmail,
  enforceMaxLength,
  createHttpError,
} = require('../utils/normalize');

function rejectHoneypot(body) {
  const honeypot = trimToNull(body.companyWebsite || body.website || body.honeypot);
  if (honeypot) {
    // Silent success for bots is handled in the route; this flags it.
    return true;
  }
  return false;
}

function validateContact(body) {
  const errors = {};

  const name = enforceMaxLength(trimToNull(body.name), LIMITS.name);
  const email = enforceMaxLength(normalizeEmail(body.email), LIMITS.email);
  const message = enforceMaxLength(trimToNull(body.message), LIMITS.message);

  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!message) errors.message = 'Message is required.';

  if (Object.keys(errors).length) {
    throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
  }

  return {
    name,
    email,
    message,
    isSpam: rejectHoneypot(body),
  };
}

function validateProject(body) {
  const errors = {};

  const name = enforceMaxLength(trimToNull(body.name), LIMITS.name);
  const email = enforceMaxLength(normalizeEmail(body.email), LIMITS.email);
  const businessName = enforceMaxLength(trimToNull(body.businessName), LIMITS.businessName);
  const packageSlug = enforceMaxLength(trimToNull(body.packageSlug), LIMITS.packageSlug);
  const websiteGoals = enforceMaxLength(trimToNull(body.websiteGoals), LIMITS.websiteGoals);

  if (!name) errors.name = 'Name is required.';
  if (!email) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!businessName) errors.businessName = 'Business name is required.';
  if (!packageSlug) errors.packageSlug = 'Please select a package or service.';
  else if (!PACKAGE_SLUGS.includes(packageSlug)) {
    errors.packageSlug = 'Selected package is not valid.';
  }
  if (!websiteGoals) errors.websiteGoals = 'Please share your website goals.';

  if (Object.keys(errors).length) {
    throw createHttpError(400, 'Please fix the highlighted fields.', 'VALIDATION_ERROR', errors);
  }

  return {
    name,
    email,
    businessName,
    packageSlug,
    websiteGoals,
    phone: enforceMaxLength(trimToNull(body.phone), LIMITS.phone),
    currentWebsite: enforceMaxLength(trimToNull(body.currentWebsite), LIMITS.currentWebsite),
    requestedFeatures: enforceMaxLength(trimToNull(body.requestedFeatures), LIMITS.requestedFeatures),
    inspirationLinks: enforceMaxLength(trimToNull(body.inspirationLinks), LIMITS.inspirationLinks),
    domainInfo: enforceMaxLength(trimToNull(body.domainInfo), LIMITS.domainInfo),
    brandingNotes: enforceMaxLength(trimToNull(body.brandingNotes), LIMITS.brandingNotes),
    contentReadiness: enforceMaxLength(trimToNull(body.contentReadiness), LIMITS.contentReadiness),
    timeline: enforceMaxLength(trimToNull(body.timeline), LIMITS.timeline),
    budget: enforceMaxLength(trimToNull(body.budget), LIMITS.budget),
    message: enforceMaxLength(trimToNull(body.message), LIMITS.message),
    isSpam: rejectHoneypot(body),
  };
}

module.exports = {
  validateContact,
  validateProject,
};
