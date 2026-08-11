import {
  createHttpError,
  fetchSafe,
  parseJsonSafe,
  GENERIC_SERVER_ERROR,
} from './http';

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
  const response = await fetchSafe(url, {
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
    throw createHttpError(response, data, 'Request failed.');
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

export async function markInquiryContacted(id) {
  return adminRequest(`/api/admin/inquiries/${encodeURIComponent(id)}/mark-contacted`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchClients(params) {
  return adminRequest(`/api/admin/clients${buildQuery(params)}`);
}

export async function fetchClient(id) {
  return adminRequest(`/api/admin/clients/${encodeURIComponent(id)}`);
}

export async function fetchProposals(params) {
  return adminRequest(`/api/admin/proposals${buildQuery(params)}`);
}

export async function fetchProposal(id) {
  return adminRequest(`/api/admin/proposals/${encodeURIComponent(id)}`);
}

export async function createProposal(body) {
  return adminRequest('/api/admin/proposals', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProposal(id, body) {
  return adminRequest(`/api/admin/proposals/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function beginProposalRevision(id) {
  return adminRequest(`/api/admin/proposals/${encodeURIComponent(id)}/begin-revision`, {
    method: 'POST',
  });
}

export async function sendProposal(id, body) {
  return adminRequest(`/api/admin/proposals/${encodeURIComponent(id)}/send`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchProposalShare(token) {
  const response = await fetchSafe(`/api/proposals/share/${encodeURIComponent(token)}`, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    throw createHttpError(response, data, 'Unable to load proposal.');
  }
  return data;
}

async function proposalShareAction(token, path, body) {
  const response = await fetchSafe(`/api/proposals/share/${encodeURIComponent(token)}${path}`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    throw createHttpError(response, data, 'Unable to update proposal.');
  }
  return data;
}

export async function acceptProposalShare(token) {
  return proposalShareAction(token, '/accept');
}

export async function reviseProposalShare(token, body) {
  return proposalShareAction(token, '/revise', body);
}

export async function declineProposalShare(token, body) {
  return proposalShareAction(token, '/decline', body);
}

export async function fetchProjects(params) {
  return adminRequest(`/api/admin/projects${buildQuery(params)}`);
}

export async function fetchProject(id) {
  return adminRequest(`/api/admin/projects/${encodeURIComponent(id)}`);
}

export async function updateProject(id, body) {
  return adminRequest(`/api/admin/projects/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function markProjectStarted(id) {
  return adminRequest(`/api/admin/projects/${encodeURIComponent(id)}/mark-started`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function markProjectCompleted(id) {
  return adminRequest(`/api/admin/projects/${encodeURIComponent(id)}/mark-completed`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function setProjectReadyForLaunch(id, ready) {
  return adminRequest(`/api/admin/projects/${encodeURIComponent(id)}/ready-for-launch`, {
    method: 'POST',
    body: JSON.stringify({ ready: Boolean(ready) }),
  });
}

export async function provisionProjectSite(id) {
  return adminRequest(`/api/admin/projects/${encodeURIComponent(id)}/provision-site`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchInvoices(params) {
  return adminRequest(`/api/admin/invoices${buildQuery(params)}`);
}

export async function resendPortalAccess(projectId) {
  return adminRequest(
    `/api/admin/projects/${encodeURIComponent(projectId)}/resend-portal-access`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
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
  const response = await fetchSafe(attachmentPreviewUrl(inquiryId, attachmentId), {
    credentials: 'same-origin',
    headers: { Accept: '*/*' },
  });

  if (response.status === 401) {
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw createHttpError(response, data, 'Unable to preview attachment.');
  }

  return response.blob();
}

export async function uploadInquiryAttachments(inquiryId, files, { clientVisible = true } = {}) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => {
    formData.append('files', file);
  });
  formData.append('clientVisible', clientVisible ? '1' : '0');
  return adminRequest(
    `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/attachments`,
    {
      method: 'POST',
      body: formData,
    }
  );
}

export async function updateInquiryAttachmentVisibility(inquiryId, attachmentId, clientVisible) {
  return adminRequest(
    `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/attachments/${encodeURIComponent(
      attachmentId
    )}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ clientVisible: Boolean(clientVisible) }),
    }
  );
}

export async function deleteInquiryAttachment(inquiryId, attachmentId) {
  return adminRequest(
    `/api/admin/inquiries/${encodeURIComponent(inquiryId)}/attachments/${encodeURIComponent(
      attachmentId
    )}`,
    { method: 'DELETE' }
  );
}

export { buildQuery, GENERIC_SERVER_ERROR };
