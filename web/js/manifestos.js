// Manifesto reader: browse 2024 manifesto positions by party or topic,
// compare up to three parties side by side, and search. Pure helpers are
// exported for tests; initManifestos() renders the page.
import { el, loadJSON } from "./util.js";

export function stanceLabel(pos) {
  if (!pos) return { text: "Not mentioned", cls: "silent" };
  if (pos.stance === 0) return { text: "Silent", cls: "silent" };
  const word = pos.stance === 1 ? "Supports" : "Opposes";
  return { text: pos.partial ? `${word}, partly` : word, cls: pos.stance === 1 ? "yes" : "no" };
}

const sourceFor = (party, page) => `${party.url}#page=${(page ?? 1) + (party.pageOffset ?? 0)}`;

export function topics(data) {
  return [...new Set(data.statements.map((s) => s.topic))];
}

function entry(party, statement) {
  const pos = statement.positions[party.id];
  return { party, stance: pos?.stance ?? null, label: stanceLabel(pos), quote: pos?.quote ?? null, note: pos?.note ?? null, page: pos?.page ?? null, source: sourceFor(party, pos?.page) };
}

export function byTopic(data) {
  const map = new Map(topics(data).map((t) => [t, []]));
  for (const s of data.statements) map.get(s.topic).push({ statement: s, entries: data.parties.map((p) => entry(p, s)) });
  return map;
}

export function compare(data, topic, partyIds) {
  const stmts = data.statements.filter((s) => s.topic === topic);
  return partyIds.slice(0, 3).map((id) => data.parties.find((p) => p.id === id)).filter(Boolean).map((party) => {
    const entries = stmts.map((s) => ({ statement: s, ...entry(party, s) }));
    return { party, entries, mentioned: entries.some((e) => e.stance === 1 || e.stance === -1) };
  });
}

export function searchStatements(data, q) {
  const needle = String(q ?? "").trim().toLowerCase();
  if (!needle) return [];
  return data.statements.filter((s) =>
    [s.text, s.topic, ...Object.values(s.positions).map((p) => p.quote ?? "")].some((t) => t.toLowerCase().includes(needle)));
}

// ---------- page ----------

function positionCard(e) {
  return el("article", { class: "mf-pos" },
    el("p", { class: "mf-pos-head" }, el("strong", {}, e.party.short), el("span", { class: `tag ${e.label.cls}` }, e.label.text)),
    e.quote ? el("blockquote", { class: "quote" + (e.stance === 0 ? " is-silent" : "") }, `“${e.quote}”`) : el("p", { class: "note" }, "No commitment in the manifesto."),
    e.note ? el("p", { class: "note" }, e.note) : null,
    el("p", { class: "src-line" }, el("a", { class: "src", href: e.source, target: "_blank", rel: "noopener" }, `${e.party.manifesto ?? "Manifesto"}${e.page ? `, p. ${e.page}` : ""} ↗`)));
}

function statementBlock(s, entries) {
  return el("section", { class: "mf-statement paper" },
    el("p", { class: "meta" }, s.topic),
    el("h3", {}, s.text),
    el("div", { class: "mf-grid" }, entries.map(positionCard)));
}

