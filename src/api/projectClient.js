import {
  createHttpError,
  fetchSafe,
  parseJsonSafe,
} from './http';

async function projectRequest(url, options = {}) {
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

  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    throw createHttpError(response, data, 'Request failed.');
  }
  return data;
}

export async function fetchPortalSession(projectId) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/session`);
}

export async function fetchPortalSetup(projectId, token) {
  return projectRequest(
    `/api/projects/${encodeURIComponent(projectId)}/setup/${encodeURIComponent(token)}`
  );
}

export async function completePortalSetup(projectId, token, body) {
  return projectRequest(
    `/api/projects/${encodeURIComponent(projectId)}/setup/${encodeURIComponent(token)}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

export async function loginPortal(projectId, password) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/login`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function fetchPortalProject(projectId) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}`);
}

export async function createPortalCheckout(projectId, invoiceId) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/checkout`, {
    method: 'POST',
    body: JSON.stringify({ invoiceId }),
  });
}

export async function createHostingCheckout(projectId) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/hosting/checkout`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function openHostingPortal(projectId) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/hosting/portal`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function updatePortalDomain(projectId, body) {
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/domain`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadPortalAttachments(projectId, files) {
  const formData = new FormData();
  Array.from(files || []).forEach((file) => {
    formData.append('files', file);
  });
  return projectRequest(`/api/projects/${encodeURIComponent(projectId)}/attachments`, {
    method: 'POST',
    body: formData,
  });
}

export async function deletePortalAttachment(projectId, attachmentId) {
  return projectRequest(
    `/api/projects/${encodeURIComponent(projectId)}/attachments/${encodeURIComponent(
      attachmentId
    )}`,
    { method: 'DELETE' }
  );
}

export function portalAttachmentDownloadUrl(projectId, attachmentId) {
  return `/api/projects/${encodeURIComponent(projectId)}/attachments/${encodeURIComponent(
    attachmentId
  )}`;
}

export function portalAttachmentPreviewUrl(projectId, attachmentId) {
  return `${portalAttachmentDownloadUrl(projectId, attachmentId)}?preview=1`;
}

export async function fetchPortalAttachmentPreview(projectId, attachmentId) {
  const response = await fetchSafe(portalAttachmentPreviewUrl(projectId, attachmentId), {
    credentials: 'same-origin',
    headers: { Accept: '*/*' },
  });
  if (!response.ok) {
    const data = await parseJsonSafe(response);
    throw createHttpError(response, data, 'Unable to preview attachment.');
  }
  return response.blob();
}
