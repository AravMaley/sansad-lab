// Fetch helpers for the site's own /api endpoints.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Avoids URLSearchParams.size, which older mobile browsers lack.
export function apiUrl(path, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== "")).toString();
  return `/api/${path}${qs ? `?${qs}` : ""}`;
}

export async function api(path, params = {}) {
  const res = await fetch(apiUrl(path, params));
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new ApiError(res.status, body?.error ?? "Data temporarily unavailable");
  return body;
}
