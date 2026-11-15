// GET /api/topic/:slug?page= → questions on a topic and who raises it most.
import { rpc, lastUpdated, PAGE_SIZE } from "../_lib/db.js";
import { send, fail, handler, pageOf, str } from "../_lib/respond.js";
import { TOPICS } from "../../js/topics-data.js";

export default handler(async (req, res) => {
  const topic = TOPICS.find((t) => t.slug === str(req.query.slug));
  if (!topic) return fail(res, 404, "No such topic");
  const page = pageOf(str(req.query.page));
  const [feed, breakdown, updated] = await Promise.all([
    rpc("topic_feed", { p_slug: topic.slug, p_limit: PAGE_SIZE, p_offset: page * PAGE_SIZE }),
    rpc("topic_breakdown", { p_slug: topic.slug }),
    lastUpdated(),
  ]);
  const pick = (kind) => breakdown.filter((b) => b.kind === kind).map((b) => ({ name: b.name, n: Number(b.n) }));
  send(res, 200, {
    topic: { slug: topic.slug, label: topic.label, blurb: topic.blurb },
    page,
    total: Number(feed[0]?.total ?? 0),
    items: feed.map((r) => r.item),
    breakdown: { states: pick("state"), parties: pick("party") },
    lastUpdated: updated,
  });
});
