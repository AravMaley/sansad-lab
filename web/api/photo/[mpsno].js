// GET /api/photo/:mpsno → the MP's official photo, served from our own domain.
// sansad.in sends "Cross-Origin-Resource-Policy: same-site", which makes
// browsers refuse its photos on any other site. We fetch them here instead and
// let Vercel's CDN keep them, so sansad.in sees about one request per MP a week.
// The address comes from our own database, never from the visitor, and must be
// on sansad.in over https.
import { select } from "../_lib/db.js";
import { fail, handler, str } from "../_lib/respond.js";

const MAX_BYTES = 2 * 1024 * 1024;
const CACHE = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000";

export function isSansadUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && (u.hostname === "sansad.in" || u.hostname.endsWith(".sansad.in"));
  } catch {
    return false;
  }
}

export default handler(async (req, res) => {
  const mpsno = Number(str(req.query.mpsno));
  if (!Number.isInteger(mpsno) || mpsno <= 0) return fail(res, 400, "Bad MP id");
  const [row] = await select(`members?mpsno=eq.${mpsno}&select=photo_url`);
  if (!row?.photo_url || !isSansadUrl(row.photo_url)) return fail(res, 404, "No photo");

  let upstream;
  try {
    upstream = await fetch(row.photo_url, {
      headers: { "User-Agent": "SansadLab/1.0 (+https://github.com/AravMaley/sansad-lab)", Accept: "image/*" },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return fail(res, 404, "No photo");
  }
  const type = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !type.startsWith("image/")) return fail(res, 404, "No photo");
  const bytes = Buffer.from(await upstream.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return fail(res, 404, "No photo");

  res.statusCode = 200;
  res.setHeader("Content-Type", type);
  res.setHeader("Cache-Control", CACHE);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(bytes);
});
