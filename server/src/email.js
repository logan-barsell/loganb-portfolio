const { Resend } = require('resend');
const { config } = require('./config');
const {
  PACKAGE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
  intakeOptionLabel,
} = require('./constants');

const BRAND = {
  navy: '#010c19',
  textLight: '#d8e0f3',
  bodyText: '#1a2438',
  muted: '#5c6580',
  green: '#34a92c',
  purple: '#9563bb',
  pageBg: '#e8ecf4',
  // Off-white (not pure #fff) — less aggressively inverted in some clients
  cardBg: '#f7f8fc',
  border: 'rgba(149, 99, 187, 0.35)',
  font: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace, Arial, sans-serif",
};

const SITE_LABEL = 'Logan Barsell Web Services';
const PROD_EMAIL_LOGO_URL = 'https://loganbarsell.com/email-logo.png';

/** Prefer light rendering; force brand colors back when clients invert. */
const EMAIL_DARK_MODE_CSS = `
  :root { color-scheme: light only; }
  @media (prefers-color-scheme: dark) {
    .email-root,
    .email-root td,
    .email-shell {
      background-color: ${BRAND.pageBg} !important;
    }
    .email-card {
      background-color: ${BRAND.cardBg} !important;
      border-color: ${BRAND.border} !important;
    }
    .email-header {
      background-color: ${BRAND.navy} !important;
    }
    .email-header p,
    .email-header-title {
      color: ${BRAND.textLight} !important;
    }
    .email-accent {
      background-color: ${BRAND.green} !important;
    }
    .email-body,
    .email-body p,
    .email-body li,
    .email-body td,
    .email-body strong,
    .email-text {
      color: ${BRAND.bodyText} !important;
    }
    .email-muted,
    .email-footer,
    .email-footer p {
      color: ${BRAND.muted} !important;
    }
    .email-label {
      color: ${BRAND.purple} !important;
    }
    .email-link,
    .email-footer a {
      color: ${BRAND.green} !important;
    }
    .email-cta {
      background-color: ${BRAND.green} !important;
    }
    .email-cta a {
      color: #ffffff !important;
      -webkit-text-fill-color: #ffffff !important;
    }
  }
  /* Apple Mail dark-mode rewrite hooks */
  [data-ogsc] .email-header,
  [data-ogsb] .email-header {
    background-color: ${BRAND.navy} !important;
  }
  [data-ogsc] .email-cta,
  [data-ogsb] .email-cta {
    background-color: ${BRAND.green} !important;
  }
  [data-ogsc] .email-cta a,
  [data-ogsb] .email-cta a {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
  }
  [data-ogsc] .email-accent,
  [data-ogsb] .email-accent {
    background-color: ${BRAND.green} !important;
  }
  [data-ogsc] .email-link,
  [data-ogsb] .email-link,
  [data-ogsc] .email-footer a,
  [data-ogsb] .email-footer a {
    color: ${BRAND.green} !important;
  }
`;

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function firstName(fullName) {
  const trimmed = String(fullName || '').trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] || null;
}

function line(label, value) {
  if (!value) return '';
  return `${label}: ${value}\n`;
}

function isLocalAppUrl(url) {
  if (!url) return true;
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return /localhost|127\.0\.0\.1/i.test(String(url));
  }
}

/** Logo must be a publicly reachable HTTPS URL (email clients can't load localhost). */
function emailLogoUrl() {
  if (config.emailLogoUrl) return config.emailLogoUrl;
  if (config.publicAppUrl && !isLocalAppUrl(config.publicAppUrl)) {
    return `${config.publicAppUrl}/email-logo.png`;
  }
  return PROD_EMAIL_LOGO_URL;
}

function siteUrl() {
  return config.publicAppUrl || 'https://loganbarsell.com';
}

/**
 * Shared branded HTML shell for client + admin emails.
 * @param {{ bodyHtml: string, preheader?: string, footerHtml?: string }} options
 */
function wrapEmailHtml({ bodyHtml, preheader = '', footerHtml = '' }) {
  const logoUrl = emailLogoUrl();
  const logoBlock = logoUrl
    ? `<img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(
        SITE_LABEL
      )}" height="48" style="display:block;margin:0 auto;height:48px;width:auto;border:0;" />`
    : `<div style="color:${BRAND.green};font-size:22px;font-weight:700;letter-spacing:0.02em;">{ L }</div>`;

  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(
        preheader
      )}</div>`
    : '';

  const defaultFooter = `
    <p class="email-muted" style="margin:0 0 6px;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      ${escapeHtml(SITE_LABEL)}
    </p>
    <p class="email-muted" style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      <a class="email-link" href="${escapeHtml(
        siteUrl()
      )}" style="color:${BRAND.green};text-decoration:none;">${escapeHtml(
        siteUrl().replace(/^https?:\/\//, '')
      )}</a>
    </p>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light only" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(SITE_LABEL)}</title>
  <style type="text/css">${EMAIL_DARK_MODE_CSS}</style>
