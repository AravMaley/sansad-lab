// GET /api/members → every member (whitelisted fields only) for the picker and chamber.
import { select, lastUpdated } from "./_lib/db.js";
import { send, handler } from "./_lib/respond.js";

export default handler(async (_req, res) => {
  const [members, updated] = await Promise.all([
    select("members?select=mpsno,name,party,party_short,state,constituency,photo_url,terms,status&order=state,constituency"),
    lastUpdated(),
  ]);
  send(res, 200, { lastUpdated: updated, members });
});
