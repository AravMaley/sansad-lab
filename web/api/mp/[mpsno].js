// GET /api/mp/:mpsno?ministry=&q=&page= → profile, ministry counts and question feed.
import { rpc, select, lastUpdated, PAGE_SIZE } from "../_lib/db.js";
import { send, fail, handler, pageOf, str, CACHE_EMPTY } from "../_lib/respond.js";

export default handler(async (req, res) => {
  const mpsno = Number(str(req.query.mpsno));
  if (!Number.isInteger(mpsno) || mpsno <= 0) return fail(res, 400, "Bad MP id");
  const [member] = await select(`members?mpsno=eq.${mpsno}&select=*`);
  if (!member) return fail(res, 404, "No such MP");

  const page = pageOf(str(req.query.page));
  const ministry = str(req.query.ministry)?.trim() || null;
  const q = str(req.query.q)?.trim().slice(0, 200) || null;
  const [counts, feed, updated] = await Promise.all([
    rpc("mp_ministry_counts", { p_mpsno: mpsno }),
    rpc("mp_feed", { p_mpsno: mpsno, p_ministry: ministry, p_q: q, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE }),
    lastUpdated(),
  ]);
  send(res, 200, {
    member,
    counts: counts.map((c) => ({ ministry: c.ministry, n: Number(c.n) })),
    page,
    total: Number(feed[0]?.total ?? 0),
    items: feed.map((r) => r.item),
    lastUpdated: updated,
  }, undefined, feed.length ? undefined : CACHE_EMPTY);
});
