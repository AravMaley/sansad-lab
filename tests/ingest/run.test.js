import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ingest } from "../../scripts/ingest/run.js";

const docx = new Uint8Array(readFileSync(new URL("../fixtures/unstarred-direct.docx", import.meta.url)));

const rawMember = (mpsno, status = "Sitting") => ({
  mpsno, mpFirstLastName: `MP ${mpsno}`, partySname: "X", partyFname: "X Party",
  stateName: "S", constName: `C${mpsno}`, status, noOfTerms: 1,
});
const rawQ = (no, doc = `https://doc/${no}.docx`) => ({
  quesNo: no, lokNo: "18", type: "UNSTARRED", date: "12.08.2026", sessionNo: "8",
  ministry: "RAILWAYS", subjects: `Subject ${no}`, member: ["someone"], questionsDocPath: doc, questionsFilePath: `https://doc/${no}.pdf`,
});
const id = (no) => `18-UNSTARRED-${no}-2026-08-12`;

function setup({ members, pages, known = [], backfilled = [], linked = [] }) {
  const fetched = [];
  const api = {
    members: async () => members,
    sessions: async () => [{ lok_no: 18, session_no: 8, start_date: "2026-07-20", end_date: "2026-08-13" }],
    questionsForMember: async (mpsno, page) => {
      fetched.push([mpsno, page]);
      const items = pages[mpsno]?.[page - 1] ?? [];
      return { total: 99, items };
    },
  };
  const db = { questions: new Map(), links: new Set(), meta: { backfilled: JSON.stringify(backfilled) }, members: [] };
  for (const k of known) db.questions.set(k, {});
  for (const l of linked) db.links.add(l);
  const store = {
    upsertMembers: async (r) => db.members.push(...r),
    upsertSessions: async () => {},
    upsertQuestions: async (rows) => rows.forEach((r) => db.questions.set(r.id, r)),
    linkMembers: async (rows) => rows.forEach((r) => db.links.add(`${r.question_id}|${r.mpsno}`)),
    knownQuestionIds: async (ids) => new Set(ids.filter((i) => db.questions.has(i))),
    linkedQuestionIds: async (ids, mpsno) => new Set(ids.filter((i) => db.links.has(`${i}|${mpsno}`))),
    setMeta: async (k, v) => (db.meta[k] = v),
    getMeta: async (k) => db.meta[k] ?? null,
  };
  const http = { getBuffer: async (u) => (u.endsWith(".doc") ? null : docx) };
  return { api, store, http, db, fetched };
}

test("a joint question is stored once and linked to both MPs", async () => {
  const q = rawQ(1);
  const s = setup({ members: [rawMember(1), rawMember(2)], pages: { 1: [[q]], 2: [[q]] } });
  const r = await ingest({ ...s, budgetMs: 60_000 });
  assert.equal(s.db.questions.size, 1);
  assert.ok(s.db.links.has(`${id(1)}|1`) && s.db.links.has(`${id(1)}|2`));
  assert.equal(r.newQuestions, 1);
  assert.equal(r.linked, 2);
  const row = s.db.questions.get(id(1));
  assert.ok(row.answer_excerpt);
  assert.deepEqual(row.topics, ["railways"]);
});

test("a fully known page stops paging for a backfilled MP", async () => {
  const s = setup({ members: [rawMember(1)], pages: { 1: [[rawQ(1)], [rawQ(2)]] }, known: [id(1)], backfilled: [1], linked: [`${id(1)}|1`] });
  await ingest({ ...s, budgetMs: 60_000 });
  assert.deepEqual(s.fetched, [[1, 1]]);
});

test("an interrupted backfill resumes past already-stored pages", async () => {
  const s = setup({ members: [rawMember(1)], pages: { 1: [[rawQ(1)], [rawQ(2)]] }, known: [id(1)] });
  const r = await ingest({ ...s, budgetMs: 60_000 });
  assert.deepEqual(s.fetched, [[1, 1], [1, 2], [1, 3]]);
  assert.equal(r.newQuestions, 1);
  assert.deepEqual(JSON.parse(s.db.meta.backfilled), [1]);
});

