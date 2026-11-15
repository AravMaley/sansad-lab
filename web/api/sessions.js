// GET /api/sessions → the current or next session, and the last one.
import { select } from "./_lib/db.js";
import { send, handler } from "./_lib/respond.js";

export async function upcoming(today = new Date().toISOString().slice(0, 10)) {
  const all = await select("sessions?select=*&order=start_date.asc");
  const next = all.find((s) => (s.end_date ?? s.start_date) >= today) ?? null;
  const past = all.filter((s) => (s.end_date ?? s.start_date) < today);
  return { next, previous: past[past.length - 1] ?? null, all };
}

export default handler(async (_req, res) => {
  const { next, previous } = await upcoming();
  send(res, 200, { next, previous });
});
