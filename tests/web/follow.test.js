import { test } from "node:test";
import assert from "node:assert/strict";
import { createFollows, shareLinks } from "../../web/js/follow.js";

function memStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m };
}

test("toggling an MP twice leaves it unfollowed", () => {
  const f = createFollows(memStorage());
  f.toggleMp(5);
  assert.equal(f.isFollowing("mp", 5), true);
  f.toggleMp(5);
  assert.equal(f.isFollowing("mp", 5), false);
});

test("follows persist across instances on the same storage", () => {
  const s = memStorage();
  createFollows(s).toggleTopic("water");
  const again = createFollows(s);
  assert.deepEqual(again.list().topics, ["water"]);
  assert.equal(again.available, true);
});

test("storage that throws makes follows unavailable and every method safe", () => {
  const bad = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  const f = createFollows(bad);
  assert.equal(f.available, false);
  assert.doesNotThrow(() => { f.toggleMp(1); f.toggleTopic("x"); f.markVisited("2026-11-16T00:00:00Z"); });
  assert.equal(f.isFollowing("mp", 1), false);
  assert.deepEqual(f.list(), { mps: [], topics: [], lastVisit: null });
});

test("null storage is unavailable", () => {
  assert.equal(createFollows(null).available, false);
});

test("lastVisit is null until markVisited", () => {
  const f = createFollows(memStorage());
  assert.equal(f.list().lastVisit, null);
  f.markVisited("2026-11-16T10:00:00.000Z");
  assert.equal(f.list().lastVisit, "2026-11-16T10:00:00.000Z");
});

test("corrupt stored JSON resets to empty follows", () => {
  const s = memStorage();
  s.setItem("sansad:follows", "{not json");
  const f = createFollows(s);
  assert.deepEqual(f.list(), { mps: [], topics: [], lastVisit: null });
  f.toggleMp(3);
  assert.deepEqual(f.list().mps, [3]);
});

test("at most 50 follows in total", () => {
  const f = createFollows(memStorage());
  for (let i = 1; i <= 60; i++) f.toggleMp(i);
  assert.equal(f.list().mps.length, 50);
});

test("shareLinks encodes text and url for WhatsApp", () => {
  const { whatsapp } = shareLinks({ url: "https://x.app/mp/1?a=1&b=2", text: "My MP & me" });
  assert.match(whatsapp, /^https:\/\/wa\.me\/\?text=/);
  assert.ok(whatsapp.includes(encodeURIComponent("My MP & me")));
  assert.ok(whatsapp.includes(encodeURIComponent("https://x.app/mp/1?a=1&b=2")));
  assert.doesNotMatch(whatsapp.split("text=")[1], /[ &]/);
});
