const { config } = require('../../../config');
const { PACKAGE_LABELS } = require('../../../config/constants');
const { SITE_LABEL } = require('../brand');
const { wrapEmailHtml, p, clientFooterHtml } = require('../layout');
const { firstName } = require('../helpers');
const { sendResendEmail } = require('../send');

function buildInquiryConfirmation(inquiry) {
  const isProject = inquiry.type === 'project';
  const first = firstName(inquiry.name) || 'there';
  const packageLabel = PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug || null;

  const subject = isProject
    ? 'We received your project inquiry — Logan Barsell Web Services'
    : 'We received your message — Logan Barsell Web Services';

  const intro = isProject
    ? packageLabel
      ? `Thanks for submitting your project inquiry for ${packageLabel}. I've received your details and will review them shortly.`
      : `Thanks for submitting your project inquiry. I've received your details and will review them shortly.`
    : `Thanks for reaching out. I've received your message and will get back to you soon.`;

  const nextLine = isProject ? `I'll follow up by email with next steps.` : null;

  const text = [
    `Hi ${first},`,
    '',
    intro,
    nextLine,
    '',
    'Reply to this email anytime if you have questions.',
    '',
    `— ${SITE_LABEL}`,
  ]
    .filter((part) => part !== null)
    .join('\n');

  const bodyHtml = [p(`Hi ${first},`), p(intro), nextLine ? p(nextLine) : ''].join('');

  const html = wrapEmailHtml({
    preheader: subject,
    bodyHtml,
    footerHtml: clientFooterHtml(),
  });

  return { subject, text, html };
}

/**
 * Confirmation email to the person who submitted Contact / Start a Project.
 */
async function sendInquiryConfirmation(inquiry) {
  const to = inquiry?.email;
  if (!to) {
    const error = new Error('Inquiry email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const { subject, text, html } = buildInquiryConfirmation(inquiry);
  await sendResendEmail({
    to,
    subject,
    text,
    html,
    replyTo: config.notifyTo,
  });
}

module.exports = {
  sendInquiryConfirmation,
};
