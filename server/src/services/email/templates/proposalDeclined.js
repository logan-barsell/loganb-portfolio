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

async function sendProposalDeclinedEmails(proposal, reason) {
  const { clientName, businessName, clientEmail, first } = decisionContext(proposal);
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const reasonBlock = reason ? `\nReason shared:\n${reason}\n` : '\n';

  const clientSubject = `Proposal declined — ${businessName}`;
  const clientText = [
    `Hi ${first},`,
    '',
    `This confirms you declined the proposal for ${businessName}.`,
    reasonBlock,
    'No hard feelings — if you change your mind or want to revisit later, reply to this email anytime.',
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');

  const clientHtml = wrapEmailHtml({
    preheader: clientSubject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(null, {
        strongInnerHtml: `This confirms you declined the proposal for <strong>${escapeHtml(
          businessName
        )}</strong>.`,
      })}
      ${
        reason
          ? `<p style="margin:0 0 8px;color:${BRAND.bodyText};"><strong>Reason shared:</strong></p>
      <p style="margin:0 0 16px;color:${BRAND.bodyText};white-space:pre-wrap;">${escapeHtml(
              reason
            )}</p>`
          : ''
      }
      ${p(
        'No hard feelings — if you change your mind or want to revisit later, reply to this email anytime.'
      )}
    `,
    footerHtml: clientFooterHtml(),
  });

  const adminSubject = `Proposal declined — ${businessName}`;
  const adminText = [
    `${clientName} declined the proposal for ${businessName}.`,
    '',
    `Client email: ${clientEmail}`,
    `Proposal ID: ${proposal.id}`,
    reason ? `\nReason:\n${reason}` : 'No reason provided.',
  ].join('\n');

  const adminHtml = adminNoticeHtml(
    adminSubject,
    [
      htmlRow('Client', clientName),
      htmlRow('Business', businessName),
      htmlRow('Client email', clientEmail),
      htmlRow('Proposal ID', proposal.id),
      htmlRow('Reason', reason || 'No reason provided.'),
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
  sendProposalDeclinedEmails,
};
