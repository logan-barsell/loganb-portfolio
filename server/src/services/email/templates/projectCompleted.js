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
 * @param {{ project: object, client?: object, inquiry?: object, hasHostingPlan?: boolean }} args
 */
async function sendProjectCompletedEmail({
  project,
  client,
  inquiry,
  hasHostingPlan = false,
}) {
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

  const clientSubject = `Project complete — ${businessName}`;
  const nextLine = hasHostingPlan
    ? 'Next up is launch prep. Hosting unlocks when the site is ready to go live — we may still coordinate domain or DNS details before then.'
    : 'If you need any follow-up changes or have questions, reply to this email anytime.';

  const clientText = [
    `Hi ${first},`,
    '',
    `The build for ${businessName} is complete.`,
    '',
    nextLine,
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
        strongInnerHtml: `The build for <strong>${escapeHtml(businessName)}</strong> is complete.`,
      })}
      ${p(nextLine)}
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
  sendProjectCompletedEmail,
};
