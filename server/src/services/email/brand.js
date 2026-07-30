const { config } = require('../../config');

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

module.exports = {
  BRAND,
  SITE_LABEL,
  EMAIL_DARK_MODE_CSS,
  emailLogoUrl,
  siteUrl,
};
