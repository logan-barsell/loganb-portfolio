const { Resend } = require('resend');
const { config } = require('../../config');

async function sendResendEmail({ to, cc, subject, text, html, replyTo }) {
  if (!config.resendApiKey || config.resendApiKey.startsWith('re_your_')) {
    const error = new Error('RESEND_API_KEY is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const resend = new Resend(config.resendApiKey);
  const payload = {
    from: config.resendFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
  };
  if (replyTo) payload.replyTo = replyTo;
  if (cc && cc.length) payload.cc = cc;

  const result = await resend.emails.send(payload);
  if (result.error) {
    const error = new Error(result.error.message || 'Resend failed to send email.');
    error.code = 'EMAIL_SEND_FAILED';
    error.details = result.error;
    throw error;
  }
  return result.data;
}

module.exports = {
  sendResendEmail,
};
