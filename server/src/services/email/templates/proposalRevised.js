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

const DEFAULT_REVISED_MESSAGE =
  'I updated your proposal based on our latest discussion. Use the button below to review the revised version — you can accept, request another revision, or decline from that page.';

async function sendProposalRevisedEmail({ to, cc = [], subject, message, viewUrl, clientName }) {
  const greetingName = firstName(clientName) || 'there';
  const bodyText = String(message || DEFAULT_REVISED_MESSAGE).trim();
  const text = [
    `Hi ${greetingName},`,
    '',
    bodyText,
    '',
    `View your revised proposal: ${viewUrl}`,
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
      ${emailCtaHtml(viewUrl, 'View Revised Proposal')}
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
  sendProposalRevisedEmail,
  DEFAULT_REVISED_MESSAGE,
};
