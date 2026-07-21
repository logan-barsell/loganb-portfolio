const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const rootDir = path.join(__dirname, '..');
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
  required('ALLOWED_ORIGIN');

  if (config.adminSessionSecret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters in production.');
  }
  if (!config.adminPasswordHash.startsWith('scrypt$')) {
    throw new Error('ADMIN_PASSWORD_HASH must be a versioned scrypt hash from npm run hash-password.');
  }
}

module.exports = { config, assertProductionConfig };
