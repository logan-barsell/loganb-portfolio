async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
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

export async function postFormData(url, formData) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { Accept: 'application/json' },
    body: formData,
  });
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