</head>
<body class="email-root" style="margin:0;padding:0;background:${BRAND.pageBg};">
  ${preheaderBlock}
  <table role="presentation" class="email-shell" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${
    BRAND.pageBg
  };">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" class="email-card" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;background:${
          BRAND.cardBg
        };border-radius:8px;overflow:hidden;border:1px solid ${BRAND.border};font-family:${
          BRAND.font
        };">
          <tr>
            <td align="center" class="email-header" style="background:${BRAND.navy};padding:22px 24px;">
              ${logoBlock}
              <p class="email-header-title" style="margin:10px 0 0;color:${
                BRAND.textLight
              };font-size:12px;letter-spacing:0.04em;">
                ${escapeHtml(SITE_LABEL)}
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-accent" style="height:3px;line-height:3px;font-size:0;background:${
              BRAND.green
            };">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-body" style="padding:28px 24px;color:${
              BRAND.bodyText
            };font-size:15px;line-height:1.55;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="email-footer" style="padding:18px 24px 24px;border-top:1px solid ${BRAND.border};">
              ${footerHtml || defaultFooter}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailCtaHtml(url, buttonLabel) {
  return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
        <tr>
          <td class="email-cta" style="border-radius:4px;background:${BRAND.green};">
            <a href="${escapeHtml(url)}"
               style="display:inline-block;padding:12px 22px;color:#ffffff;-webkit-text-fill-color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;font-family:${
                 BRAND.font
               };">
              ${escapeHtml(buttonLabel)}
            </a>
          </td>
        </tr>
      </table>
      <p class="email-muted" style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;line-height:1.5;">
        Or open this link:<br />
        <a class="email-link" href="${escapeHtml(
          url
        )}" style="color:${BRAND.green};word-break:break-all;">${escapeHtml(url)}</a>
      </p>
  `;
}

function htmlRow(label, value) {
  if (!value) return '';
  return `<tr>
    <td class="email-label" style="padding:6px 14px 6px 0;vertical-align:top;color:${BRAND.purple};font-size:13px;font-weight:700;white-space:nowrap;">
      ${escapeHtml(label)}
    </td>
    <td class="email-text" style="padding:6px 0;vertical-align:top;color:${BRAND.bodyText};font-size:14px;white-space:pre-wrap;word-break:break-word;">
      ${escapeHtml(value)}
    </td>
  </tr>`;
}

function htmlDetailTable(rowsHtml) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 16px;">${rowsHtml}</table>`;
}

function p(text, { muted = false, strongInnerHtml = null } = {}) {
  const color = muted ? BRAND.muted : BRAND.bodyText;
  const cls = muted ? 'email-muted' : 'email-text';
  if (strongInnerHtml) {
    return `<p class="${cls}" style="margin:0 0 16px;color:${color};">${strongInnerHtml}</p>`;
  }
  return `<p class="${cls}" style="margin:0 0 16px;color:${color};">${escapeHtml(text)}</p>`;
}

function heading(text) {
  return `<h2 class="email-text" style="margin:0 0 16px;color:${BRAND.bodyText};font-size:18px;font-weight:700;line-height:1.3;">${escapeHtml(
    text
  )}</h2>`;
}

function clientFooterHtml(extra = 'Reply to this email anytime if you have questions.') {
  return `
    <p class="email-muted" style="margin:0 0 8px;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      ${escapeHtml(extra)}
    </p>
    <p class="email-muted" style="margin:0 0 6px;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      ${escapeHtml(SITE_LABEL)}
    </p>
    <p class="email-muted" style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      <a class="email-link" href="${escapeHtml(
        siteUrl()
      )}" style="color:${BRAND.green};text-decoration:none;">${escapeHtml(
        siteUrl().replace(/^https?:\/\//, '')
      )}</a>
    </p>
  `;
}

function adminFooterHtml(extra = 'Reply to this email to respond.') {
  return `
    <p class="email-muted" style="margin:0 0 8px;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      ${escapeHtml(extra)}
    </p>
    <p class="email-muted" style="margin:0;color:${BRAND.muted};font-size:12px;line-height:1.5;">
      ${escapeHtml(SITE_LABEL)} · Admin notification
    </p>
  `;
}

