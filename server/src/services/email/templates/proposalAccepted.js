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
  portalProjectUrl,
  formatSetupExpiryNote,
} = require('../helpers');
const { sendResendEmail } = require('../send');

function formatKickoffForEmail(ymd) {
  if (!ymd) return null;
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(
      new Date(`${ymd}T00:00:00Z`)
    );
  } catch {
    return ymd;
  }
}

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
  const portalUrl = !setupUrl && projectId ? portalProjectUrl(projectId) : null;
  const expiryNote = portalSetup ? formatSetupExpiryNote(portalSetup.expiresAt) : null;

  const kickoffLabel = formatKickoffForEmail(proposal.kickoff_date);
  const timelineSummary = String(proposal.timeline_summary || '').trim() || null;

  const scheduleLines = [];
  if (kickoffLabel) scheduleLines.push(`Target kickoff: ${kickoffLabel}`);
  if (timelineSummary) scheduleLines.push(`Timeline: ${timelineSummary}`);

  const clientSubject = `Proposal confirmed — next steps for ${businessName}`;
  const nextSteps = setupUrl
    ? [
        'What happens next:',
        '1. Open your project portal link below and choose a password (one-time setup).',
        '2. Use the portal to review project details and share files.',
        '3. I will follow up on content, payment, and kickoff timing.',
      ]
    : [
        'What happens next:',
        '1. Open your new project using the link below and sign in with your existing client portal password.',
        '2. Use the portal to review project details and share files.',
        '3. I will follow up on content, payment, and kickoff timing.',
      ];

  const portalTextBlock = setupUrl
    ? [
        '',
        'Set up your project portal:',
        setupUrl,
        expiryNote,
        'You will choose your own password. The same client account will provide access to any future projects.',
      ]
    : portalUrl
      ? [
          '',
          'Open your project:',
          portalUrl,
          'Use the same password you use for your other client portal projects.',
        ]
      : [];

  const scheduleTextBlock = scheduleLines.length
    ? ['', 'Schedule:', ...scheduleLines]
    : [];

  const clientText = [
    `Hi ${first},`,
    '',
    `Thank you for accepting the proposal for ${businessName}. I'm excited to work with you.`,
    '',
    'Your project is set up and currently on hold until kickoff. Work begins after the project is officially started.',
    ...scheduleTextBlock,
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
      )} You will choose one password for your client account.</p>
    `
    : portalUrl
      ? `
      <p style="margin:0 0 8px;color:${BRAND.bodyText};"><strong>Open your project</strong></p>
      ${emailCtaHtml(portalUrl, 'View Project')}
      <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">Use your existing client portal password.</p>
    `
      : '';

  const scheduleHtmlRows = [
    kickoffLabel ? htmlRow('Target kickoff', kickoffLabel) : '',
    timelineSummary ? htmlRow('Timeline', timelineSummary) : '',
  ].join('');

  const scheduleHtmlBlock = scheduleHtmlRows
    ? `
      <p style="margin:16px 0 8px;color:${BRAND.bodyText};"><strong>Schedule</strong></p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;">
        ${scheduleHtmlRows}
      </table>
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
      ${p(
        'Your project is set up and currently on hold until kickoff. Work begins after the project is officially started.'
      )}
      ${scheduleHtmlBlock}
      <p style="margin:0 0 8px;color:${BRAND.bodyText};"><strong>What happens next:</strong></p>
      <ol style="margin:0 0 16px;padding-left:20px;color:${BRAND.bodyText};">
        ${
          setupUrl
            ? `<li>Open your project portal link below and choose a password (one-time setup).</li>
        <li>Use the portal to review project details and share files.</li>
        <li>I will follow up on content, payment, and kickoff timing.</li>`
            : `<li>Open your new project using the link below and sign in with your existing client portal password.</li>
        <li>Use the portal to review project details and share files.</li>
        <li>I will follow up on content, payment, and kickoff timing.</li>`
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
    kickoffLabel ? `Target kickoff: ${kickoffLabel}` : null,
    timelineSummary ? `Timeline: ${timelineSummary}` : null,
    '',
    setupUrl
      ? 'A project was created on hold and a portal setup invite was emailed to the client.'
      : 'A project was created on hold and the client was sent a direct portal link for their existing account.',
  ]
    .filter((part) => part !== null)
    .join('\n');

  const adminNote = setupUrl
    ? p(
        'A project was created on hold and a portal setup invite was emailed to the client.',
        { muted: true }
      )
    : p(
        'A project was created on hold and the client was sent a direct portal link for their existing account.',
        { muted: true }
      );

  const adminHtml = adminNoticeHtml(
    adminSubject,
    [
      htmlRow('Client', clientName),
      htmlRow('Business', businessName),
      htmlRow('Client email', clientEmail),
      htmlRow('Proposal ID', proposal.id),
      htmlRow('Inquiry ID', proposal.inquiry_id),
      htmlRow('Project ID', projectId),
      htmlRow('Target kickoff', kickoffLabel),
      htmlRow('Timeline', timelineSummary),
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
