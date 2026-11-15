// Renders question feed items, shared by MP, topic and search pages.
import { el, fmtDate } from "./util.js";
import { highlight } from "./highlight.js";

const TYPE = { STARRED: "Oral", UNSTARRED: "Written" };

export function feedItem(item, { showAskers = true, currentMp = null, query = null } = {}) {
  const others = (item.askedBy ?? []).filter((a) => a.mpsno !== currentMp);
  return el("li", { class: "feed-item" },
    el("p", { class: "feed-meta mono" },
      fmtDate(item.date), " · ", (item.ministry ?? "unknown ministry").toLowerCase(), " · ", TYPE[item.type] ?? item.type ?? ""),
    el("h3", { class: "feed-subject" }, item.subject ? highlight(item.subject, query) : "Untitled question"),
    item.questionExcerpt ? el("p", { class: "feed-q" }, el("span", { class: "feed-label" }, "Asked"), highlight(item.questionExcerpt, query)) : null,
    item.answerExcerpt ? el("p", { class: "feed-a" }, el("span", { class: "feed-label" }, "Answer"), highlight(item.answerExcerpt, query)) : null,
    el("p", { class: "feed-foot" },
      showAskers && others.length
        ? el("span", {}, currentMp ? "Asked with " : "Asked by ",
            others.map((a, i) => [i ? ", " : "", el("a", { href: `/mp/${a.mpsno}` }, a.name)]), " · ")
        : null,
      item.pdfUrl || item.docUrl
        ? el("a", { href: item.pdfUrl || item.docUrl, target: "_blank", rel: "noopener" }, "Read the official answer ↗")
        : null),
  );
}