test("pages continue until an empty page when questions are new", async () => {
  const s = setup({ members: [rawMember(1)], pages: { 1: [[rawQ(1)], [rawQ(2)]] } });
  await ingest({ ...s, budgetMs: 60_000 });
  assert.deepEqual(s.fetched, [[1, 1], [1, 2], [1, 3]]);
});

test("an unreadable .doc still stores the question without text", async () => {
  const s = setup({ members: [rawMember(1)], pages: { 1: [[rawQ(3, "https://doc/3.doc")]] } });
  const r = await ingest({ ...s, budgetMs: 60_000 });
  const row = s.db.questions.get(id(3));
  assert.equal(row.question_text, null);
  assert.equal(row.subject, "Subject 3");
  assert.equal(r.docFailures, 1);
});

test("stops early when the time budget runs out", async () => {
  let t = 0;
  const s = setup({ members: [rawMember(1), rawMember(2)], pages: { 1: [[rawQ(1)]], 2: [[rawQ(2)]] } });
  const r = await ingest({ ...s, budgetMs: 10, now: () => (t += 100) });
  assert.equal(r.stoppedEarly, true);
  assert.equal(s.fetched.some(([m]) => m === 2), false);
});

test("non-sitting members are stored but not paged; last_updated is set", async () => {
  const s = setup({ members: [rawMember(1), rawMember(9, "Died")], pages: { 1: [[]] } });
  const r = await ingest({ ...s, budgetMs: 60_000 });
  assert.equal(r.members, 2);
  assert.equal(s.fetched.some(([m]) => m === 9), false);
  assert.match(s.db.meta.last_updated, /^\d{4}-\d{2}-\d{2}T/);
});

test("only limits the run to one MP", async () => {
  const s = setup({ members: [rawMember(1), rawMember(2)], pages: { 1: [[]], 2: [[]] } });
  await ingest({ ...s, budgetMs: 60_000, only: 2 });
  assert.deepEqual(s.fetched, [[2, 1]]);
});

test("a backfilled MP keeps paging when known questions are not yet linked to them", async () => {
  // Question 1 was stored earlier via a co-signer, so it exists but is not linked to MP 1.
  const s = setup({ members: [rawMember(1)], pages: { 1: [[rawQ(1)], [rawQ(2)]] }, known: [id(1)], backfilled: [1] });
  await ingest({ ...s, budgetMs: 60_000 });
  assert.deepEqual(s.fetched.slice(0, 2), [[1, 1], [1, 2]]);
  assert.ok(s.db.links.has(`${id(1)}|1`) && s.db.links.has(`${id(2)}|1`));
  assert.equal(s.db.questions.size, 2);
});

test("a network failure on one MP skips that MP and the run carries on", async () => {
  const s = setup({ members: [rawMember(1), rawMember(2)], pages: { 2: [[rawQ(5)]] } });
  const orig = s.api.questionsForMember;
  s.api.questionsForMember = async (mpsno, page) => {
    if (mpsno === 1) throw new TypeError("fetch failed");
    return orig(mpsno, page);
  };
  const r = await ingest({ ...s, budgetMs: 60_000, log: () => {} });
  assert.ok(s.db.questions.has(id(5)));
  assert.deepEqual(r.failedMps, [1]);
  assert.ok(s.db.meta.last_updated);
  assert.ok(!JSON.parse(s.db.meta.backfilled).includes(1));
});

test("many MPs failing in a row stops the run as a real outage", async () => {
  const members = [1, 2, 3, 4, 5, 6, 7].map((n) => rawMember(n));
  const s = setup({ members, pages: {} });
  s.api.questionsForMember = async () => { throw new TypeError("fetch failed"); };
  await assert.rejects(ingest({ ...s, budgetMs: 60_000, log: () => {} }), /5 MPs in a row/);
});
