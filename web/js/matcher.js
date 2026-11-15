import { loadJSON, el, store, fmtDate } from "./util.js";

const ANSWERS = [
  { v: 1, label: "Agree", key: "1" },
  { v: 0, label: "Not sure", key: "2" },
  { v: -1, label: "Disagree", key: "3" },
];

function stanceLabel(pos) {
  if (pos.stance === 0) return ["Silent", "silent"];
  const word = pos.stance === 1 ? "Supports" : "Opposes";
  if (pos.critique) return [`Criticises`, "critique"];
  if (pos.partial) return [`${word}, partly`, pos.stance === 1 ? "yes" : "no"];
  return [word, pos.stance === 1 ? "yes" : "no"];
}

// Agreement is measured only where a manifesto takes a position. Silence is
// reported separately and never counted against a party — otherwise a short
// manifesto would score worse than a long one for no reason of substance.
function score(data, answers) {
  return data.parties.map((party) => {
    let agree = 0, compared = 0, silent = 0;
    for (const st of data.statements) {
      const a = answers[st.id];
      if (!a) continue;
      const s = st.positions[party.id].stance;
      if (s === 0) { silent++; continue; }
      compared++;
      if (s === a) agree++;
    }
    return { party, agree, compared, silent, pct: compared ? Math.round((agree / compared) * 100) : null };
  }).sort((x, y) => (y.pct ?? -1) - (x.pct ?? -1));
}

