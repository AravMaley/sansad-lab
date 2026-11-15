import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { topics, byTopic, compare, searchStatements, stanceLabel } from "../../web/js/manifestos.js";

const data = JSON.parse(readFileSync(new URL("../../web/data/manifestos.json", import.meta.url)));

test("topics are unique and keep the data's order", () => {
  const t = topics(data);
  assert.equal(new Set(t).size, t.length);
  assert.equal(t[0], data.statements[0].topic);
});

test("every entry from byTopic has a source link and page", () => {
  for (const [, stmts] of byTopic(data)) {
    for (const s of stmts) {
      assert.equal(s.entries.length, data.parties.length);
      for (const e of s.entries) {
        assert.match(e.source, /^https?:\/\//);
        assert.match(e.source, /#page=\d+$/);
      }
    }
  }
});

test("silence is never shown as opposition", () => {
  assert.deepEqual(stanceLabel({ stance: 0 }), { text: "Silent", cls: "silent" });
  assert.deepEqual(stanceLabel({ stance: -1 }), { text: "Opposes", cls: "no" });
  assert.deepEqual(stanceLabel({ stance: 1, partial: true }), { text: "Supports, partly", cls: "yes" });
  assert.deepEqual(stanceLabel(undefined), { text: "Not mentioned", cls: "silent" });
});

test("compare marks a party silent on every statement in a topic as not mentioned", () => {
  const fake = {
    parties: [{ id: "a", short: "A", url: "https://a.pdf", pageOffset: 0 }, { id: "b", short: "B", url: "https://b.pdf", pageOffset: 0 }],
    statements: [{ id: "s", topic: "T", text: "x", positions: { a: { stance: 1, page: 2, quote: "q" }, b: { stance: 0, page: 3 } } }],
  };
  const out = compare(fake, "T", ["a", "b"]);
  assert.equal(out.find((p) => p.party.id === "a").mentioned, true);
  assert.equal(out.find((p) => p.party.id === "b").mentioned, false);
});

test("compare keeps the requested party order and caps at three", () => {
  const ids = data.parties.map((p) => p.id);
  const out = compare(data, data.statements[0].topic, ids);
  assert.deepEqual(out.map((p) => p.party.id), ids.slice(0, 3));
});

test("search is case-insensitive and empty queries return nothing", () => {
  assert.deepEqual(searchStatements(data, ""), []);
  assert.deepEqual(searchStatements(data, "  "), []);
  const hits = searchStatements(data, "msp");
  assert.ok(hits.some((s) => s.id === "msp-law"));
});
