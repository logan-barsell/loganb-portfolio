const { config } = require('../../../config');
const { SITE_LABEL } = require('../brand');
const {
  escapeHtml,
  wrapEmailHtml,
  emailCtaHtml,
  p,
  clientFooterHtml,
} = require('../layout');
const { projectEmailContext } = require('../helpers');
const { sendResendEmail } = require('../send');

/**
 * @param {{ project: object, client?: object, inquiry?: object }} args
 */
async function sendProjectReadyForLaunchEmail({ project, client, inquiry }) {
  const { businessName, clientEmail, first, portalUrl } = projectEmailContext({
    project,
    client,
    inquiry,
  });
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const clientSubject = `Ready to launch — ${businessName}`;
  const intro =
    `The site for ${businessName} is ready to go live. You can start hosting from your project portal when you're ready.`;
  const dnsNote =
    'We may still need to align on domain or DNS details before everything is fully live — reply anytime if you want help with that.';

  const clientText = [
    `Hi ${first},`,
    '',
    intro,
    '',
    dnsNote,
    portalUrl ? `Open your portal: ${portalUrl}` : null,
    '',
    'Reply to this email anytime if you have questions.',
    '',
    `— ${SITE_LABEL}`,
  ]
    .filter((part) => part !== null)
    .join('\n');

  const clientHtml = wrapEmailHtml({
    preheader: clientSubject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(null, {
        strongInnerHtml: `The site for <strong>${escapeHtml(
          businessName
        )}</strong> is ready to go live. You can start hosting from your project portal when you're ready.`,
      })}
      ${p(dnsNote)}
      ${portalUrl ? emailCtaHtml(portalUrl, 'Open Project Portal') : ''}
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
  sendProjectReadyForLaunchEmail,
};
