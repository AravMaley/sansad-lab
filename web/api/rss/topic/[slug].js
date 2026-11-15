// GET /api/rss/topic/:slug → RSS feed of the latest questions on a topic.
import { rpc } from "../../_lib/db.js";
import { toRss } from "../../_lib/feeds.js";
import { send, fail, handler, str } from "../../_lib/respond.js";
import { TOPICS } from "../../../js/topics-data.js";

const SITE = "https://sansad-lab-web.vercel.app";

export default handler(async (req, res) => {
  const topic = TOPICS.find((t) => t.slug === str(req.query.slug));
  if (!topic) return fail(res, 404, "No such topic");
  const feed = await rpc("topic_feed", { p_slug: topic.slug, p_limit: 30, p_offset: 0 });
  const xml = toRss({
    title: `${topic.label} in Parliament — Sansad Lab`,
    link: `${SITE}/topic/${topic.slug}`,
    description: topic.blurb,
    items: feed.map((r) => r.item),
  });
  send(res, 200, xml, "application/rss+xml; charset=utf-8");
});