export async function initMatcher() {
  const data = await loadJSON("data/manifestos.json");
  const root = document.getElementById("matcher");
  const n = data.statements.length;
  let answers = store.get("answers", {});
  let i = data.statements.findIndex((s) => !(s.id in answers));
  if (i === -1) i = n;

  const pageLink = (party, page) =>
    page ? `${party.url}#page=${page + (party.pageOffset ?? 0)}` : party.url;

  function answer(v) {
    answers = { ...answers, [data.statements[i].id]: v };
    store.set("answers", answers);
    i++;
    render();
  }

  function renderQuestion() {
    const st = data.statements[i];
    const picked = answers[st.id];
    root.replaceChildren(
      el("div", { class: "q-card" },
        el("div", { class: "q-top" },
          el("span", { class: "meta", style: "margin:0" }, st.topic),
          el("span", { class: "meta", style: "margin:0" }, `${i + 1} / ${n}`)
        ),
        el("div", { class: "q-progress" }, el("span", { style: `width:${(i / n) * 100}%` })),
        el("p", { class: "q-text", id: "q-text" }, st.text),
        el("div", { class: "q-answers", role: "group", "aria-labelledby": "q-text" },
          ANSWERS.map((a) => el("button", {
            class: "btn" + (picked === a.v ? " picked" : ""), type: "button", "data-v": a.v, onclick: () => answer(a.v),
          }, a.label))
        ),
        el("div", { class: "q-foot" },
          el("button", { class: "btn btn-quiet", type: "button", disabled: i === 0, onclick: () => { i--; render(); } }, "← Back"),
          el("span", { class: "kbd-hint" }, "Keys 1 · 2 · 3")
        )
      )
    );
  }

  function quoteFor(party, st) {
    const pos = st.positions[party.id];
    const where = pos.page ? `${party.manifesto}, p. ${pos.page}` : party.manifesto;
    return el("blockquote", { class: "quote" + (pos.stance === 0 ? " is-silent" : "") },
      el("p", { class: "q-head" }, el("strong", {}, party.short), " — ", stanceLabel(pos)[0]),
      pos.quote ? el("p", {}, `“${pos.quote}”`) : null,
      pos.note ? el("p", { class: "q-note" }, pos.note) : null,
      el("cite", {},
        el("a", { href: pageLink(party, pos.page), target: "_blank", rel: "noopener" }, where + " ↗"),
        pos.verify ? ` · ${pos.verify}` : ""
      )
    );
  }

  function actionsFor(st) {
    const entries = Object.entries(st.actions ?? {});
    if (!entries.length) return null;
    return entries.map(([pid, act]) => {
      const party = data.parties.find((p) => p.id === pid);
      return el("div", { class: "action" },
        el("p", { class: "meta", style: "margin:0 0 6px" }, `${party.short} · what they actually did · ${act.type}`),
        el("p", { class: "action-sum" }, act.summary),
        el("p", { class: "action-detail" }, act.detail),
        el("p", { class: "action-src" }, act.who, " · ", fmtDate(act.date), " · ",
          el("a", { href: act.source, target: "_blank", rel: "noopener" }, "Source ↗"))
      );
    });
  }

  function renderResults() {
    const scores = score(data, answers);
    const answered = Object.values(answers).filter((v) => v !== undefined).length;
    const top = scores[0];
    const youTag = (v) => (v === 1 ? "You agree" : v === -1 ? "You disagree" : "You’re not sure");

    root.replaceChildren(
      el("div", { class: "score-list" },
        scores.map((s, idx) => el("div", { class: "score-row" + (idx === 0 ? " is-top" : "") },
          el("div", { class: "score-head" },
            el("span", { class: "score-name" }, s.party.short),
            el("span", { class: "score-pct" }, s.pct === null ? "—" : `${s.pct}%`)
          ),
          el("div", { class: "meter" }, el("span", { style: `width:${s.pct ?? 0}%` })),
          el("p", { class: "score-note" }, s.pct === null
            ? "Its manifesto takes no position on anything you answered."
            : `Agrees on ${s.agree} of the ${s.compared} statements where its manifesto takes a position. Silent on ${s.silent}.`)
        ))
      ),

      top && top.pct !== null
        ? el("p", { class: "score-lede" },
            "Closest match: ", el("strong", {}, top.party.name),
            ". Percentages compare only where a manifesto actually commits to something, so a party is never penalised for publishing a shorter document.")
        : null,

      el("h3", { class: "breakdown-head" }, "Statement by statement"),
      el("div", { class: "breakdown" },
        data.statements.map((st) => el("details", {},
          el("summary", {},
            el("span", { class: "s-text" }, st.text),
            el("span", { class: "s-tags" },
              el("span", { class: "tag you" }, youTag(answers[st.id] ?? 0)),
              data.parties.map((p) => {
                const [label, cls] = stanceLabel(st.positions[p.id]);
                return el("span", { class: "tag " + cls }, `${p.short}: ${label}`);
              })
            )
          ),
          el("div", { class: "details-body" },
            el("div", { class: "quotes" }, data.parties.map((p) => quoteFor(p, st))),
            actionsFor(st)
          )
        ))
      ),

      el("div", { class: "method-box" },
        el("h3", {}, data.excluded.heading),
        el("p", { class: "mb-lede" }, data.excluded.lede),
        el("dl", { class: "mb-missing" }, data.excluded.missing.map((m) =>
          el("div", {}, el("dt", {}, m.party), el("dd", {}, m.why)))),
        el("p", { class: "mb-close" }, data.excluded.close),
        el("details", { class: "mb-how" },
          el("summary", {}, "How this is scored"),
          el("p", { class: "note" }, data.method),
          el("p", { class: "note" }, data.partialNote, " ", data.critiqueNote),
          el("p", { class: "note" }, "A “what they actually did” panel appears where a manifesto is silent. It records votes, Parliament answers and state schemes, and is never scored."))
      ),

      el("button", { class: "btn", type: "button", onclick: () => { answers = {}; store.set("answers", answers); i = 0; render(); } }, "Start again")
    );
  }

  function render() {
    if (i < n) renderQuestion();
    else renderResults();
  }

  document.addEventListener("keydown", (e) => {
    if (i >= n || e.metaKey || e.ctrlKey || e.altKey) return;
    const r = root.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return; // only when the quiz is on screen
    const a = ANSWERS.find((x) => x.key === e.key);
    if (a) answer(a.v);
  });

  render();
}
