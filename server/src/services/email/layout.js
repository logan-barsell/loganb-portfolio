const { BRAND, SITE_LABEL, EMAIL_DARK_MODE_CSS, emailLogoUrl, siteUrl } = require('./brand');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
    : `<div style="color:${BRAND.green};font-size:22px;font-weight:700;letter-spacing:0.02em;">${escapeHtml(
        SITE_LABEL
      )}</div>`;

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

function adminNoticeHtml(title, rowsHtml, noteHtml = '') {
  return wrapEmailHtml({
    preheader: title,
    bodyHtml: `${heading(title)}${htmlDetailTable(rowsHtml)}${noteHtml}`,
    footerHtml: adminFooterHtml('Reply to this email to respond to the client.'),
  });
}

module.exports = {
  escapeHtml,
  wrapEmailHtml,
  emailCtaHtml,
  htmlRow,
  htmlDetailTable,
  p,
  heading,
  clientFooterHtml,
  adminFooterHtml,
  adminNoticeHtml,
};
