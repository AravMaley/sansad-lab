import { loadJSON, el, sourceLink } from "./util.js";

const VERDICT_CLASS = { won: "v-won", partly: "v-partly", lost: "v-lost", live: "v-live" };

function card(p, key, i) {
  const img = p.image
    ? el("figure", { class: "p-figure" },
        el("div", { class: "p-frame" }, el("img", {
          src: p.image.src, alt: p.image.alt, loading: "lazy", decoding: "async",
          width: p.image.w, height: p.image.h,
        })),
        el("figcaption", {},
          p.image.alt, " · ",
          el("a", { href: p.image.url, target: "_blank", rel: "noopener" }, `${p.image.credit}, ${p.image.licence} ↗`)
        )
      )
    : p.imageWhy
      ? el("p", { class: "p-noimage" }, el("span", { class: "p-noimage-tag" }, "No photograph"), p.imageWhy)
      : null;

  const row = (label, text, cls) => text
    ? el("div", { class: "p-row " + (cls ?? "") }, el("dt", {}, label), el("dd", {}, text))
    : null;

  return el("article", { class: "p-card", id: "protest-" + p.id, "data-verdict": p.verdict },
    el("div", { class: "p-spine-dot", "aria-hidden": "true" }),

    el("header", { class: "p-head" },
      el("span", { class: "p-year-big", "aria-hidden": "true" }, p.sortDate.slice(0, 4)),
      el("h3", {}, p.name),
      el("p", { class: "p-place" }, p.years, " · ", p.place),
      el("span", { class: "p-verdict " + VERDICT_CLASS[p.verdict] }, key[p.verdict])
    ),

    el("div", { class: "p-main" },
      el("p", { class: "p-trigger" }, p.trigger),
      el("dl", { class: "p-rows" },
        row("Who", p.who),
        row("Asked for", p.demanded),
        row("What changed", p.changed, "p-changed"),
        row("In Parliament", p.parliament),
        row("The toll", p.toll),
        row("The other side", p.balance),
        row("Handle with care", p.caution, "p-caution")
      ),
      p.detail ? el("p", { class: "p-detail" }, p.detail) : null,
      el("p", { class: "p-sources" },
        p.ongoing && p.verifiedOn ? el("span", { class: "p-live-tag" }, "Still moving · checked " + p.verifiedOn) : null,
        p.crossLink ? el("a", { class: "p-cross", href: "#vote" }, "Vote on this one above ↑") : null,
        p.sources.map((s) => sourceLink(s.url, s.label))
      )
    ),

    el("div", { class: "p-side" }, img)
  );
}

export async function initTimeline() {
  const data = await loadJSON("data/protests.json");
  const body = document.getElementById("timeline-body");
  document.getElementById("street-lede").textContent = data.intro;
  document.getElementById("street-note").textContent = data.imageNote;

  const sorted = [...data.protests].sort((a, b) => a.sortDate.localeCompare(b.sortDate));
  body.append(...sorted.map((p, i) => card(p, data.verdictKey, i)));

  // Motion is a progressive enhancement: the cards are already readable above.
  try {
    const { reveal, reduced } = await import("./motion.js");
    reveal(".p-card", { y: 22, each: 0 });

    if (!reduced) {
      const { scroll } = await import("../vendor/motion.js");
      const fill = document.querySelector(".spine-fill");
      const track = document.getElementById("timeline");
      scroll((progress) => { fill.style.transform = `scaleY(${progress})`; },
        { target: track, offset: ["start 80%", "end 60%"] });

      // Gallery-style parallax: the photo drifts inside its frame as the card passes.
      document.querySelectorAll(".p-figure").forEach((fig) => {
        const img = fig.querySelector(".p-frame img");
        if (!img) return;
        img.style.willChange = "transform";
        scroll((progress) => {
          img.style.transform = `scale(1.14) translate3d(0, ${(progress - 0.5) * 8}%, 0)`;
        }, { target: fig, offset: ["start end", "end start"] });
      });
    }
  } catch {
    /* no motion — the timeline still reads top to bottom */
  }
}
