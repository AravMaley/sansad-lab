// Small response helpers that work with Vercel's Node runtime and in tests.

const CACHE = "public, s-maxage=3600, stale-while-revalidate=86400";

export function send(res, status, body, type = "application/json; charset=utf-8") {
  res.statusCode = status;
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", status === 200 ? CACHE : "no-store");
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

export const fail = (res, status, error) => send(res, status, { error });

// Wraps a handler so unexpected errors become a 503 the page can explain.
export function handler(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      console.error(e);
      fail(res, 503, "Data temporarily unavailable");
    }
  };
}

export function pageOf(q) {
  const p = Number.parseInt(q ?? "0", 10);
  return Number.isFinite(p) && p >= 0 && p < 500 ? p : 0;
}

export const str = (v) => (Array.isArray(v) ? v[0] : v);
