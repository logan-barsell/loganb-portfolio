async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

let unauthorizedHandler = null;

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = typeof handler === 'function' ? handler : null;
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function adminRequest(url, options = {}) {
  const { headers: optionHeaders, ...rest } = options;
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body && !(rest.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(optionHeaders || {}),
    },
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    const error = new Error(data.message || 'Request failed.');
    error.status = response.status;
    error.code = data.code;
    error.details = data.details;
    throw error;
  }
  return data;
}

export async function getSession() {
  return adminRequest('/api/auth/session');
}

export async function login(email, password) {
  return adminRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return adminRequest('/api/auth/logout', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchInquiries(params) {
  return adminRequest(`/api/admin/inquiries${buildQuery(params)}`);
}

export async function fetchInquiry(id) {
  return adminRequest(`/api/admin/inquiries/${encodeURIComponent(id)}`);
}

export function attachmentDownloadUrl(inquiryId, attachmentId) {
  return `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/attachments/${encodeURIComponent(
    attachmentId
  )}`;
}

export function attachmentPreviewUrl(inquiryId, attachmentId) {
  return `${attachmentDownloadUrl(inquiryId, attachmentId)}?preview=1`;
}

export async function fetchAttachmentPreview(inquiryId, attachmentId) {
  const response = await fetch(attachmentPreviewUrl(inquiryId, attachmentId), {
    credentials: 'same-origin',
    headers: { Accept: '*/*' },
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    const error = new Error(data.message || 'Unable to preview attachment.');
    error.status = response.status;
    error.code = data.code;
    throw error;
  }

  return response.blob();
}

export { buildQuery };
