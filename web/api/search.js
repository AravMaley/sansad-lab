// GET /api/search?q=&page= → questions matching the words, newest first.
import { rpc, PAGE_SIZE } from "./_lib/db.js";
import { send, fail, handler, pageOf, str } from "./_lib/respond.js";

export default handler(async (req, res) => {
  const q = (str(req.query.q) ?? "").trim().slice(0, 200);
  if (q.length < 2) return fail(res, 400, "Type at least 2 characters");
  const page = pageOf(str(req.query.page));
  const rows = await rpc("search_questions", { p_q: q, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE });
  send(res, 200, { q, page, total: Number(rows[0]?.total ?? 0), items: rows.map((r) => r.item) });
});
