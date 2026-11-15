// Fetch helpers for the site's own /api endpoints.

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  const res = await fetch(`/api/${path}${qs.size ? `?${qs}` : ""}`);
  let body = null;
  try { body = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) throw new ApiError(res.status, body?.error ?? "Data temporarily unavailable");
  return body;
}
