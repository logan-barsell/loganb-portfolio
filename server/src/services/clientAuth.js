const {
  getDb,
  findClientByEmail,
  listPortalProjectsForClient,
  issuePasswordResetToken,
  getClientAuthToken,
  completeClientPasswordWithToken,
} = require('../db');
const { PROJECT_STATUS_LABELS } = require('../config/constants');
const { hashPassword, verifyPassword } = require('./auth/password');
const { createClientAccountSession } = require('./auth/clientSessions');
const {
  sendClientPasswordResetEmail,
  sendClientPasswordChangedEmail,
} = require('./email');
const { createHttpError } = require('../utils/normalize');

const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$c97daeb0b7d300ef686695f6a0fab93f$3b868b458e6ecdfe8c99bcea7ffe2e8e5c7051e478de0470ca1b48784934a98c47faa6e2a1e975978d6cc2f6f7ac5aad31996dd77d0cfcec69be328824d7eacf';
const GENERIC_LOGIN_MESSAGE =
  'Invalid email or password. If you have not set a password yet, use the setup link from your email.';

function getClientById(clientId) {
  return getDb().prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
}

function mapClientProject(project) {
  return {
    id: project.id,
    name: project.name,
    businessName: project.business_name || project.name,
    status: project.status,
    statusLabel: PROJECT_STATUS_LABELS[project.status] || project.status,
  };
}

function clientSessionPayload(clientId) {
  const client = getClientById(clientId);
  if (!client) return null;
  return {
    client: {
      id: client.id,
      name: client.name,
      email: client.email,
      businessName: client.business_name,
    },
    projects: listPortalProjectsForClient(client.id).map(mapClientProject),
  };
}

async function loginClient(email, password) {
  const client = findClientByEmail(email);
  const passwordHash = client?.portal_password_hash || DUMMY_PASSWORD_HASH;
  const suppliedPassword = String(password || '');
  const passwordInRange = suppliedPassword.length <= 256;
  const valid = await verifyPassword(
    passwordInRange ? suppliedPassword : 'invalid-client-password',
    passwordHash
  );
  if (!client || !client.portal_password_hash || !passwordInRange || !valid) {
    throw createHttpError(401, GENERIC_LOGIN_MESSAGE, 'UNAUTHORIZED');
  }

  const session = createClientAccountSession(client.id);
  return { session, ...clientSessionPayload(client.id) };
}

async function requestClientPasswordReset(email) {
  const client = findClientByEmail(email);
  if (!client) return;

  const reset = issuePasswordResetToken(client.id);
  setImmediate(async () => {
    try {
      await sendClientPasswordResetEmail(client, reset);
    } catch (error) {
      console.error('Client password reset email failed:', error);
    }
  });
}

function loadPasswordResetTarget(rawToken) {
  const result = getClientAuthToken(rawToken, 'password_reset');
  if (!result || result.expired || !result.client) {
    throw createHttpError(
      404,
      'This password reset link is invalid or has expired. Request a new link and try again.',
      'NOT_FOUND'
    );
  }
  return result;
}

function validateNewPassword(password, confirmPassword) {
  const value = String(password || '');
  if (value.length < 10) {
    throw createHttpError(400, 'Password must be at least 10 characters.', 'VALIDATION_ERROR', {
      password: 'Password must be at least 10 characters.',
    });
  }
  if (value.length > 256) {
    throw createHttpError(400, 'Password must be 256 characters or fewer.', 'VALIDATION_ERROR', {
      password: 'Password must be 256 characters or fewer.',
    });
  }
  if (value !== String(confirmPassword || '')) {
    throw createHttpError(400, 'Passwords do not match.', 'VALIDATION_ERROR', {
      confirmPassword: 'Passwords do not match.',
    });
  }
  return value;
}

async function resetClientPassword(rawToken, password, confirmPassword) {
  const result = loadPasswordResetTarget(rawToken);
  const value = validateNewPassword(password, confirmPassword);
  const passwordHash = await hashPassword(value);
  const client = completeClientPasswordWithToken({
    clientId: result.client.id,
    passwordHash,
    rawToken,
    purpose: 'password_reset',
  });
  if (!client) {
    throw createHttpError(
      404,
      'This password reset link is invalid or has expired. Request a new link and try again.',
      'NOT_FOUND'
    );
  }

  try {
    await sendClientPasswordChangedEmail(client);
  } catch (error) {
    console.error('Client password confirmation email failed:', error);
  }
}

module.exports = {
  GENERIC_LOGIN_MESSAGE,
  clientSessionPayload,
  loginClient,
  requestClientPasswordReset,
  loadPasswordResetTarget,
  resetClientPassword,
};
