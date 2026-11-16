import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { toRss, toIcs } from "../../web/api/_lib/feeds.js";
import since from "../../web/api/since.js";
import search from "../../web/api/search.js";
import mp from "../../web/api/mp/[mpsno].js";
import topic from "../../web/api/topic/[slug].js";

process.env.SUPABASE_URL = "https://db.example";
process.env.SUPABASE_SERVICE_KEY = "service";

let calls;
function stubFetch(responder) {
  calls = [];
  globalThis.fetch = async (url, opts = {}) => {
    calls.push({ url, body: opts.body && JSON.parse(opts.body) });
    const body = responder(url);
    return { ok: true, status: 200, json: async () => body, text: async () => "" };
  };
}
beforeEach(() => stubFetch(() => []));

function call(handler, query) {
  return new Promise((resolve) => {
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(body) { resolve({ status: this.statusCode, headers: this.headers, body, json: () => JSON.parse(body) }); },
    };
    handler({ method: "GET", query }, res);
  });
}

test("toRss escapes text and links each item to its official document", () => {
  const xml = toRss({
    title: "MP & co", link: "https://site/mp/1",
    items: [{ id: "q1", date: "2026-08-12", subject: "Roads <and> bridges & more", ministry: "ROADS", answerExcerpt: "x", docUrl: "https://doc/1.docx", pdfUrl: "https://doc/1.pdf" }],
  });
  assert.match(xml, /<title>MP &amp; co<\/title>/);
  assert.match(xml, /Roads &lt;and&gt; bridges &amp; more/);
  assert.equal((xml.match(/<item>/g) || []).length, 1);
  assert.match(xml, /<link>https:\/\/doc\/1\.pdf<\/link>/);
});

test("toIcs builds an all-day event with CRLF line endings", () => {
  const ics = toIcs({ sessions: [{ lok_no: 18, session_no: 9, start_date: "2026-12-01", end_date: "2026-12-19" }] });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261201\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20261220\r\n/);
  assert.doesNotMatch(ics.replace(/\r\n/g, ""), /\n/);
});

test("since rejects more than 50 ids and a bad timestamp", async () => {
  const many = Array.from({ length: 51 }, (_, i) => i + 1).join(",");
  assert.equal((await call(since, { mp: many, t: "2026-11-01T00:00:00Z" })).status, 400);
  assert.equal((await call(since, { mp: "1", t: "yesterday" })).status, 400);
});

test("since returns counts keyed by mp and topic", async () => {
  stubFetch(() => [{ kind: "mp", key: "1", n: 3 }, { kind: "topic", key: "water", n: 2 }]);
  const r = await call(since, { mp: "1,2", topic: "water", t: "2026-11-01T00:00:00Z" });
  assert.equal(r.status, 200);
  assert.deepEqual(r.json(), { mp: { 1: 3 }, topic: { water: 2 } });
  assert.deepEqual(calls[0].body.p_mpsnos, [1, 2]);
});

test("search needs at least 2 characters", async () => {
  assert.equal((await call(search, { q: "a" })).status, 400);
  assert.equal((await call(search, {})).status, 400);
});

test("mp returns 404 for an unknown MP and 400 for a bad id", async () => {
  assert.equal((await call(mp, { mpsno: "999999" })).status, 404);
  assert.equal((await call(mp, { mpsno: "abc" })).status, 400);
});

test("mp returns member, counts, items and total", async () => {
  stubFetch((url) => {
    if (url.includes("/members?")) return [{ mpsno: 7, name: "A", status: "Sitting" }];
    if (url.includes("mp_ministry_counts")) return [{ ministry: "RAILWAYS", n: 2 }];
    if (url.includes("mp_feed")) return [{ item: { id: "q" }, total: 2 }];
    if (url.includes("/meta?")) return [{ value: "2026-11-15T00:00:00Z" }];
    return [];
  });
  const r = await call(mp, { mpsno: "7", page: "1" });
  assert.equal(r.status, 200);
  const j = r.json();
  assert.equal(j.member.name, "A");
  assert.equal(j.total, 2);
  assert.deepEqual(j.items, [{ id: "q" }]);
  assert.equal(j.lastUpdated, "2026-11-15T00:00:00Z");
  assert.match(r.headers["cache-control"], /s-maxage=3600/);
  const feedCall = calls.find((c) => c.url.includes("mp_feed"));
  assert.equal(feedCall.body.p_offset, 20);
});

test("topic returns 404 for an unknown slug", async () => {
  assert.equal((await call(topic, { slug: "nope" })).status, 404);
});
