// Writes ingested rows to Supabase through its REST API (PostgREST).
// Uses the service key, which exists only as a GitHub Actions secret.

const BATCH = 500;
const ID_CHUNK = 100;

export function createStore({ url, serviceKey, fetchImpl = fetch }) {
  const headers = (extra = {}) => ({
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    ...extra,
  });

  async function call(table, path, init) {
    const res = await fetchImpl(`${url}/rest/v1/${path}`, init);
    if (!res.ok) throw new Error(`Supabase ${res.status} on ${table}: ${await res.text()}`);
    return res;
  }

  async function upsert(table, rows) {
    for (let i = 0; i < rows.length; i += BATCH) {
      await call(table, table, {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=minimal" }),
        body: JSON.stringify(rows.slice(i, i + BATCH)),
      });
    }
  }

  return {
    upsertMembers: (rows) => upsert("members", rows),
    upsertQuestions: (rows) => upsert("questions", rows),
    linkMembers: (rows) => upsert("question_members", rows),
    upsertSessions: (rows) => upsert("sessions", rows),
    setMeta: (key, value) => upsert("meta", [{ key, value }]),
    async getMeta(key) {
      const res = await call("meta", `meta?select=value&key=eq.${encodeURIComponent(key)}`, { headers: headers() });
      return (await res.json())[0]?.value ?? null;
    },
    async linkedQuestionIds(ids, mpsno) {
      const linked = new Set();
      for (let i = 0; i < ids.length; i += ID_CHUNK) {
        const list = ids.slice(i, i + ID_CHUNK).map((id) => `"${id}"`).join(",");
        const res = await call("question_members",
          `question_members?select=question_id&mpsno=eq.${Number(mpsno)}&question_id=in.(${encodeURIComponent(list)})`, { headers: headers() });
        for (const r of await res.json()) linked.add(r.question_id);
      }
      return linked;
    },
    async knownQuestionIds(ids) {
      const known = new Set();
      for (let i = 0; i < ids.length; i += ID_CHUNK) {
        const list = ids.slice(i, i + ID_CHUNK).map((id) => `"${id}"`).join(",");
        const res = await call("questions", `questions?select=id&id=in.(${encodeURIComponent(list)})`, {
          headers: headers(),
        });
        for (const r of await res.json()) known.add(r.id);
      }
      return known;
    },
  };
}
