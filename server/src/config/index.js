const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../..', '.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const rootDir = path.join(__dirname, '../..');
const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3001),
  trustProxy: process.env.TRUST_PROXY === '1',
  databasePath: path.resolve(rootDir, process.env.DATABASE_PATH || './data/inquiries.sqlite'),
  uploadPath: path.resolve(rootDir, process.env.UPLOAD_PATH || './data/uploads'),
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || 'Logan Barsell Web Services <website@mail.loganbarsell.com>',
  notifyTo: process.env.INQUIRY_NOTIFY_TO || 'contact@loganbarsell.com',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH || '',
  adminSessionSecret: process.env.ADMIN_SESSION_SECRET || '',
  adminSessionTtlSeconds: Number(process.env.ADMIN_SESSION_TTL_SECONDS || 12 * 60 * 60),
  adminSessionCookieName: process.env.ADMIN_SESSION_COOKIE_NAME || 'lb_admin_session',
  allowedOrigin: process.env.ALLOWED_ORIGIN || (env === 'production' ? '' : 'http://localhost:3000'),
  publicAppUrl: (process.env.PUBLIC_APP_URL || (env === 'production' ? '' : 'http://localhost:3000')).replace(
    /\/$/,
    ''
  ),
  emailLogoUrl: (process.env.EMAIL_LOGO_URL || '').trim(),
  proposalShareTtlDays: Number(process.env.PROPOSAL_SHARE_TTL_DAYS || 14),
  clientSessionSecret: process.env.CLIENT_SESSION_SECRET || '',
  clientSessionTtlSeconds: Number(process.env.CLIENT_SESSION_TTL_SECONDS || 7 * 24 * 60 * 60),
  clientSessionCookieName: process.env.CLIENT_SESSION_COOKIE_NAME || 'lb_client_session',
  clientPortalSetupTtlDays: Number(process.env.CLIENT_PORTAL_SETUP_TTL_DAYS || 7),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  stripeHostingPriceIds: {
    hosting_39: process.env.STRIPE_HOSTING_PRICE_ID_39 || 'price_temp_hosting_39',
    hosting_25: process.env.STRIPE_HOSTING_PRICE_ID_25 || 'price_temp_hosting_25',
    hosting_10: process.env.STRIPE_HOSTING_PRICE_ID_10 || 'price_temp_hosting_10',
  },
};

function assertProductionConfig() {
  if (config.env !== 'production') return;
  required('RESEND_API_KEY');
  required('RESEND_FROM');
  required('INQUIRY_NOTIFY_TO');
  required('DATABASE_PATH');
  required('UPLOAD_PATH');
  required('ADMIN_EMAIL');
  required('ADMIN_PASSWORD_HASH');
  required('ADMIN_SESSION_SECRET');
  required('CLIENT_SESSION_SECRET');
  required('ALLOWED_ORIGIN');
  required('PUBLIC_APP_URL');

  if (config.adminSessionSecret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters in production.');
  }
  if (config.clientSessionSecret.length < 32) {
    throw new Error('CLIENT_SESSION_SECRET must be at least 32 characters in production.');
  }
  if (!config.adminPasswordHash.startsWith('scrypt$')) {
    throw new Error('ADMIN_PASSWORD_HASH must be a versioned scrypt hash from npm run hash-password.');
  }

  // If Stripe is enabled in production, require webhook secret and real Price IDs.
  if (config.stripeSecretKey) {
    if (!config.stripeWebhookSecret || config.stripeWebhookSecret.startsWith('whsec_replace')) {
      throw new Error('STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set in production.');
    }
    for (const [plan, priceId] of Object.entries(config.stripeHostingPriceIds)) {
      if (!priceId || String(priceId).startsWith('price_temp_')) {
        throw new Error(
          `STRIPE_HOSTING_PRICE_ID for ${plan} must be a real Stripe Price ID in production (got ${priceId}).`
        );
      }
    }
  }
}

module.exports = { config, assertProductionConfig };
