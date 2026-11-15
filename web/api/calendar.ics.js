// GET /api/calendar.ics → the next Lok Sabha session as a calendar event.
import { upcoming } from "./sessions.js";
import { toIcs } from "./_lib/feeds.js";
import { send, handler } from "./_lib/respond.js";

export default handler(async (_req, res) => {
  const { next } = await upcoming();
  res.setHeader("Content-Disposition", 'attachment; filename="lok-sabha-session.ics"');
  send(res, 200, toIcs({ sessions: next ? [next] : [] }), "text/calendar; charset=utf-8");
});
