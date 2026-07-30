const { config } = require('../../../config');
const { BRAND, SITE_LABEL } = require('../brand');
const {
  escapeHtml,
  wrapEmailHtml,
  htmlRow,
  p,
  clientFooterHtml,
  adminNoticeHtml,
} = require('../layout');
const { decisionContext } = require('../helpers');
const { sendResendEmail } = require('../send');

async function sendProposalRevisionEmails(proposal, message) {
  const { clientName, businessName, clientEmail, first } = decisionContext(proposal);
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const clientSubject = `Revision request received — ${businessName}`;
  const clientText = [
    `Hi ${first},`,
    '',
    `Thanks for sharing your revision notes for ${businessName}. I've received them and will review shortly.`,
    '',
    'Your request:',
    message,
    '',
    'I will follow up with an updated proposal when ready.',
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');

  const clientHtml = wrapEmailHtml({
    preheader: clientSubject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(null, {
        strongInnerHtml: `Thanks for sharing your revision notes for <strong>${escapeHtml(
          businessName
        )}</strong>. I've received them and will review shortly.`,
      })}
      <p style="margin:0 0 8px;color:${BRAND.bodyText};"><strong>Your request:</strong></p>
      <p style="margin:0 0 16px;color:${BRAND.bodyText};white-space:pre-wrap;">${escapeHtml(
        message
      )}</p>
      ${p('I will follow up with an updated proposal when ready.')}
    `,
    footerHtml: clientFooterHtml(),
  });

  const adminSubject = `Revision requested — ${businessName}`;
  const adminText = [
    `${clientName} requested revisions for ${businessName}.`,
    '',
    `Client email: ${clientEmail}`,
    `Proposal ID: ${proposal.id}`,
    '',
    'Revision notes:',
    message,
  ].join('\n');

  const adminHtml = adminNoticeHtml(
    adminSubject,
    [
      htmlRow('Client', clientName),
      htmlRow('Business', businessName),
      htmlRow('Client email', clientEmail),
      htmlRow('Proposal ID', proposal.id),
      htmlRow('Revision notes', message),
    ].join('')
  );

  await sendResendEmail({
    to: clientEmail,
    subject: clientSubject,
    text: clientText,
    html: clientHtml,
    replyTo: config.notifyTo,
  });
  await sendResendEmail({
    to: config.notifyTo,
    subject: adminSubject,
    text: adminText,
    html: adminHtml,
    replyTo: clientEmail,
  });
}

module.exports = {
  sendProposalRevisionEmails,
};
