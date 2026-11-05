export class ApiError extends Error {
  constructor(message, status = 0, details = []) {
    super(message);
    this.status = status;
    this.details = details || [];
  }

  /** Maps server validation details to { fieldPath: message }. */
  get fieldErrors() {
    const out = {};
    for (const d of this.details) if (d.field && !out[d.field]) out[d.field] = d.message;
    return out;
  }
}

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export async function api(path, { method = 'GET', body, formData, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      credentials: 'include',
      signal,
      headers: body !== undefined ? { 'Content-Type': 'application/json', Accept: 'application/json' } : { Accept: 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : formData,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('We could not reach the server. Please check your connection and try again.');
  }
  if (res.status === 204) return null;
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON response */
  }
  if (!res.ok) {
    throw new ApiError(data?.error || 'Something went wrong. Please try again.', res.status, data?.details);
  }
  return data;
}
