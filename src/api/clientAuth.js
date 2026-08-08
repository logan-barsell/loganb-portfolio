import { createHttpError, fetchSafe, parseJsonSafe } from './http';

async function clientAuthRequest(url, options = {}) {
  const response = await fetchSafe(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    throw createHttpError(response, data, 'Request failed.');
  }
  return data;
}

export function fetchClientSession() {
  return clientAuthRequest('/api/client-auth/session');
}

export function loginClient(email, password) {
  return clientAuthRequest('/api/client-auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function logoutClient() {
  return clientAuthRequest('/api/client-auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function fetchClientProjects() {
  return clientAuthRequest('/api/client-auth/projects');
}

export function requestPasswordReset(email) {
  return clientAuthRequest('/api/client-auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function validatePasswordReset(token) {
  return clientAuthRequest(
    `/api/client-auth/reset-password/${encodeURIComponent(token)}`
  );
}

export function resetPassword(token, password, confirmPassword) {
  return clientAuthRequest(
    `/api/client-auth/reset-password/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      body: JSON.stringify({ password, confirmPassword }),
    }
  );
}
