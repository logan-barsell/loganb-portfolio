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

const config = {
  env: process.env.NODE_ENV || 'development',
  host: process.env.HOST || '127.0.0.1',
  port: Number(process.env.PORT || 3001),
  trustProxy: process.env.TRUST_PROXY === '1',
  databasePath: path.resolve(rootDir, process.env.DATABASE_PATH || './data/inquiries.sqlite'),
  uploadPath: path.resolve(rootDir, process.env.UPLOAD_PATH || './data/uploads'),
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFrom: process.env.RESEND_FROM || 'Logan Barsell Web Services <website@mail.loganbarsell.com>',
  notifyTo: process.env.INQUIRY_NOTIFY_TO || 'contact@loganbarsell.com',
};

function assertProductionConfig() {
  if (config.env !== 'production') return;
  required('RESEND_API_KEY');
  required('RESEND_FROM');
  required('INQUIRY_NOTIFY_TO');
  required('DATABASE_PATH');
  required('UPLOAD_PATH');
}

module.exports = { config, assertProductionConfig };
