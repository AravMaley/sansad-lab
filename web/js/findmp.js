// "Find your MP": pick a state, then a constituency; the MP's seat lights up
// in the 3D chamber and their page opens.
import { el } from "./util.js";
import { api } from "./api.js";

export function groupByState(members) {
  const states = new Map();
  for (const m of members) {
    if (!m.state || !m.constituency) continue;
    if (!states.has(m.state)) states.set(m.state, []);
    states.get(m.state).push({ name: m.constituency, mpsno: m.mpsno, status: m.status, member: m });
  }
  const byName = (a, b) => a.localeCompare(b, "en-IN");
  return [...states.entries()]
    .sort(([a], [b]) => byName(a, b))
    .map(([state, cs]) => ({ state, constituencies: cs.sort((a, b) => byName(a.name, b.name)) }));
}

// Seats are grouped by party, not the official seating plan: each party's
// seats are filled with its sitting members in constituency order.
export function assignSeats(seats, members) {
  const pools = new Map();
  for (const m of [...members].filter((x) => x.status === "Sitting").sort((a, b) => (a.constituency ?? "").localeCompare(b.constituency ?? ""))) {
    const k = (m.party_short ?? "").toUpperCase();
    if (!pools.has(k)) pools.set(k, []);
    pools.get(k).push(m.mpsno);
  }
  return seats.map((s) => ({ ...s, mpsno: pools.get((s.short ?? "").toUpperCase())?.shift() ?? null }));
}

export async function initFindMP({ chamberReady }) {
  const root = document.getElementById("findmp");
  const { members, lastUpdated } = await api("members");
  const groups = groupByState(members);

  const stateSel = el("select", { id: "fm-state", class: "select" },
    el("option", { value: "" }, "Choose your state"),
    groups.map((g) => el("option", { value: g.state }, g.state)));
  const constSel = el("select", { id: "fm-const", class: "select", disabled: true },
    el("option", { value: "" }, "Then your constituency"));
  const go = el("button", { class: "btn btn-primary", type: "button", disabled: true }, "Show my MP");
  const note = el("p", { class: "note", "aria-live": "polite" });

  stateSel.addEventListener("change", () => {
    const g = groups.find((x) => x.state === stateSel.value);
    constSel.replaceChildren(el("option", { value: "" }, "Then your constituency"),
      ...(g?.constituencies ?? []).map((c) =>
        el("option", { value: c.mpsno }, c.status === "Sitting" ? c.name : `${c.name} (no sitting MP)`)));
    constSel.disabled = !g;
    go.disabled = true;
  });
  constSel.addEventListener("change", () => { go.disabled = !constSel.value; });

  let chamber = null;
  chamberReady.then((c) => {
    if (!c) return;
    chamber = c;
    c.seats.splice(0, c.seats.length, ...assignSeats(c.seats, members));
  });

  go.addEventListener("click", () => {
    const mpsno = Number(constSel.value);
    const url = `/mp/${mpsno}`;
    if (chamber && chamber.seats.some((s) => s.mpsno === mpsno)) {
      chamber.focusSeat(mpsno);
      document.getElementById("house").scrollIntoView({ behavior: "smooth" });
      note.textContent = "Finding your seat…";
      setTimeout(() => (location.href = url), 1400);
    } else location.href = url;
  });

  root.replaceChildren(
    el("div", { class: "fm-row" },
      el("label", { class: "sr-only", for: "fm-state" }, "State"), stateSel,
      el("label", { class: "sr-only", for: "fm-const" }, "Constituency"), constSel, go),
    note,
    el("p", { class: "note" }, `${members.length} members of the 18th Lok Sabha. `,
      lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.` : ""),
  );
}
