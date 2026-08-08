const { config } = require('../../../config');
const { SITE_LABEL } = require('../brand');
const {
  wrapEmailHtml,
  emailCtaHtml,
  p,
  clientFooterHtml,
} = require('../layout');
const { firstName, clientPasswordResetUrl, clientLoginUrl } = require('../helpers');
const { sendResendEmail } = require('../send');

async function sendClientPasswordResetEmail(client, reset) {
  if (!client?.email) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }
  const resetUrl = clientPasswordResetUrl(reset?.rawToken);
  if (!resetUrl) {
    const error = new Error('PUBLIC_APP_URL is not configured.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  const first = firstName(client.name) || 'there';
  const minutes = config.clientPasswordResetTtlMinutes || 60;
  const subject = 'Reset Your Client Portal Password';
  const text = [
    `Hi ${first},`,
    '',
    'We received a request to reset your client portal password.',
    '',
    `Reset your password: ${resetUrl}`,
    `This link expires in ${minutes} minutes and can only be used once.`,
    '',
    'If you did not request this change, you can ignore this email and your password will remain unchanged.',
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');
  const html = wrapEmailHtml({
    preheader: subject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p('We received a request to reset your client portal password.')}
      ${emailCtaHtml(resetUrl, 'Reset Password')}
      ${p(`This link expires in ${minutes} minutes and can only be used once.`, {
        muted: true,
      })}
      ${p(
        'If you did not request this change, you can ignore this email and your password will remain unchanged.'
      )}
    `,
    footerHtml: clientFooterHtml(),
  });

  return sendResendEmail({
    to: client.email,
    subject,
    text,
    html,
    replyTo: config.notifyTo,
  });
}

async function sendClientPasswordChangedEmail(client) {
  if (!client?.email) return null;
  const loginUrl = clientLoginUrl();
  const first = firstName(client.name) || 'there';
  const subject = 'Your Client Portal Password Was Updated';
  const text = [
    `Hi ${first},`,
    '',
    'Your client portal password was successfully updated. Any previous portal sessions have been signed out.',
    '',
    loginUrl ? `Client login: ${loginUrl}` : null,
    '',
    'If you did not make this change, reply to this email right away.',
    '',
    `— ${SITE_LABEL}`,
  ]
    .filter((line) => line !== null)
    .join('\n');
  const html = wrapEmailHtml({
    preheader: subject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(
        'Your client portal password was successfully updated. Any previous portal sessions have been signed out.'
      )}
      ${loginUrl ? emailCtaHtml(loginUrl, 'Client Login') : ''}
      ${p('If you did not make this change, reply to this email right away.')}
    `,
    footerHtml: clientFooterHtml(),
  });

  return sendResendEmail({
    to: client.email,
    subject,
    text,
    html,
    replyTo: config.notifyTo,
  });
}

module.exports = {
  sendClientPasswordResetEmail,
  sendClientPasswordChangedEmail,
};
