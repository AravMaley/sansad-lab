// GET /api/since?mp=1,2&topic=water,jobs&t=<ISO> → new-item counts per follow.
import { rpc } from "./_lib/db.js";
import { send, fail, handler, str } from "./_lib/respond.js";

const MAX = 50;
const list = (v) => (str(v) ? str(v).split(",").map((s) => s.trim()).filter(Boolean) : []);

export default handler(async (req, res) => {
  const mps = list(req.query.mp).map(Number);
  const topics = list(req.query.topic);
  const t = str(req.query.t);
  if (mps.length + topics.length > MAX) return fail(res, 400, `At most ${MAX} follows`);
  if (mps.some((n) => !Number.isInteger(n) || n <= 0)) return fail(res, 400, "Bad MP id");
  if (topics.some((s) => !/^[a-z-]{1,40}$/.test(s))) return fail(res, 400, "Bad topic");
  if (!t || Number.isNaN(Date.parse(t))) return fail(res, 400, "Bad timestamp");

  const rows = await rpc("since_counts", { p_mpsnos: mps, p_slugs: topics, p_since: new Date(t).toISOString() });
  const out = { mp: {}, topic: {} };
  for (const r of rows) out[r.kind][r.key] = Number(r.n);
  res.setHeader("Vary", "Accept-Encoding");
  send(res, 200, out);
});
