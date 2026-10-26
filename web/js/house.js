import { loadJSON, el, svg, sourceLink } from "./util.js";

const ALLIANCE_VAR = { NDA: "--nda", INDIA: "--india", OTH: "--oth" };
const TINTS = [100, 72, 52, 86, 62]; // cycled so neighbouring parties differ

// Parliament-chart layout: concentric rows, seats per row proportional to radius,
// then every seat sorted left-to-right by angle so parties form wedges.
function layoutSeats(total, rows = 12, inner = 0.4) {
  const radii = Array.from({ length: rows }, (_, i) => inner + ((1 - inner) * i) / (rows - 1));
  const sumR = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map((r) => Math.round((total * r) / sumR));
  counts[rows - 1] += total - counts.reduce((a, b) => a + b, 0);

  const seats = [];
  radii.forEach((r, i) => {
    const n = counts[i];
    for (let j = 0; j < n; j++) {
      const angle = Math.PI * (1 - j / (n - 1)); // π (left) → 0 (right)
      seats.push({ angle, r });
    }
  });
  seats.sort((a, b) => b.angle - a.angle || a.r - b.r);
  const dot = Math.min((1 - inner) / (rows - 1), (Math.PI * sumR) / total) * 0.4;
  return { seats, dot };
}

function colorFor(party, rankInAlliance) {
  const pct = TINTS[rankInAlliance % TINTS.length];
  const base = `var(${ALLIANCE_VAR[party.alliance]})`;
  return pct === 100 ? base : `color-mix(in oklab, ${base} ${pct}%, var(--paper))`;
}

export async function initHouse() {
  const data = await loadJSON("data/lok-sabha-18.json");
  const chart = document.getElementById("hemicycle");
  const caption = document.getElementById("seat-caption");

  // Colour each party by alliance, largest party in full colour.
  const ranks = {};
  ["NDA", "INDIA", "OTH"].forEach((a) => {
    data.parties.filter((p) => p.alliance === a)
      .sort((x, y) => y.seats - x.seats)
      .forEach((p, i) => { ranks[p.short] = i; });
  });
  const parties = data.parties.map((p, i) => ({ ...p, idx: i, color: colorFor(p, ranks[p.short]) }));

  // Draw
  const S = 100;
  const { seats, dot } = layoutSeats(data.total);
  const root = svg("svg", { viewBox: `${-S - 4} ${-S - 4} ${2 * S + 8} ${S + 8}`, "aria-hidden": "true" });
  const circlesByParty = parties.map(() => []);
  let cursor = 0;
  parties.forEach((p) => {
    for (let k = 0; k < p.seats; k++, cursor++) {
      const { angle, r } = seats[cursor];
      const c = svg("circle", {
        cx: (Math.cos(angle) * r * S).toFixed(2),
        cy: (-Math.sin(angle) * r * S).toFixed(2),
        r: (dot * S).toFixed(2),
        style: `fill:${p.color}; animation-delay:${Math.round((1 - angle / Math.PI) * 600)}ms`,
      });
      c.dataset.p = p.idx;
      circlesByParty[p.idx].push(c);
      root.append(c);
    }
  });
  const total = svg("text", { x: 0, y: -10, "text-anchor": "middle", class: "total", "font-size": 22 });
  total.textContent = data.total;
  const sub = svg("text", { x: 0, y: 2, "text-anchor": "middle", class: "total-sub", "font-size": 4.2 });
  sub.textContent = "SEATS · MAJORITY " + data.majority;
  root.append(total, sub);
  chart.append(root);
  chart.classList.add("animate");

  // Highlight
  let active = null;
  const chips = [];
  function select(idx) {
    if (active !== null) circlesByParty[active].forEach((c) => c.classList.remove("on"));
    active = idx === active ? null : idx;
    chips.forEach((ch) => ch.setAttribute("aria-pressed", String(Number(ch.dataset.p) === active)));
    if (active === null) {
      delete chart.dataset.active;
      caption.innerHTML = "&nbsp;";
      return;
    }
    const p = parties[active];
    circlesByParty[active].forEach((c) => c.classList.add("on"));
    chart.dataset.active = "";
    const alliance = data.alliances.find((a) => a.id === p.alliance).name;
    caption.replaceChildren(
      el("strong", {}, p.name), ` · ${p.seats} seat${p.seats > 1 ? "s" : ""} · ${alliance}`,
      p.vote_pct !== null ? ` · ${p.vote_pct}% of votes` : ""
    );
  }
  root.addEventListener("click", (e) => {
    const idx = e.target.dataset?.p;
    if (idx !== undefined) select(Number(idx));
  });
  root.addEventListener("mouseover", (e) => {
    const idx = e.target.dataset?.p;
    if (idx !== undefined && Number(idx) !== active && matchMedia("(hover: hover)").matches) select(Number(idx));
  });

  // Alliance bar with the majority line
  const byId = Object.fromEntries(data.alliances.map((a) => [a.id, a]));
  const order = ["INDIA", "OTH", "NDA"];
  document.getElementById("alliance-bar").append(
    el("div", { class: "ab-track", role: "img", "aria-label": `INDIA bloc ${byId.INDIA.seats}, unaligned ${byId.OTH.seats}, NDA ${byId.NDA.seats}; majority is ${data.majority}` },
      order.map((id) => el("div", { class: "ab-seg", style: `width:${(byId[id].seats / data.total) * 100}%; background:var(${ALLIANCE_VAR[id]})` })),
      el("div", { class: "ab-mark", title: `Majority: ${data.majority}` })
    ),
    el("div", { class: "ab-labels" },
      el("div", {}, el("strong", {}, byId.INDIA.seats), "INDIA bloc"),
      el("div", { class: "mid" }, el("strong", {}, byId.OTH.seats), "Unaligned"),
      el("div", { class: "right" }, el("strong", {}, byId.NDA.seats), "NDA · majority line at 272")
    )
  );

  // Legend: the biggest parties first, the rest behind a toggle.
  const legend = document.getElementById("party-legend");
  const sorted = [...parties].sort((a, b) => b.seats - a.seats);
  const SHOWN = 10;
  sorted.forEach((p, i) => {
    const chip = el("button", { class: "chip", type: "button", "aria-pressed": "false", hidden: i >= SHOWN, onclick: () => select(p.idx) },
      el("span", { class: "sw", style: `background:${p.color}` }), p.short, el("span", { class: "n" }, p.seats));
    chip.dataset.p = p.idx;
    chips.push(chip);
    legend.append(chip);
  });
  const more = el("button", { class: "btn btn-quiet", type: "button" }, `All ${parties.length} parties`);
  more.addEventListener("click", () => { chips.forEach((c) => (c.hidden = false)); more.remove(); });
  legend.append(more);

  // Facts
  document.getElementById("house-facts").append(
    ...data.facts.map((f) => el("div", {}, el("dt", {}, f.value), el("dd", {}, f.label, " ", sourceLink(f.source))))
  );
  document.getElementById("house-since").append(
    data.since, " ", sourceLink(data.since_source), " · Seat data: ", sourceLink(data.source, "ECI via Wikipedia")
  );
}
