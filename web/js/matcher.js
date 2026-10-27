import { loadJSON, el, store } from "./util.js";

const ANSWERS = [
  { v: 1, label: "Agree", key: "1" },
  { v: 0, label: "Not sure", key: "2" },
  { v: -1, label: "Disagree", key: "3" },
];
const STANCE = { 1: ["Supports", "yes"], "-1": ["Opposes", "no"], 0: ["Silent", ""] };

// Agreement is measured only where the manifesto actually takes a position;
// silence is reported separately rather than counted as disagreement.
function score(data, answers) {
  return data.parties.map((p) => {
    let agree = 0, compared = 0, silent = 0;
    for (const st of data.statements) {
      const a = answers[st.id];
      if (!a) continue;
      const s = st.positions[p.id].stance;
      if (s === 0) { silent++; continue; }
      compared++;
      if (s === a) agree++;
    }
    return { party: p, agree, compared, silent, pct: compared ? Math.round((agree / compared) * 100) : null };
  });
}

export async function initMatcher() {
  const data = await loadJSON("data/manifestos.json");
  const root = document.getElementById("matcher");
  const n = data.statements.length;
  let answers = store.get("answers", {});
  let i = data.statements.findIndex((s) => !(s.id in answers));
  if (i === -1) i = n;

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

  function renderResults() {
    const scores = score(data, answers);
    const answered = Object.values(answers).filter(Boolean).length;
    const youTag = (v) => (v === 1 ? "You agree" : v === -1 ? "You disagree" : "You’re not sure");

    root.replaceChildren(
      el("div", { class: "results" },
        scores.map((s) => el("div", { class: "score" },
          el("span", { class: "meta", style: "margin:0" }, s.party.short),
          s.pct === null
            ? el("p", { class: "pct" }, "—")
            : el("p", { class: "pct" }, `${s.pct}`, el("small", {}, "%")),
          el("p", {}, s.pct === null
            ? `${s.party.short}’s manifesto takes no position on the statements you answered.`
            : `Agrees with you on ${s.agree} of ${s.compared} statements where its manifesto takes a position. Silent on ${s.silent} of your ${answered}.`),
          el("div", { class: "meter" }, el("span", { style: `width:${s.pct ?? 0}%` }))
        ))
      ),
      el("div", { class: "breakdown" },
        data.statements.map((st) => el("details", {},
          el("summary", {},
            el("span", { class: "s-text" }, st.text),
            el("span", { class: "s-tags" },
              el("span", { class: "tag you" }, youTag(answers[st.id] ?? 0)),
              data.parties.map((p) => {
                const [label, cls] = STANCE[st.positions[p.id].stance];
                return el("span", { class: "tag " + cls }, `${p.short}: ${label}`);
              })
            )
          ),
          el("div", { class: "quotes" },
            data.parties.map((p) => {
              const pos = st.positions[p.id];
              const where = pos.page ? `${p.manifesto}, p. ${pos.page}` : p.manifesto;
              return el("blockquote", { class: "quote" },
                pos.quote ? `“${pos.quote}”` : el("span", { class: "silent" }, "No commitment on this in the manifesto."),
                el("cite", {}, p.short, " · ", el("a", { href: pos.page ? `${p.url}#page=${pos.page}` : p.url, target: "_blank", rel: "noopener" }, where + " ↗"),
                  pos.verify ? ` · ${pos.verify}` : "")
              );
            })
          )
        ))
      ),
      el("p", { class: "note method" }, data.method, " ", data.excluded),
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
