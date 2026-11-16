// GET /api/rss/mp/:mpsno → RSS feed of an MP's latest questions.
import { rpc, select } from "../../_lib/db.js";
import { toRss } from "../../_lib/feeds.js";
import { send, fail, handler, str } from "../../_lib/respond.js";

const SITE = "https://sansad-lab-web.vercel.app";

export default handler(async (req, res) => {
  const mpsno = Number(str(req.query.mpsno));
  if (!Number.isInteger(mpsno) || mpsno <= 0) return fail(res, 400, "Bad MP id");
  const [member] = await select(`members?mpsno=eq.${mpsno}&select=name,constituency`);
  if (!member) return fail(res, 404, "No such MP");
  const feed = await rpc("mp_feed", { p_mpsno: mpsno, p_ministry: null, p_q: null, p_limit: 30, p_offset: 0 });
  const xml = toRss({
    title: `${member.name} (${member.constituency}) in Parliament — Sansad Lab`,
    link: `${SITE}/mp/${mpsno}`,
    description: "Questions this MP asked in the Lok Sabha, with excerpts of the government's answers.",
    items: feed.map((r) => r.item),
  });
  send(res, 200, xml, "application/rss+xml; charset=utf-8");
});
