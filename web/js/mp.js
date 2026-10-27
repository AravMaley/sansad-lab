import { loadJSON, el, fmtDate, sourceLink, store } from "./util.js";

const CHOICES = [
  { id: "aye", label: "Aye" },
  { id: "no", label: "No" },
  { id: "committee", label: "Send to committee" },
  { id: "abstain", label: "Abstain" },
];
const LABEL = { aye: "Aye", no: "No", committee: "Committee", abstain: "Abstain" }; // short, for the tabs

function tally(v, choice) {
  const you = (side) => (choice === side ? el("span", { class: "you-chip" }, "+ you") : null);
  const head = el("h4", {}, el("span", {}, v.house), el("span", {}, fmtDate(v.date)));

  if (v.method === "division") {
    const total = v.ayes + v.noes;
    return el("div", { class: "tally" }, head,
      el("div", { class: "nums" }, v.ayes, you("aye"), el("span", {}, " – "), v.noes, you("no")),
      el("div", { class: "t-bar", role: "img", "aria-label": `${v.ayes} ayes, ${v.noes} noes` },
        el("div", { class: "ayes", style: `width:${(v.ayes / total) * 100}%` }),
        el("div", { class: "noes", style: `width:${(v.noes / total) * 100}%` })
      ),
      el("p", {}, v.note, " ", sourceLink(v.source))
    );
  }
  return el("div", { class: "tally" }, head,
    el("div", { class: "voice" },
      v.method === "voice"
        ? "Voice vote — no count was recorded, so no one knows how each MP voted."
        : "No recorded division found."),
    el("p", {}, v.note, " ", sourceLink(v.source))
  );
}

export async function initMP() {
  const { bills } = await loadJSON("data/bills.json");
  const tabs = document.getElementById("bill-tabs");
  const view = document.getElementById("bill");
  let votes = store.get("votes", {});
  let current = bills[0].id;

  function renderTabs() {
    tabs.replaceChildren(...bills.map((b) => el("button", {
      class: "bill-tab", role: "tab", type: "button", "aria-selected": String(b.id === current), "aria-controls": "bill",
      onclick: () => { current = b.id; renderTabs(); renderBill(); },
    },
      el("span", { class: "y" }, el("span", {}, b.year), votes[b.id] ? el("span", { class: "mine" }, "You: " + LABEL[votes[b.id]]) : null),
      el("span", { class: "t" }, b.title)
    )));
  }

  function renderBill() {
    const b = bills.find((x) => x.id === current);
    const choice = votes[b.id];

    const reveal = el("div", { class: "reveal", hidden: !choice });
    if (choice) {
      reveal.append(
        el("p", { class: "reflection" }, b.reflection[choice]),
        el("div", { class: "tallies" }, b.votes.map((v) => tally(v, choice))),
        el("div", { class: "two-col" },
          el("div", {},
            el("p", { class: "meta" }, "What happened"),
            el("ol", { class: "timeline" }, b.timeline.map((t) =>
              el("li", {}, el("time", { datetime: t.date }, fmtDate(t.date)), t.text, " ", sourceLink(t.source))
            ))
          ),
          el("div", { class: "status" },
            el("p", { class: "meta", style: "margin:0" }, `Where it stands · ${b.status.as_of}`),
            el("p", { class: "outcome" }, b.outcome),
            el("p", {}, b.status.text, " ", sourceLink(b.status.source)),
            el("p", { class: "note" }, "Committee: ", b.committee.note, " ", sourceLink(b.committee.source)),
            el("p", { class: "question" }, b.question)
          )
        )
      );
    }

    const side = (cls, title, items) => el("div", { class: "side " + cls },
      el("h3", {}, title),
      el("ul", {}, items.map((a) => el("li", {}, el("p", {}, a.text), el("p", { class: "by" }, "— ", a.by, " · ", sourceLink(a.source)))))
    );

    view.replaceChildren(
      el("div", { class: "bill-head" },
        el("p", { class: "meta" }, `${b.year} · ${b.kicker}`),
        el("h3", { class: "display", style: "font-size:clamp(2rem,5vw,3.25rem)" }, b.title),
        el("p", {}, b.summary)
      ),
      el("ul", { class: "provisions" }, b.provisions.map((p) => el("li", {}, p))),
      el("div", { class: "sides" },
        side("for", "The case for", b.arguments_for),
        side("against", "The case against", b.arguments_against)
      ),
      el("div", { class: "ballot" },
        el("h3", {}, choice ? "Your vote is in" : "How do you vote?"),
        el("div", { class: "ballot-choices", role: "group", "aria-label": "Your vote" },
          CHOICES.map((c) => el("button", {
            class: "btn" + (choice === c.id ? " picked" : ""), type: "button", "aria-pressed": String(choice === c.id),
            onclick: () => {
              votes = { ...votes, [b.id]: c.id };
              store.set("votes", votes);
              renderTabs();
              renderBill();
              view.querySelector(".reveal")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            },
          }, c.label))
        ),
        reveal
      )
    );
  }

  renderTabs();
  renderBill();
}