function buildEmail(inquiry, attachments = []) {
  const isProject = inquiry.type === 'project';
  const subject = isProject
    ? `New project inquiry — ${PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug || 'Website'}`
    : `New contact message from ${inquiry.name}`;

  const attachmentNames = attachments
    .map((file) => file.original_name || file.originalName)
    .filter(Boolean);
  const attachmentLine = attachmentNames.length ? attachmentNames.join(', ') : null;

  const title = isProject ? 'New project intake submission' : 'New contact form submission';

  const text = [
    title,
    '',
    line('Inquiry ID', inquiry.id),
    line('Name', inquiry.name),
    line('Email', inquiry.email),
    line('Phone', inquiry.phone),
    line('Business', inquiry.business_name),
    line('Package', PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug),
    line('Website goals', inquiry.website_goals),
    line('Current website', inquiry.current_website),
    line('Requested features', inquiry.requested_features),
    line('Inspiration links', inquiry.inspiration_links),
    line('Domain info', inquiry.domain_info),
    line('Branding notes', inquiry.branding_notes),
    line('Content readiness', intakeOptionLabel(CONTENT_READINESS_LABELS, inquiry.content_readiness)),
    line('Timeline', intakeOptionLabel(TIMELINE_LABELS, inquiry.timeline)),
    line('Budget', intakeOptionLabel(BUDGET_LABELS, inquiry.budget)),
    line('Message', inquiry.message),
    line('Attachments', attachmentLine),
    '',
    'Reply to this email to respond to the visitor.',
  ]
    .filter((part) => part !== null)
    .join('\n');

  const rows = [
    htmlRow('Inquiry ID', inquiry.id),
    htmlRow('Name', inquiry.name),
    htmlRow('Email', inquiry.email),
    htmlRow('Phone', inquiry.phone),
    htmlRow('Business', inquiry.business_name),
    htmlRow('Package', PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug),
    htmlRow('Website goals', inquiry.website_goals),
    htmlRow('Current website', inquiry.current_website),
    htmlRow('Requested features', inquiry.requested_features),
    htmlRow('Inspiration links', inquiry.inspiration_links),
    htmlRow('Domain info', inquiry.domain_info),
    htmlRow('Branding notes', inquiry.branding_notes),
    htmlRow(
      'Content readiness',
      intakeOptionLabel(CONTENT_READINESS_LABELS, inquiry.content_readiness)
    ),
    htmlRow('Timeline', intakeOptionLabel(TIMELINE_LABELS, inquiry.timeline)),
    htmlRow('Budget', intakeOptionLabel(BUDGET_LABELS, inquiry.budget)),
    htmlRow('Message', inquiry.message),
    htmlRow('Attachments', attachmentLine),
  ].join('');

  const html = wrapEmailHtml({
    preheader: subject,
    bodyHtml: `${heading(title)}${htmlDetailTable(rows)}`,
    footerHtml: adminFooterHtml('Reply to this email to respond to the visitor.'),
  });

  return { subject, text, html };
}

