const { config } = require('../../config');

function firstName(fullName) {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] || null;
}

function line(label, value) {
  if (!value) return '';
  return `${label}: ${value}\n`;
}

function decisionContext(proposal) {
  const client = proposal.client || {};
  const inquiry = proposal.inquiry || {};
  const clientName = client.name || inquiry.name || 'there';
  const businessName =
    inquiry.business_name || client.business_name || inquiry.name || client.name || 'your project';
  const clientEmail = client.email || inquiry.email;
  return { clientName, businessName, clientEmail, first: firstName(clientName) || 'there' };
}

function portalSetupUrl(projectId, rawToken) {
  if (!config.publicAppUrl || !projectId || !rawToken) return null;
  return `${config.publicAppUrl}/project/${projectId}/setup/${rawToken}`;
}

function portalProjectUrl(projectId) {
  if (!config.publicAppUrl || !projectId) return null;
  return `${config.publicAppUrl}/project/${projectId}`;
}

function clientLoginUrl() {
  if (!config.publicAppUrl) return null;
  return `${config.publicAppUrl}/client/login`;
}

function clientPasswordResetUrl(rawToken) {
  if (!config.publicAppUrl || !rawToken) return null;
  return `${config.publicAppUrl}/client/reset-password/${rawToken}`;
}

function projectEmailContext({ project, client, inquiry } = {}) {
  const clientRow = client || {};
  const inquiryRow = inquiry || {};
  const clientName = clientRow.name || inquiryRow.name || 'there';
  const businessName =
    inquiryRow.business_name ||
    clientRow.business_name ||
    project?.name ||
    inquiryRow.name ||
    clientRow.name ||
    'your project';
  const clientEmail = clientRow.email || inquiryRow.email;
  return {
    clientName,
    businessName,
    clientEmail,
    first: firstName(clientName) || 'there',
    projectId: project?.id || null,
    portalUrl: portalProjectUrl(project?.id),
  };
}

function formatSetupExpiryNote(expiresAt) {
  const days = config.clientPortalSetupTtlDays || 7;
  if (!expiresAt) return `This link expires in ${days} days.`;
  try {
    const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(expiresAt)
      ? expiresAt
      : `${String(expiresAt).replace(' ', 'T')}Z`;
    const label = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(normalized));
    return `This link expires ${label} UTC (about ${days} days).`;
  } catch {
    return `This link expires in ${days} days.`;
  }
}

module.exports = {
  firstName,
  line,
  decisionContext,
  portalSetupUrl,
  portalProjectUrl,
  clientLoginUrl,
  clientPasswordResetUrl,
  projectEmailContext,
  formatSetupExpiryNote,
};
