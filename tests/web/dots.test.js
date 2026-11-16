import { test } from "node:test";
import assert from "node:assert/strict";
import { crowdLayout, fieldLayout, dotOwners } from "../../web/js/dots-layout.js";

const parties = [
  { idx: 0, alliance: "INDIA", seats: 99 }, { idx: 1, alliance: "INDIA", seats: 135 },
  { idx: 2, alliance: "OTH", seats: 16 },
  { idx: 3, alliance: "NDA", seats: 240 }, { idx: 4, alliance: "NDA", seats: 53 },
];
const owners = dotOwners(parties);

test("dotOwners gives one dot per seat, grouped by party", () => {
  assert.equal(owners.length, 543);
  assert.equal(owners.filter((p) => p === 3).length, 240);
});

test("crowdLayout puts every seat inside the region without overlaps", () => {
  const region = { x: 10, y: 20, w: 900, h: 420 };
  const { points, r } = crowdLayout(parties, owners, region);
  assert.equal(points.length, 543);
  assert.ok(r > 1);
  for (const p of points) {
    assert.ok(p.x >= region.x && p.x <= region.x + region.w, `x ${p.x}`);
    assert.ok(p.y >= region.y && p.y <= region.y + region.h, `y ${p.y}`);
  }
  let min = Infinity;
  for (let i = 0; i < points.length; i++)
    for (let j = i + 1; j < points.length; j++)
      min = Math.min(min, Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y));
  assert.ok(min >= 2 * r * 0.95, `closest pair ${min} vs dot ${r}`);
});

test("crowdLayout groups alliances left to right: INDIA, unaligned, NDA", () => {
  const { points } = crowdLayout(parties, owners, { x: 0, y: 0, w: 1000, h: 400 });
  const meanX = (a) => {
    const xs = points.filter((_, i) => parties[owners[i]].alliance === a).map((p) => p.x);
    return xs.reduce((s, x) => s + x, 0) / xs.length;
  };
  assert.ok(meanX("INDIA") < meanX("OTH") && meanX("OTH") < meanX("NDA"));
});

test("crowdLayout stacks alliances on a tall region", () => {
  const { points } = crowdLayout(parties, owners, { x: 0, y: 0, w: 320, h: 900 });
  const meanY = (a) => {
    const ys = points.filter((_, i) => parties[owners[i]].alliance === a).map((p) => p.y);
    return ys.reduce((s, y) => s + y, 0) / ys.length;
  };
  assert.ok(meanY("INDIA") < meanY("NDA"));
});

test("crowdLayout puts each alliance's biggest party at its core", () => {
  const { points } = crowdLayout(parties, owners, { x: 0, y: 0, w: 1000, h: 400 });
  const ndaIdx = points.map((_, i) => i).filter((i) => parties[owners[i]].alliance === "NDA");
  const cx = ndaIdx.reduce((s, i) => s + points[i].x, 0) / ndaIdx.length;
  const cy = ndaIdx.reduce((s, i) => s + points[i].y, 0) / ndaIdx.length;
  const dist = (party) => {
    const d = ndaIdx.filter((i) => owners[i] === party).map((i) => Math.hypot(points[i].x - cx, points[i].y - cy));
    return d.reduce((s, x) => s + x, 0) / d.length;
  };
  assert.ok(dist(3) < dist(4));
});

test("crowdLayout reports each alliance's centre, radius and seat count for labels", () => {
  const { groups, points } = crowdLayout(parties, owners, { x: 0, y: 0, w: 1000, h: 400 });
  assert.deepEqual(groups.map((g) => [g.alliance, g.seats]), [["INDIA", 234], ["OTH", 16], ["NDA", 293]]);
  for (const g of groups) {
    const mine = points.filter((_, i) => parties[owners[i]].alliance === g.alliance);
    for (const p of mine) assert.ok(Math.hypot(p.x - g.cx, p.y - g.cy) <= g.r + 0.01);
  }
});

test("fieldLayout is deterministic and stays in the viewport", () => {
  const a = fieldLayout(543, 400, 800);
  const b = fieldLayout(543, 400, 800);
  assert.deepEqual(a, b);
  assert.equal(a.length, 543);
  for (const p of a) assert.ok(p.x >= 0 && p.x <= 400 && p.y >= 0 && p.y <= 800);
});
