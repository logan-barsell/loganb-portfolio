import { createHttpError, fetchSafe, parseJsonSafe } from './http';

export async function postJson(url, body) {
  const response = await fetchSafe(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    throw createHttpError(response, data, 'Request failed.');
  }
  return data;
}

export async function postFormData(url, formData) {
  const response = await fetchSafe(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });
  const data = await parseJsonSafe(response);
  if (!response.ok || data.ok === false) {
    throw createHttpError(response, data, 'Request failed.');
  }
  return data;
}
