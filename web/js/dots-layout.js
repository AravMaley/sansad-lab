// Layout maths for the dot field: one dot per Lok Sabha seat. Pure functions,
// no DOM, so they can be tested in Node.

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const ORDER = ["INDIA", "OTH", "NDA"];

// The party index that owns each dot, in party order: [0,0,0,1,1,2,...].
export function dotOwners(parties) {
  return parties.flatMap((p) => Array(p.seats).fill(p.idx));
}

// "The crowd": each alliance is a sunflower of dots, its biggest party at
// the core and smaller parties in rings around it. Alliances sit side by
// side (or stacked, if the region is tall) and are scaled to fit the region.
export function crowdLayout(parties, owners, region) {
  const byIdx = new Map(parties.map((p) => [p.idx, p]));
  const names = ORDER.filter((a) => owners.some((o) => byIdx.get(o).alliance === a));
  const groups = names.map((a) => {
    const members = owners.map((o, i) => i).filter((i) => byIdx.get(owners[i]).alliance === a);
    // Biggest party first, so it gets the innermost spiral positions.
    members.sort((i, j) => byIdx.get(owners[j]).seats - byIdx.get(owners[i]).seats || owners[i] - owners[j] || i - j);
    return members;
  });

  const R = groups.map((g) => Math.sqrt(g.length) + 0.6); // radius at spiral scale 1
  // Gaps leave room for a label under each group; stacked groups need more.
  const span = (gap) => R.reduce((s, r) => s + 2 * r, 0) + gap * (groups.length - 1);
  const across = 2 * Math.max(...R);
  const fitH = Math.min(region.w / span(1.6), (region.h * 0.9) / across);
  const fitV = Math.min(region.w / across, region.h / (span(3.6) + 2));
  const vertical = fitV > fitH;
  const GAP = vertical ? 3.6 : 1.6;
  const along = span(GAP) + (vertical ? 2 : 0);
  const c = (vertical ? fitV : fitH) * 0.98;

  const points = new Array(owners.length);
  const labels = [];
  let pos = vertical ? region.h / 2 - (along * c) / 2 : region.w / 2 - (along * c) / 2;
  groups.forEach((g, gi) => {
    pos += R[gi] * c;
    const cx = vertical ? region.x + region.w / 2 : region.x + pos;
    const cy = vertical ? region.y + pos : region.y + region.h * 0.45;
    labels.push({ alliance: names[gi], seats: g.length, cx, cy, r: c * Math.sqrt(g.length - 0.5) });
    g.forEach((dot, k) => {
      const rad = c * Math.sqrt(k + 0.5);
      points[dot] = { x: cx + rad * Math.cos(k * GOLDEN), y: cy + rad * Math.sin(k * GOLDEN) };
    });
    pos += R[gi] * c + GAP * c;
  });
  return { points, r: c * 0.5, groups: labels, vertical };
}

// Small deterministic random generator, so the ambient field looks the same
// on every visit and in tests.
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// "The field": dots scattered evenly over the viewport on a jittered grid.
export function fieldLayout(n, w, h, seed = 543) {
  const rand = rng(seed);
  const cols = Math.max(1, Math.round(Math.sqrt((n * w) / h)));
  const rows = Math.ceil(n / cols);
  const cw = w / cols, ch = h / rows;
  const cells = Array.from({ length: cols * rows }, (_, i) => i);
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return cells.slice(0, n).map((cell) => ({
    x: ((cell % cols) + 0.15 + rand() * 0.7) * cw,
    y: (Math.floor(cell / cols) + 0.15 + rand() * 0.7) * ch,
  }));
}
