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
    client.business_name || inquiry.business_name || client.name || inquiry.name || 'your project';
  const clientEmail = client.email || inquiry.email;
  return { clientName, businessName, clientEmail, first: firstName(clientName) || 'there' };
}

function portalSetupUrl(projectId, rawToken) {
  if (!config.publicAppUrl || !projectId || !rawToken) return null;
  return `${config.publicAppUrl}/project/${projectId}/setup/${rawToken}`;
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
  formatSetupExpiryNote,
};
