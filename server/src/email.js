const { Resend } = require('resend');
const { config } = require('./config');
const {
  PACKAGE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
  intakeOptionLabel,
} = require('./constants');

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

function htmlRow(label, value) {
  if (!value) return '';
  return `<tr><td style="padding:4px 12px 4px 0;vertical-align:top;color:#666;"><strong>${escapeHtml(
    label
  )}</strong></td><td style="padding:4px 0;white-space:pre-wrap;">${escapeHtml(value)}</td></tr>`;
}

function buildEmail(inquiry, attachments = []) {
  const isProject = inquiry.type === 'project';
  const subject = isProject
    ? `New project inquiry — ${PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug || 'Website'}`
    : `New contact message from ${inquiry.name}`;

  const attachmentNames = attachments.map((file) => file.original_name || file.originalName).filter(Boolean);
  const attachmentLine = attachmentNames.length
    ? attachmentNames.join(', ')
    : null;

  const text = [
    isProject ? 'New project intake submission' : 'New contact form submission',
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

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#111;">
      <h2 style="margin:0 0 12px;">${escapeHtml(
        isProject ? 'New project intake submission' : 'New contact form submission'
      )}</h2>
      <table style="border-collapse:collapse;">
        ${htmlRow('Inquiry ID', inquiry.id)}
        ${htmlRow('Name', inquiry.name)}
        ${htmlRow('Email', inquiry.email)}
        ${htmlRow('Phone', inquiry.phone)}
        ${htmlRow('Business', inquiry.business_name)}
        ${htmlRow('Package', PACKAGE_LABELS[inquiry.package_slug] || inquiry.package_slug)}
        ${htmlRow('Website goals', inquiry.website_goals)}
        ${htmlRow('Current website', inquiry.current_website)}
        ${htmlRow('Requested features', inquiry.requested_features)}
        ${htmlRow('Inspiration links', inquiry.inspiration_links)}
        ${htmlRow('Domain info', inquiry.domain_info)}
        ${htmlRow('Branding notes', inquiry.branding_notes)}
        ${htmlRow('Content readiness', intakeOptionLabel(CONTENT_READINESS_LABELS, inquiry.content_readiness))}
        ${htmlRow('Timeline', intakeOptionLabel(TIMELINE_LABELS, inquiry.timeline))}
        ${htmlRow('Budget', intakeOptionLabel(BUDGET_LABELS, inquiry.budget))}
        ${htmlRow('Message', inquiry.message)}
        ${htmlRow('Attachments', attachmentLine)}
      </table>
      <p style="margin-top:16px;color:#555;">Reply to this email to respond to the visitor.</p>
    </div>
  `;

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
    '— Logan Barsell Web Services',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:560px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 20px;white-space:pre-wrap;">${escapeHtml(bodyText)}</p>
      <p style="margin:0 0 28px;">
        <a href="${escapeHtml(viewUrl)}"
           style="display:inline-block;background:#2e7d32;color:#fff;text-decoration:none;padding:12px 20px;border-radius:4px;font-weight:600;">
          View Proposal
        </a>
      </p>
      <p style="margin:0;color:#555;font-size:13px;">
        Or open this link: <a href="${escapeHtml(viewUrl)}" style="color:#2e7d32;">${escapeHtml(
          viewUrl
        )}</a>
      </p>
      <p style="margin:24px 0 0;color:#555;">— Logan Barsell Web Services</p>
    </div>
  `;

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

async function sendProposalAcceptedEmails(proposal) {
  const { clientName, businessName, clientEmail, first } = decisionContext(proposal);
  if (!clientEmail) {
    const error = new Error('Client email is missing.');
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  const clientSubject = `You're approved — next steps for ${businessName}`;
  const clientText = [
    `Hi ${first},`,
    '',
    `Thank you for accepting the proposal for ${businessName}. I'm excited to work with you.`,
    '',
    'What happens next:',
    '1. I will follow up shortly to confirm kickoff details and timeline.',
    '2. We will align on content, branding, and any materials needed from you.',
    '3. Once we are ready to start, I will share payment / onboarding steps.',
    '',
    'Reply to this email anytime if you have questions.',
    '',
    '— Logan Barsell Web Services',
  ].join('\n');

  const clientHtml = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:560px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(first)},</p>
      <p style="margin:0 0 16px;">Thank you for accepting the proposal for <strong>${escapeHtml(
        businessName
      )}</strong>. I'm excited to work with you.</p>
      <p style="margin:0 0 8px;"><strong>What happens next:</strong></p>
      <ol style="margin:0 0 16px;padding-left:20px;">
        <li>I will follow up shortly to confirm kickoff details and timeline.</li>
        <li>We will align on content, branding, and any materials needed from you.</li>
        <li>Once we are ready to start, I will share payment / onboarding steps.</li>
      </ol>
      <p style="margin:0 0 16px;">Reply to this email anytime if you have questions.</p>
      <p style="margin:0;color:#555;">— Logan Barsell Web Services</p>
    </div>
  `;

  const adminSubject = `Proposal accepted — ${businessName}`;
  const adminText = [
    `${clientName} accepted the proposal for ${businessName}.`,
    '',
    `Client email: ${clientEmail}`,
    `Proposal ID: ${proposal.id}`,
    `Inquiry ID: ${proposal.inquiry_id}`,
    '',
    'A project record was created/activated. Follow up on kickoff next.',
  ].join('\n');

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
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${escapeHtml(
      adminText
    )}</pre>`,
    replyTo: clientEmail,
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
    '— Logan Barsell Web Services',
  ].join('\n');

  const clientHtml = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:560px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(first)},</p>
      <p style="margin:0 0 16px;">Thanks for sharing your revision notes for <strong>${escapeHtml(
        businessName
      )}</strong>. I've received them and will review shortly.</p>
      <p style="margin:0 0 8px;"><strong>Your request:</strong></p>
      <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(message)}</p>
      <p style="margin:0 0 16px;">I will follow up with an updated proposal when ready.</p>
      <p style="margin:0;color:#555;">— Logan Barsell Web Services</p>
    </div>
  `;

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
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${escapeHtml(
      adminText
    )}</pre>`,
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

  const reasonBlock = reason
    ? `\nReason shared:\n${reason}\n`
    : '\n';

  const clientSubject = `Proposal declined — ${businessName}`;
  const clientText = [
    `Hi ${first},`,
    '',
    `This confirms you declined the proposal for ${businessName}.`,
    reasonBlock,
    'No hard feelings — if you change your mind or want to revisit later, reply to this email anytime.',
    '',
    '— Logan Barsell Web Services',
  ].join('\n');

  const clientHtml = `
    <div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#111;max-width:560px;">
      <p style="margin:0 0 16px;">Hi ${escapeHtml(first)},</p>
      <p style="margin:0 0 16px;">This confirms you declined the proposal for <strong>${escapeHtml(
        businessName
      )}</strong>.</p>
      ${
        reason
          ? `<p style="margin:0 0 8px;"><strong>Reason shared:</strong></p>
      <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(reason)}</p>`
          : ''
      }
      <p style="margin:0 0 16px;">No hard feelings — if you change your mind or want to revisit later, reply to this email anytime.</p>
      <p style="margin:0;color:#555;">— Logan Barsell Web Services</p>
    </div>
  `;

  const adminSubject = `Proposal declined — ${businessName}`;
  const adminText = [
    `${clientName} declined the proposal for ${businessName}.`,
    '',
    `Client email: ${clientEmail}`,
    `Proposal ID: ${proposal.id}`,
    reason ? `\nReason:\n${reason}` : 'No reason provided.',
  ].join('\n');

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
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;">${escapeHtml(
      adminText
    )}</pre>`,
    replyTo: clientEmail,
  });
}

module.exports = {
  sendInquiryNotification,
  sendProposalShareEmail,
  sendProposalAcceptedEmails,
  sendProposalRevisionEmails,
  sendProposalDeclinedEmails,
  buildEmail,
};
