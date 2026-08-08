const { config } = require('../../../config');
const { BRAND, SITE_LABEL } = require('../brand');
const {
  escapeHtml,
  wrapEmailHtml,
  emailCtaHtml,
  p,
  clientFooterHtml,
} = require('../layout');
const {
  firstName,
  portalSetupUrl,
  clientLoginUrl,
  formatSetupExpiryNote,
} = require('../helpers');
const { sendResendEmail } = require('../send');

/**
 * Email client a (re)set portal access setup link.
 * @param {{ name?: string, businessName?: string, email: string }} client
 * @param {{ projectId: string, rawToken: string, expiresAt: string, isReset?: boolean }} portalSetup
 */
async function sendPortalAccessEmail(client, portalSetup) {
  const clientEmail = client?.email;
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const businessName = client.businessName || client.name || 'your project';
  const first = firstName(client.name) || 'there';
  const setupUrl = portalSetupUrl(portalSetup.projectId, portalSetup.rawToken);
  if (!setupUrl) {
    const error = new Error('PUBLIC_APP_URL is not configured.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  const expiryNote = formatSetupExpiryNote(portalSetup.expiresAt);
  const loginUrl = clientLoginUrl();
  const isReset = Boolean(portalSetup.isReset);
  const clientSubject = isReset
    ? `Reset your project portal access — ${businessName}`
    : `Your project portal access — ${businessName}`;

  const intro = isReset
    ? `Use the link below to choose a new password for the ${businessName} project portal. Your previous password will stop working once you finish setup.`
    : `Use the link below to set a password and open the ${businessName} project portal.`;

  const clientText = [
    `Hi ${first},`,
    '',
    intro,
    '',
    `Set up your portal: ${setupUrl}`,
    expiryNote,
    '',
    loginUrl
      ? `After setup, return anytime at the client login page: ${loginUrl}`
      : 'After setup, return anytime using your email and password.',
    '',
    'Reply to this email anytime if you have questions.',
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');

  const clientHtml = wrapEmailHtml({
    preheader: clientSubject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(intro)}
      ${emailCtaHtml(setupUrl, 'Set Up Portal')}
      <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">${escapeHtml(expiryNote)}</p>
      ${p('After setup, use the same email and password to access all of your projects.')}
    `,
    footerHtml: clientFooterHtml(),
  });

  await sendResendEmail({
    to: clientEmail,
    subject: clientSubject,
    text: clientText,
    html: clientHtml,
    replyTo: config.notifyTo,
  });
}

module.exports = {
  sendPortalAccessEmail,
};
