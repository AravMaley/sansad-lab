// Read-only access to Supabase through its REST API, with the anon key.

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
  return { url, headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" } };
}

async function check(res, what) {
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${what}`);
  return res.json();
}

export async function rpc(name, args) {
  const { url, headers } = cfg();
  return check(await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers, body: JSON.stringify(args) }), name);
}

export async function select(path) {
  const { url, headers } = cfg();
  return check(await fetch(`${url}/rest/v1/${path}`, { headers }), path);
}

export async function lastUpdated() {
  const rows = await select("meta?select=value&key=eq.last_updated");
  return rows[0]?.value ?? null;
}

export const PAGE_SIZE = 20;
