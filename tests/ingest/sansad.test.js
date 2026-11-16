import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHttp, withRetry } from "../../scripts/ingest/http.js";
import { sansad, normaliseSessions } from "../../scripts/ingest/sansad.js";
import { normaliseMember, normaliseQuestion } from "../../scripts/ingest/members.js";

const fx = (n) => JSON.parse(readFileSync(new URL(`../fixtures/${n}`, import.meta.url)));
const UA = "SansadLab/1.0 (+https://github.com/AravMaley/sansad-lab)";

function fakeFetch(responses) {
  const calls = [];
  const impl = async (url, opts) => {
    calls.push({ url, opts, at: Date.now() });
    const r = responses.length > 1 ? responses.shift() : responses[0];
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => r.body,
      arrayBuffer: async () => new Uint8Array(r.bytes ?? [1, 2]).buffer,
    };
  };
  return { impl, calls };
}

test("normaliseMember keeps only whitelisted fields", () => {
  const raw = fx("members-page.json").membersDtoList[0];
  const m = normaliseMember(raw);
  assert.deepEqual(Object.keys(m).sort(), ["constituency", "mpsno", "name", "party", "party_short", "photo_url", "state", "status", "terms"]);
  for (const k of ["personalPhone", "permanentFaddr", "email", "dob"]) assert.equal(k in m, false);
  assert.equal(m.mpsno, 5814);
  assert.equal(m.constituency, "Dharmapuri");
});

test("normaliseMember preserves non-sitting status", () => {
  const raw = fx("members-page.json").membersDtoList.find((x) => x.status !== "Sitting");
  assert.equal(normaliseMember(raw).status, raw.status);
});

test("normaliseQuestion converts the date and builds a stable id", () => {
  const raw = fx("questions-mp.json")[0].listOfQuestions[0];
  const q = normaliseQuestion(raw);
  assert.equal(q.date, "2026-08-12");
  assert.equal(q.id, `18-STARRED-${raw.quesNo}-2026-08-12`);
  assert.equal(q.doc_url, raw.questionsDocPath);
  assert.equal(q.pdf_url, raw.questionsFilePath);
  assert.equal(q.session_no, 8);
});

test("normaliseSessions spans multi-part periods", () => {
  const s = normaliseSessions(fx("sessions.json"));
  const last = s.find((x) => x.session_no === 7);
  assert.ok(last, "session 7 present");
  assert.equal(s.every((x) => x.lok_no === 18), true);
  const multi = s.find((x) => x.start_date === "2026-01-28");
  assert.equal(multi.end_date, "2026-04-18");
});

test("http sends the user agent and waits between calls", async () => {
  const f = fakeFetch([{ body: { a: 1 } }]);
  const http = createHttp({ fetchImpl: f.impl, delayMs: 20, userAgent: UA });
  await http.getJson("https://x/1");
  await http.getJson("https://x/2");
  assert.equal(f.calls[0].opts.headers["User-Agent"], UA);
  assert.ok(f.calls[1].at - f.calls[0].at >= 18);
});

test("http retries a 500 twice then throws", async () => {
  const f = fakeFetch([{ status: 500 }]);
  const http = createHttp({ fetchImpl: f.impl, delayMs: 1, retries: 2, userAgent: UA });
  await assert.rejects(http.getJson("https://x/err"), /500/);
  assert.equal(f.calls.length, 3);
});

test("getBuffer returns null on 404", async () => {
  const f = fakeFetch([{ status: 404 }]);
  const http = createHttp({ fetchImpl: f.impl, delayMs: 1, userAgent: UA });
  assert.equal(await http.getBuffer("https://x/missing"), null);
});

test("questionsForMember uses memberCode and returns total and items", async () => {
  const f = fakeFetch([{ body: fx("questions-mp.json") }]);
  const api = sansad(createHttp({ fetchImpl: f.impl, delayMs: 1, userAgent: UA }));
  const r = await api.questionsForMember(5814, 2);
  assert.match(f.calls[0].url, /memberCode=5814/);
  // sansad.in ignores "page" here and always returns page 1; "pageNo" is the
  // parameter that actually moves through the results.
  assert.match(f.calls[0].url, /[?&]pageNo=2(&|$)/);
  assert.doesNotMatch(f.calls[0].url, /[?&]page=/);
  assert.equal(r.total, 4);
  assert.equal(r.items.length, 4);
});

test("members pages through every page", async () => {
  const page = fx("members-page.json");
  const p1 = { ...page, metaDatasDto: { ...page.metaDatasDto, totalPages: 2 } };
  const f = fakeFetch([{ body: p1 }, { body: p1 }]);
  const api = sansad(createHttp({ fetchImpl: f.impl, delayMs: 1, userAgent: UA }));
  const all = await api.members();
  assert.equal(f.calls.length, 2);
  assert.equal(all.length, 10);
});

test("http retries a dropped connection, then succeeds", async () => {
  let n = 0;
  const impl = async () => { if (n++ < 2) throw new TypeError("fetch failed"); return new Response('{"ok":1}', { status: 200 }); };
  const http = createHttp({ fetchImpl: impl, delayMs: 1, retryWaitMs: 1, userAgent: UA });
  assert.deepEqual(await http.getJson("https://x/flaky"), { ok: 1 });
  assert.equal(n, 3);
});

test("http gives up after its retries and reports the cause", async () => {
  const impl = async () => { throw new TypeError("fetch failed", { cause: { code: "ECONNRESET" } }); };
  const http = createHttp({ fetchImpl: impl, delayMs: 1, retryWaitMs: 1, retries: 2, userAgent: UA });
  await assert.rejects(http.getJson("https://x/down"), /ECONNRESET.*https:\/\/x\/down/);
});

test("withRetry retries a thrown fetch for the database client", async () => {
  let n = 0;
  const f = withRetry(async () => { if (n++ < 1) throw new TypeError("fetch failed"); return "ok"; }, { tries: 3, waitMs: 1 });
  assert.equal(await f("u"), "ok");
});
