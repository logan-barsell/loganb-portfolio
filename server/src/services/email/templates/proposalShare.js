const { config } = require('../../../config');
const { BRAND, SITE_LABEL } = require('../brand');
const {
  escapeHtml,
  wrapEmailHtml,
  emailCtaHtml,
  p,
  clientFooterHtml,
} = require('../layout');
const { firstName } = require('../helpers');
const { sendResendEmail } = require('../send');

async function sendProposalShareEmail({ to, cc = [], subject, message, viewUrl, clientName }) {
  const greetingName = firstName(clientName) || 'there';
  const bodyText = String(message || '').trim();
  const text = [
    `Hi ${greetingName},`,
    '',
    bodyText,
    '',
    `View your proposal: ${viewUrl}`,
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');

  const html = wrapEmailHtml({
    preheader: subject,
    bodyHtml: `
      ${p(`Hi ${greetingName},`)}
      <p style="margin:0 0 20px;color:${BRAND.bodyText};white-space:pre-wrap;">${escapeHtml(
        bodyText
      )}</p>
      ${emailCtaHtml(viewUrl, 'View Proposal')}
    `,
    footerHtml: clientFooterHtml(),
  });

  return sendResendEmail({
    to: Array.isArray(to) ? to : [to],
    cc: cc && cc.length ? cc : undefined,
    replyTo: config.notifyTo,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendProposalShareEmail,
};
