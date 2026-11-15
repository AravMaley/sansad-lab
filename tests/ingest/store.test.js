import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "../../scripts/ingest/store.js";

function fake(body = [], status = 201) {
  const calls = [];
  const fetchImpl = async (url, opts = {}) => {
    calls.push({ url, opts });
    return { ok: status < 300, status, json: async () => body, text: async () => "boom" };
  };
  return { calls, fetchImpl };
}

const opts = (f) => ({ url: "https://db.example", serviceKey: "svc", fetchImpl: f.fetchImpl });

test("upsertQuestions batches by 500 with merge-duplicates and auth headers", async () => {
  const f = fake();
  const s = createStore(opts(f));
  await s.upsertQuestions(Array.from({ length: 1200 }, (_, i) => ({ id: String(i) })));
  assert.equal(f.calls.length, 3);
  for (const c of f.calls) {
    assert.equal(c.url, "https://db.example/rest/v1/questions");
    assert.equal(c.opts.method, "POST");
    assert.match(c.opts.headers.Prefer, /resolution=merge-duplicates/);
    assert.equal(c.opts.headers.apikey, "svc");
    assert.equal(c.opts.headers.Authorization, "Bearer svc");
  }
  assert.equal(JSON.parse(f.calls[2].opts.body).length, 200);
});

test("empty upserts make no requests", async () => {
  const f = fake();
  await createStore(opts(f)).upsertMembers([]);
  assert.equal(f.calls.length, 0);
});

test("knownQuestionIds queries by id and returns a Set", async () => {
  const f = fake([{ id: "a" }], 200);
  const known = await createStore(opts(f)).knownQuestionIds(["a", "b-1"]);
  assert.match(f.calls[0].url, /\/rest\/v1\/questions\?select=id&id=in\.\(/);
  assert.ok(decodeURIComponent(f.calls[0].url).includes('"a","b-1"'));
  assert.ok(known instanceof Set);
  assert.ok(known.has("a"));
  assert.equal(known.has("b-1"), false);
});

test("a failed request names the status and table", async () => {
  const f = fake([], 409);
  await assert.rejects(createStore(opts(f)).upsertSessions([{ lok_no: 18 }]), /409.*sessions|sessions.*409/);
});

test("linkMembers and setMeta hit their tables", async () => {
  const f = fake();
  const s = createStore(opts(f));
  await s.linkMembers([{ question_id: "q", mpsno: 1 }]);
  await s.setMeta("last_updated", "2026-11-15T00:00:00Z");
  assert.match(f.calls[0].url, /question_members$/);
  assert.match(f.calls[1].url, /meta$/);
  assert.deepEqual(JSON.parse(f.calls[1].opts.body), [{ key: "last_updated", value: "2026-11-15T00:00:00Z" }]);
});

test("linkedQuestionIds filters question_members by MP", async () => {
  const f = fake([{ question_id: "a" }], 200);
  const linked = await createStore(opts(f)).linkedQuestionIds(["a", "b"], 7);
  assert.match(f.calls[0].url, /\/rest\/v1\/question_members\?select=question_id&mpsno=eq\.7&question_id=in\.\(/);
  assert.deepEqual([...linked], ["a"]);
});
