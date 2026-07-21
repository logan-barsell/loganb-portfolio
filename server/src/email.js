const { Resend } = require('resend');
const { config } = require('./config');
const { PACKAGE_LABELS } = require('./constants');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    line('Content readiness', inquiry.content_readiness),
    line('Timeline', inquiry.timeline),
    line('Budget', inquiry.budget),
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
        ${htmlRow('Content readiness', inquiry.content_readiness)}
        ${htmlRow('Timeline', inquiry.timeline)}
        ${htmlRow('Budget', inquiry.budget)}
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

module.exports = {
  sendInquiryNotification,
  buildEmail,
};
