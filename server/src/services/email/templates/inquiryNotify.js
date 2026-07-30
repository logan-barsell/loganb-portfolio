const { config } = require('../../../config');
const {
  PACKAGE_LABELS,
  TIMELINE_LABELS,
  BUDGET_LABELS,
  CONTENT_READINESS_LABELS,
  intakeOptionLabel,
} = require('../../../config/constants');
const {
  wrapEmailHtml,
  htmlRow,
  htmlDetailTable,
  heading,
  adminFooterHtml,
} = require('../layout');
const { line } = require('../helpers');
const { sendResendEmail } = require('../send');

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
  const { subject, text, html } = buildEmail(inquiry, attachments);
  return sendResendEmail({
    to: config.notifyTo,
    replyTo: inquiry.email,
    subject,
    text,
    html,
  });
}

module.exports = {
  buildEmail,
  sendInquiryNotification,
};
