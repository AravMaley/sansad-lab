// "Find your MP": pick a state, then a constituency, or search by name.
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

// Name search: every word typed must appear in the name. Names that start
// with the query come first. Honorifics and dots are ignored.
const norm = (s) => (s ?? "").toLowerCase().replace(/[.,]/g, " ").replace(/\s+/g, " ").trim();
const HONORIFIC = /^(shri|smt|sushri|dr|prof|adv|col|capt|kumari|km)\s+/g;
export function searchMembers(members, query, limit = 8) {
  const q = norm(query);
  if (q.length < 2) return [];
  const words = q.split(" ");
  const bare = (n) => { let s = norm(n), prev; do { prev = s; s = s.replace(HONORIFIC, ""); } while (s !== prev); return s; };
  return members
    .map((m) => ({ m, name: bare(m.name) }))
    .filter(({ name }) => words.every((w) => name.includes(w)))
    .sort((a, b) => Number(b.name.startsWith(q)) - Number(a.name.startsWith(q)) || a.name.localeCompare(b.name, "en-IN", { numeric: true }))
    .slice(0, limit)
    .map(({ m }) => m);
}

export async function initFindMP() {
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

  go.addEventListener("click", () => { location.href = `/mp/${Number(constSel.value)}`; });

  // Or search by name.
  const nameInput = el("input", { id: "fm-name", class: "input", type: "search", autocomplete: "off",
    placeholder: "Or type a name, e.g. Supriya Sule", "aria-label": "Search MPs by name", "aria-controls": "fm-hits" });
  const hits = el("ul", { id: "fm-hits", class: "fm-hits", "aria-live": "polite" });
  nameInput.addEventListener("input", () => {
    const q = nameInput.value;
    const found = searchMembers(members, q);
    hits.replaceChildren(...found.map((m) => el("li", {},
      el("a", { href: `/mp/${m.mpsno}` }, el("strong", {}, m.name),
        el("span", { class: "note" }, ` ${[m.party_short, m.constituency, m.state].filter(Boolean).join(" · ")}${m.status === "Sitting" ? "" : " · former MP"}`)))));
    if (!found.length && q.trim().length >= 2) hits.append(el("li", { class: "note" }, `No MP named “${q.trim()}”.`));
  });

  root.replaceChildren(
    el("div", { class: "fm-row" },
      el("label", { class: "sr-only", for: "fm-state" }, "State"), stateSel,
      el("label", { class: "sr-only", for: "fm-const" }, "Constituency"), constSel, go),
    el("div", { class: "fm-name" }, nameInput, hits),
    note,
    el("p", { class: "note" }, `${members.length} members of the 18th Lok Sabha. `,
      lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.` : ""),
  );
}
