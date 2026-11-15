import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByState, searchMembers } from "../../web/js/findmp.js";
import { emptyStateMessage, statusLabel, formatCount } from "../../web/js/mpview.js";

const m = (mpsno, state, constituency, party_short = "BJP", status = "Sitting") =>
  ({ mpsno, name: `MP ${mpsno}`, state, constituency, party_short, status });

test("groupByState sorts states and constituencies and keeps status", () => {
  const g = groupByState([m(1, "Kerala", "Wayanad"), m(2, "Bihar", "Patna Sahib"), m(3, "Bihar", "Araria", "INC", "Died")]);
  assert.deepEqual(g.map((s) => s.state), ["Bihar", "Kerala"]);
  assert.deepEqual(g[0].constituencies.map((c) => c.name), ["Araria", "Patna Sahib"]);
  assert.equal(g[0].constituencies[0].status, "Died");
  assert.equal(g[0].constituencies[0].mpsno, 3);
});

test("groupByState skips records without a state or constituency", () => {
  assert.deepEqual(groupByState([{ mpsno: 9, state: null, constituency: "X" }]), []);
});

test("searchMembers matches any part of a name, ignoring case and dots", () => {
  const list = [
    { mpsno: 1, name: "Shri Rahul Gandhi", status: "Sitting" },
    { mpsno: 2, name: "Smt. Supriya Sule", status: "Sitting" },
    { mpsno: 3, name: "Dr. Shashi Tharoor", status: "Sitting" },
    { mpsno: 4, name: "Rahul Kaswan", status: "Died" },
  ];
  assert.deepEqual(searchMembers(list, "rahul").map((x) => x.mpsno), [1, 4]);
  assert.deepEqual(searchMembers(list, "tharo").map((x) => x.mpsno), [3]);
  assert.deepEqual(searchMembers(list, "supriya sule").map((x) => x.mpsno), [2]);
  assert.deepEqual(searchMembers(list, "r"), [], "needs 2+ characters");
  assert.deepEqual(searchMembers(list, "  "), []);
});

test("searchMembers prefers names that start with the query and caps results", () => {
  const list = Array.from({ length: 30 }, (_, i) => ({ mpsno: i, name: `Kumar ${i}`, status: "Sitting" }))
    .concat({ mpsno: 99, name: "Arun Kumar", status: "Sitting" });
  const out = searchMembers(list, "kumar");
  assert.equal(out.length, 8);
  assert.equal(out[0].mpsno, 0);
  assert.ok(!out.some((x) => x.mpsno === 99));
});

test("emptyStateMessage only appears when there are no questions", () => {
  assert.equal(emptyStateMessage({ status: "Sitting" }, 3), null);
  const msg = emptyStateMessage({ status: "Sitting" }, 0);
  assert.match(msg, /working prototype/i);
  assert.match(msg, /ministers do not ask questions/i);
  assert.doesNotMatch(msg, /inactive|zero/i);
});

test("statusLabel names non-sitting records plainly", () => {
  assert.equal(statusLabel({ status: "Sitting" }), null);
  assert.equal(statusLabel({ status: "Died" }), "Former MP");
  assert.equal(statusLabel({ status: "Resigned" }), "Former MP");
});

test("formatCount uses Indian grouping", () => {
  assert.equal(formatCount(1), "1");
  assert.equal(formatCount(123456), "1,23,456");
});
