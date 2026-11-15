import { test } from "node:test";
import assert from "node:assert/strict";
import { groupByState, assignSeats } from "../../web/js/findmp.js";
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

test("assignSeats fills each party's seats with its sitting members", () => {
  const seats = [{ short: "BJP" }, { short: "BJP" }, { short: "INC" }];
  const members = [m(5, "S", "B"), m(4, "S", "A"), m(7, "S", "C", "INC"), m(8, "S", "D", "INC", "Died")];
  const out = assignSeats(seats, members);
  assert.deepEqual(out.map((s) => s.mpsno), [4, 5, 7]);
});

test("assignSeats leaves seats empty when parties do not match", () => {
  const out = assignSeats([{ short: "XYZ" }], [m(1, "S", "A", "BJP")]);
  assert.equal(out[0].mpsno, null);
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