async function sendInquiryNotification(inquiry, attachments = []) {
  if (!config.resendApiKey || config.resendApiKey.startsWith('re_your_')) {
    const error = new Error('RESEND_API_KEY is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const resend = new Resend(config.resendApiKey);
  const { subject, text, html } = buildEmail(inquiry, attachments);

  const result = await resend.emails.send({
    from: config.resendFrom,
    to: [config.notifyTo],
    replyTo: inquiry.email,
    subject,
    text,
    html,
  });

  if (result.error) {
    const error = new Error(result.error.message || 'Resend failed to send email.');
    error.code = 'EMAIL_SEND_FAILED';
    error.details = result.error;
    throw error;
  }

  return result.data;
}

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

  const bodyHtml = [
    p(`Hi ${first},`),
    p(intro),
    nextLine ? p(nextLine) : '',
  ].join('');

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

async function sendProposalShareEmail({
  to,
  cc = [],
  subject,
  message,
  viewUrl,
  clientName,
}) {
  if (!config.resendApiKey || config.resendApiKey.startsWith('re_your_')) {
    const error = new Error('RESEND_API_KEY is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

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

  const resend = new Resend(config.resendApiKey);
  const payload = {
    from: config.resendFrom,
    to: Array.isArray(to) ? to : [to],
    replyTo: config.notifyTo,
    subject,
    text,
    html,
  };
  if (cc && cc.length) {
    payload.cc = cc;
  }

  const result = await resend.emails.send(payload);

  if (result.error) {
    const error = new Error(result.error.message || 'Resend failed to send email.');
    error.code = 'EMAIL_SEND_FAILED';
    error.details = result.error;
    throw error;
  }

  return result.data;
}

async function sendResendEmail({ to, subject, text, html, replyTo }) {
  if (!config.resendApiKey || config.resendApiKey.startsWith('re_your_')) {
    const error = new Error('RESEND_API_KEY is not configured.');
    error.code = 'EMAIL_NOT_CONFIGURED';
    throw error;
  }

  const resend = new Resend(config.resendApiKey);
  const payload = {
    from: config.resendFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
  };
  if (replyTo) payload.replyTo = replyTo;

  const result = await resend.emails.send(payload);
  if (result.error) {
    const error = new Error(result.error.message || 'Resend failed to send email.');
    error.code = 'EMAIL_SEND_FAILED';
    error.details = result.error;
    throw error;
  }
  return result.data;
}

function decisionContext(proposal) {
  const client = proposal.client || {};
  const inquiry = proposal.inquiry || {};
  const clientName = client.name || inquiry.name || 'there';
  const businessName =
    client.business_name || inquiry.business_name || client.name || inquiry.name || 'your project';
  const clientEmail = client.email || inquiry.email;
  return { clientName, businessName, clientEmail, first: firstName(clientName) || 'there' };
}

function portalSetupUrl(projectId, rawToken) {
  if (!config.publicAppUrl || !projectId || !rawToken) return null;
  return `${config.publicAppUrl}/project/${projectId}/setup/${rawToken}`;
}

function formatSetupExpiryNote(expiresAt) {
  const days = config.clientPortalSetupTtlDays || 7;
  if (!expiresAt) return `This link expires in ${days} days.`;
  try {
    const normalized = /Z$|[+-]\d{2}:?\d{2}$/.test(expiresAt)
      ? expiresAt
      : `${String(expiresAt).replace(' ', 'T')}Z`;
    const label = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }).format(new Date(normalized));
    return `This link expires ${label} UTC (about ${days} days).`;
  } catch {
    return `This link expires in ${days} days.`;
  }
}

function adminNoticeHtml(title, rowsHtml, noteHtml = '') {
  return wrapEmailHtml({
    preheader: title,
    bodyHtml: `${heading(title)}${htmlDetailTable(rowsHtml)}${noteHtml}`,
    footerHtml: adminFooterHtml('Reply to this email to respond to the client.'),
  });
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

/**
 * Email client a (re)set portal access setup link.
 * @param {{ name?: string, businessName?: string, email: string }} client
 * @param {{ projectId: string, rawToken: string, expiresAt: string, isReset?: boolean }} portalSetup
 */
async function sendPortalAccessEmail(client, portalSetup) {
  const clientEmail = client?.email;
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const businessName = client.businessName || client.name || 'your project';
  const first = firstName(client.name) || 'there';
  const setupUrl = portalSetupUrl(portalSetup.projectId, portalSetup.rawToken);
  if (!setupUrl) {
    const error = new Error('PUBLIC_APP_URL is not configured.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  const expiryNote = formatSetupExpiryNote(portalSetup.expiresAt);
  const isReset = Boolean(portalSetup.isReset);
  const clientSubject = isReset
    ? `Reset your project portal access — ${businessName}`
    : `Your project portal access — ${businessName}`;

  const intro = isReset
    ? `Use the link below to choose a new password for the ${businessName} project portal. Your previous password will stop working once you finish setup.`
    : `Use the link below to set a password and open the ${businessName} project portal.`;

  const clientText = [
    `Hi ${first},`,
    '',
    intro,
    '',
    `Set up your portal: ${setupUrl}`,
    expiryNote,
    '',
    'After setup, return anytime with your password at the project page.',
    '',
    'Reply to this email anytime if you have questions.',
    '',
    `— ${SITE_LABEL}`,
  ].join('\n');

  const clientHtml = wrapEmailHtml({
    preheader: clientSubject,
    bodyHtml: `
      ${p(`Hi ${first},`)}
      ${p(intro)}
      ${emailCtaHtml(setupUrl, 'Set Up Portal')}
      <p style="margin:0 0 16px;color:${BRAND.muted};font-size:13px;">${escapeHtml(expiryNote)}</p>
      ${p('After setup, return anytime with your password at the project page.')}
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
  sendInquiryNotification,
  sendInquiryConfirmation,
  sendProposalShareEmail,
  sendProposalAcceptedEmails,
  sendPortalAccessEmail,
  sendProposalRevisionEmails,
  sendProposalDeclinedEmails,
  buildEmail,
  wrapEmailHtml,
};
