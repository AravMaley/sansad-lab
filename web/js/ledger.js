import { loadJSON, el, sourceLink } from "./util.js";

const SCALE_MAX = 150; // sessions can run past 100% of scheduled time

function sessionRow(s) {
  const bar = (cls, house, v) => el("div", { class: "row " + cls },
    el("div", { class: "track" },
      v === null ? null : el("div", { class: "fill", style: `width:${(Math.min(v, SCALE_MAX) / SCALE_MAX) * 100}%` }),
      el("div", { class: "hundred", style: `left:${(100 / SCALE_MAX) * 100}%` })
    ),
    el("span", { class: "v" + (v === null ? " na" : ""), title: house }, v === null ? "n/a" : `${v}%`)
  );
  return el("div", { class: "session" },
    el("div", { class: "lab" }, s.label, el("small", {}, s.dates, " · ", sourceLink(s.source, "PRS"))),
    el("div", { class: "pair", role: "img", "aria-label": `${s.label}: Lok Sabha ${s.ls_pct ?? "n/a"}%, Rajya Sabha ${s.rs_pct ?? "n/a"}%` },
      bar("ls", "Lok Sabha", s.ls_pct),
      bar("rs", "Rajya Sabha", s.rs_pct)
    )
  );
}

export async function initLedger() {
  const d = await loadJSON("data/productivity.json");
  const root = document.getElementById("ledger-body");
  const na = (v, suffix = "") => (v === null ? el("td", { class: "na" }, "—") : el("td", {}, `${v}${suffix}`));

  root.append(
    // 1 · Committee scrutiny
    el("div", { class: "panel" },
      el("h3", {}, "Fewer laws get a second look"),
      el("p", {}, "Share of bills sent to a parliamentary committee for detailed scrutiny before the vote."),
      el("div", { class: "hbars" }, d.terms.map((t) => el("div", { class: "hbar" },
        el("span", { class: "lab" }, `${t.label} Lok Sabha`, el("small", {}, t.years)),
        el("div", { class: "track", role: "img", "aria-label": `${t.committee_pct}%` }, el("div", { class: "fill", style: `width:${t.committee_pct}%` })),
        el("span", { class: "val" }, `${t.committee_pct}%`)
      ))),
      el("p", { class: "note", style: "margin-top:16px" }, "Source: PRS Legislative Research ", sourceLink(d.terms[2].source, "14th–16th"), " ", sourceLink(d.terms[3].source, "17th"))
    ),

    // 2 · Session productivity
    el("div", { class: "panel" },
      el("h3", {}, "The 18th Lok Sabha, session by session"),
      el("p", {}, "Share of scheduled time each House actually worked. Above 100% means it sat late; the dashed line marks 100%."),
      el("div", { class: "key" },
        el("span", {}, el("i", { class: "k-ls" }), "Lok Sabha"),
        el("span", {}, el("i", { class: "k-rs" }), "Rajya Sabha"),
        el("span", {}, el("i", { class: "k-100" }), "100% of scheduled time")
      ),
      el("div", { class: "sessions" }, d.sessions.map(sessionRow)),
      el("p", { class: "note", style: "margin-top:16px" }, d.method)
    ),

    // 3 · Full terms
    el("div", { class: "panel" },
      el("h3", {}, "Four Lok Sabhas compared"),
      el("p", {}, "Sittings and bills passed are the clearest measures of how much a House does in its five years."),
      el("div", { class: "ltable-wrap" },
        el("table", { class: "ltable" },
          el("thead", {}, el("tr", {},
            el("th", { scope: "col" }, "Lok Sabha"), el("th", { scope: "col" }, "Sittings"), el("th", { scope: "col" }, "Bills passed"),
            el("th", { scope: "col" }, "LS worked"), el("th", { scope: "col" }, "RS worked")
          )),
          el("tbody", {}, d.terms.map((t) => el("tr", {},
            el("td", {}, t.label, " ", el("span", { class: "yrs" }, t.years)),
            na(t.sittings), na(t.bills),
            na(t.ls_pct, t.approx ? "%≈" : "%"), na(t.rs_pct, t.approx ? "%≈" : "%")
          )))
        )
      ),
      el("p", { class: "note", style: "margin-top:12px" }, "≈ ", d.approx_note, " A dash means we couldn’t verify the figure from PRS yet.")
    ),

    // 4 · Records
    el("div", { class: "panel" },
      el("h3", {}, "For the record"),
      el("div", { class: "records" }, d.records.map((r) => el("div", { class: "record" },
        el("span", { class: "big" }, r.value),
        el("p", {}, r.text, " ", sourceLink(r.source))
      )))
    )
  );
}