export async function initManifestos() {
  const data = await loadJSON("/data/manifestos.json");
  const root = document.getElementById("mf");
  const allTopics = topics(data);
  const state = { view: "topic", topic: allTopics[0], party: data.parties[0].id, picked: data.parties.slice(0, 2).map((p) => p.id), q: "" };

  const tabs = el("div", { class: "bill-tabs", role: "tablist", "aria-label": "Browse by" });
  const controls = el("div", { class: "mf-controls" });
  const body = el("div", { class: "mf-body", "aria-live": "polite" });
  const search = el("input", { class: "input", type: "search", placeholder: "Search promises, e.g. MSP, caste census, NEET", "aria-label": "Search manifesto positions" });
  let t;
  search.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { state.q = search.value; render(); }, 250); });

  const views = [["topic", "By topic"], ["party", "By party"], ["compare", "Compare"]];
  tabs.append(...views.map(([v, label]) =>
    el("button", { class: "btn", role: "tab", type: "button", "aria-selected": String(state.view === v), onclick: () => { state.view = v; render(); } }, label)));

  const select = (options, value, onchange, label) =>
    el("select", { class: "select", "aria-label": label, onchange: (e) => onchange(e.target.value) },
      options.map(([v, text]) => el("option", { value: v, selected: v === value }, text)));

  function render() {
    tabs.querySelectorAll("button").forEach((b, i) => b.setAttribute("aria-selected", String(views[i][0] === state.view)));
    const hits = searchStatements(data, state.q);
    if (state.q.trim()) {
      controls.replaceChildren();
      body.replaceChildren(
        el("p", { class: "note" }, hits.length ? `${hits.length} statement${hits.length > 1 ? "s" : ""} match “${state.q.trim()}”.` : `Nothing matches “${state.q.trim()}”.`),
        ...hits.map((s) => statementBlock(s, data.parties.map((p) => entry(p, s)))));
      return;
    }
    if (state.view === "topic") {
      controls.replaceChildren(select(allTopics.map((x) => [x, x]), state.topic, (v) => { state.topic = v; render(); }, "Topic"));
      body.replaceChildren(...byTopic(data).get(state.topic).map(({ statement, entries }) => statementBlock(statement, entries)));
    } else if (state.view === "party") {
      controls.replaceChildren(select(data.parties.map((p) => [p.id, `${p.short} · ${p.manifesto}`]), state.party, (v) => { state.party = v; render(); }, "Party"));
      const p = data.parties.find((x) => x.id === state.party);
      body.replaceChildren(
        el("p", { class: "note" }, el("a", { class: "src", href: p.url, target: "_blank", rel: "noopener" }, `Read the full ${p.manifesto} ↗`)),
        ...data.statements.map((s) => statementBlock(s, [entry(p, s)])));
    } else {
      const picks = el("div", { class: "mf-picks" }, data.parties.map((p) =>
        el("label", { class: "chip" }, el("input", { type: "checkbox", checked: state.picked.includes(p.id), onchange: (e) => {
          if (e.target.checked) state.picked = [...state.picked, p.id].slice(-3);
          else state.picked = state.picked.filter((x) => x !== p.id);
          render();
        } }), p.short)));
      controls.replaceChildren(select(allTopics.map((x) => [x, x]), state.topic, (v) => { state.topic = v; render(); }, "Topic"), picks,
        el("p", { class: "note" }, "Pick up to three parties."));
      const cols = compare(data, state.topic, state.picked);
      body.replaceChildren(cols.length < 2 ? el("p", { class: "empty" }, "Pick at least two parties to compare.") :
        el("div", { class: "mf-compare", style: `--cols:${cols.length}` }, cols.map((c) =>
          el("div", { class: "mf-col paper" },
            el("h3", {}, c.party.short),
            c.mentioned ? null : el("p", { class: "tag silent" }, `Not mentioned in the ${c.party.manifesto ?? "manifesto"}`),
            c.entries.map((e) => el("div", { class: "mf-cell" }, el("p", { class: "mf-q" }, e.statement.text), positionCard(e)))))));
    }
  }

  root.replaceChildren(
    el("div", { class: "mf-top" }, tabs, search),
    controls, body,
    el("aside", { class: "mf-method note" }, data.method, " ", el("a", { href: "/#match" }, "Try the Manifesto Matcher →")),
    data.excluded ? el("details", { class: "mf-excluded" }, el("summary", {}, data.excluded.heading), el("p", {}, data.excluded.lede),
      el("ul", {}, (data.excluded.missing ?? []).map((m) => el("li", {}, el("strong", {}, m.party), " — ", m.why)))) : null,
  );
  render();
}
