// Home page: the crowd of 543 dots, the alliance bar, party chips and facts.
import { el, sourceLink } from "./util.js";
import { loadParties, ALLIANCE_VAR } from "./parties.js";
import { dotsReady } from "./site.js";

export async function initHouse() {
  const { data, parties } = await loadParties();
  const crowd = document.getElementById("crowd");
  const caption = document.getElementById("seat-caption");
  const chips = [];
  let active = null;
  let dots = null;

  function describe(idx) {
    if (idx === null) { caption.textContent = "Each dot is one seat. Point at one, or pick a party."; return; }
    const p = parties[idx];
    const alliance = data.alliances.find((a) => a.id === p.alliance).name;
    caption.replaceChildren(
      el("span", { class: "sw", style: `background:${p.hex}` }),
      el("strong", {}, p.name), ` · ${p.seats} seat${p.seats > 1 ? "s" : ""} · ${alliance}`,
      p.vote_pct !== null ? ` · ${p.vote_pct}% of votes` : "");
  }
  function show(idx) {
    dots?.highlight(idx === null ? null : (i) => (dots.owners[i] === idx ? 1 : 0));
    describe(idx);
  }
  function select(idx) {
    active = idx === active ? null : idx;
    chips.forEach((ch) => ch.setAttribute("aria-pressed", String(Number(ch.dataset.p) === active)));
    show(active);
  }
  describe(null);

  dotsReady.then((d) => {
    if (!d) { crowd.classList.add("no-dots"); return; }
    dots = d;
    // Label each alliance under its group of dots.
    const labels = el("div", { class: "crowd-labels", "aria-hidden": "true" });
    crowd.append(labels);
    dots.crowd(crowd, (groups) => labels.replaceChildren(...groups.map((g) =>
      el("span", { class: "crowd-label", style: `left:${g.cx}px; top:${g.cy + g.r + 10}px` },
        el("strong", {}, g.seats), " ", data.alliances.find((a) => a.id === g.alliance)?.name ?? g.alliance))));
    let hovered = null;
    crowd.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const i = dots.pick(e.clientX, e.clientY);
      const idx = i === null ? null : dots.owners[i];
      crowd.style.cursor = idx === null ? "" : "pointer";
      if (idx === hovered) return;
      hovered = idx;
      show(idx ?? active);
    });
    crowd.addEventListener("pointerleave", () => { hovered = null; show(active); });
    crowd.addEventListener("click", (e) => {
      const i = dots.pick(e.clientX, e.clientY);
      select(i === null ? null : dots.owners[i]);
    });
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
      el("div", { class: "right" }, el("strong", {}, byId.NDA.seats), `NDA · majority line at ${data.majority}`)
    )
  );

  // Party chips: the biggest parties first, the rest behind a toggle.
  const legend = document.getElementById("party-legend");
  const sorted = [...parties].sort((a, b) => b.seats - a.seats);
  const SHOWN = 10;
  sorted.forEach((p, i) => {
    const chip = el("button", { class: "chip", type: "button", "aria-pressed": "false", hidden: i >= SHOWN, onclick: () => select(p.idx) },
      el("span", { class: "sw", style: `background:${p.hex}` }), p.short, el("span", { class: "n" }, p.seats));
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
    data.since, " ", sourceLink(data.since_source), " · Seat data: ", sourceLink(data.source, "Election Commission of India")
  );
}
