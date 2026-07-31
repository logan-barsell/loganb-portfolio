const { config } = require('../../../config');
const { SITE_LABEL } = require('../brand');
const {
  escapeHtml,
  wrapEmailHtml,
  emailCtaHtml,
  htmlRow,
  p,
  clientFooterHtml,
  adminNoticeHtml,
} = require('../layout');
const { projectEmailContext } = require('../helpers');
const { sendResendEmail } = require('../send');

/**
 * @param {{ project: object, client?: object, inquiry?: object, startedBy?: string }} args
 */
async function sendProjectStartedEmail({ project, client, inquiry, startedBy = 'admin' }) {
  const { clientName, businessName, clientEmail, first, projectId, portalUrl } =
    projectEmailContext({ project, client, inquiry });
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const clientSubject = `Your project has started — ${businessName}`;
  const clientText = [
    `Hi ${first},`,
    '',
    `Great news — work on ${businessName} has officially started.`,
    '',
    'You can use your project portal to review details and share files anytime.',
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
        strongInnerHtml: `Great news — work on <strong>${escapeHtml(
          businessName
        )}</strong> has officially started.`,
      })}
      ${p('You can use your project portal to review details and share files anytime.')}
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

  if (startedBy !== 'system') return;

  const adminSubject = `Project auto-started — ${businessName}`;
  const adminText = [
    `Project ${businessName} was auto-started (payment + kickoff conditions met).`,
    '',
    `Client: ${clientName}`,
    `Client email: ${clientEmail}`,
    projectId ? `Project ID: ${projectId}` : null,
    '',
    'The client was emailed that work has started.',
  ]
    .filter((part) => part !== null)
    .join('\n');

  const adminHtml = adminNoticeHtml(
    adminSubject,
    [
      htmlRow('Client', clientName),
      htmlRow('Business', businessName),
      htmlRow('Client email', clientEmail),
      htmlRow('Project ID', projectId),
      htmlRow('Started by', 'system (auto-activation)'),
    ].join(''),
    p('The client was emailed that work has started.', { muted: true })
  );

  await sendResendEmail({
    to: config.notifyTo,
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
    replyTo: clientEmail,
  });
}

module.exports = {
  sendProjectStartedEmail,
};
