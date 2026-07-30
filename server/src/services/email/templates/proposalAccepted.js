const { config } = require('../../../config');
const { BRAND, SITE_LABEL } = require('../brand');
const {
  escapeHtml,
  wrapEmailHtml,
  emailCtaHtml,
  htmlRow,
  p,
  clientFooterHtml,
  adminNoticeHtml,
} = require('../layout');
const {
  decisionContext,
  portalSetupUrl,
  formatSetupExpiryNote,
} = require('../helpers');
const { sendResendEmail } = require('../send');

/**
 * @param {object} proposal
 * @param {{ portalSetup?: { rawToken: string, expiresAt: string } | null, projectId?: string | null }} [options]
 */
async function sendProposalAcceptedEmails(proposal, options = {}) {
  const { clientName, businessName, clientEmail, first } = decisionContext(proposal);
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const portalSetup = options.portalSetup || null;
  const projectId = options.projectId || null;
  const setupUrl =
    portalSetup && projectId ? portalSetupUrl(projectId, portalSetup.rawToken) : null;
  const expiryNote = portalSetup ? formatSetupExpiryNote(portalSetup.expiresAt) : null;

  const clientSubject = `You're approved — next steps for ${businessName}`;
  const nextSteps = setupUrl
    ? [
        'What happens next:',
        '1. Open your project portal link below and choose a password (one-time setup).',
        '2. Use the portal to review project details and share files.',
        '3. I will follow up on kickoff, content, and payment steps.',
      ]
    : [
        'What happens next:',
        '1. I will follow up shortly to confirm kickoff details and timeline.',
        '2. We will align on content, branding, and any materials needed from you.',
        '3. Once we are ready to start, I will share payment / onboarding steps.',
      ];

  const portalTextBlock = setupUrl
    ? [
        '',
        'Set up your project portal:',
        setupUrl,
        expiryNote,
        'You will choose your own password — nothing is emailed as a temporary password.',
      ]
    : [];

  const clientText = [
    `Hi ${first},`,
    '',
    `Thank you for accepting the proposal for ${businessName}. I'm excited to work with you.`,
    '',
    ...nextSteps,
    ...portalTextBlock,
    '',
    'Reply to this email anytime if you have questions.',
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');

  const portalHtmlBlock = setupUrl
    ? `
      <p style="margin:0 0 8px;color:${BRAND.bodyText};"><strong>Set up your project portal</strong></p>
      ${emailCtaHtml(setupUrl, 'Set Up Portal')}
      <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">${escapeHtml(
        expiryNote
      )} You will choose your own password.</p>
    `
    : '';

  const clientHtml = wrapEmailHtml({
    preheader: clientSubject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(null, {
        strongInnerHtml: `Thank you for accepting the proposal for <strong>${escapeHtml(
          businessName
        )}</strong>. I'm excited to work with you.`,
      })}
      <p style="margin:0 0 8px;color:${BRAND.bodyText};"><strong>What happens next:</strong></p>
      <ol style="margin:0 0 16px;padding-left:20px;color:${BRAND.bodyText};">
        ${
          setupUrl
            ? `<li>Open your project portal link below and choose a password (one-time setup).</li>
        <li>Use the portal to review project details and share files.</li>
        <li>I will follow up on kickoff, content, and payment steps.</li>`
            : `<li>I will follow up shortly to confirm kickoff details and timeline.</li>
        <li>We will align on content, branding, and any materials needed from you.</li>
        <li>Once we are ready to start, I will share payment / onboarding steps.</li>`
        }
      </ol>
      ${portalHtmlBlock}
    `,
    footerHtml: clientFooterHtml(),
  });

  const adminSubject = `Proposal accepted — ${businessName}`;
  const adminText = [
    `${clientName} accepted the proposal for ${businessName}.`,
    '',
    `Client email: ${clientEmail}`,
    `Proposal ID: ${proposal.id}`,
    `Inquiry ID: ${proposal.inquiry_id}`,
    projectId ? `Project ID: ${projectId}` : null,
    '',
    setupUrl
      ? 'A project record was created/activated and a portal setup invite was emailed to the client.'
      : 'A project record was created/activated. Follow up on kickoff next.',
  ]
    .filter((part) => part !== null)
    .join('\n');

  const adminNote = setupUrl
    ? p(
        'A project record was created/activated and a portal setup invite was emailed to the client.',
        { muted: true }
      )
    : p('A project record was created/activated. Follow up on kickoff next.', { muted: true });

  const adminHtml = adminNoticeHtml(
    adminSubject,
    [
      htmlRow('Client', clientName),
      htmlRow('Business', businessName),
      htmlRow('Client email', clientEmail),
      htmlRow('Proposal ID', proposal.id),
      htmlRow('Inquiry ID', proposal.inquiry_id),
      htmlRow('Project ID', projectId),
    ].join(''),
    adminNote
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
  sendProposalAcceptedEmails,
};
