// Topic page: recent questions on one issue across all MPs.
import { el, fmtDate } from "./util.js";
import { api } from "./api.js";
import { feedItem } from "./feed.js";
import { formatCount } from "./mpview.js";
import { createFollows, followButton, shareButton } from "./follow.js";
import { downloadShareCard } from "./sharecard.js";
import { dotsReady } from "./site.js";
import { loadParties, partyIndex } from "./parties.js";

// Light the parties raising this issue in the dot field.
async function lightDots(rows) {
  const [dots, { parties }] = await Promise.all([dotsReady, loadParties()]);
  if (!dots || !rows.length) return;
  const lit = new Set(rows.slice(0, 6).map((r) => partyIndex(parties, r.name)).filter((i) => i !== null));
  if (lit.size) dots.highlight((i) => (lit.has(dots.owners[i]) ? 1 : 0));
}

const slug = location.pathname.match(/\/topic\/([a-z-]+)/)?.[1] ?? new URLSearchParams(location.search).get("slug");
const $ = (id) => document.getElementById(id);
const follows = createFollows();
let page = 0;

function bars(title, rows) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return el("div", { class: "t-bars" }, el("h2", { class: "meta" }, title),
    rows.slice(0, 6).map((r) => el("div", { class: "hbar-btn" },
      el("span", { class: "hbar-label" }, r.name ?? "Unknown"),
      el("span", { class: "hbar-track" }, el("span", { class: "hbar-fill", style: `width:${(r.n / max) * 100}%` })),
      el("span", { class: "hbar-n num" }, r.n))));
}

async function load() {
  $("t-more").replaceChildren(el("p", { class: "note" }, "Loading…"));
  try {
    const d = await api(`topic/${slug}`, { page });
    if (page === 0) {
      document.title = `${d.topic.label} · Sansad Lab`;
      const url = `${location.origin}/topic/${d.topic.slug}`;
      $("t-head").replaceChildren(
        el("p", { class: "meta" }, "Issue"),
        el("h1", { class: "display-sm" }, d.topic.label),
        el("p", { class: "lede" }, d.topic.blurb),
        el("p", { class: "mp-total" }, el("strong", { class: "num" }, formatCount(d.total)), " questions in the 18th Lok Sabha"),
        el("p", { class: "mp-links" },
          followButton(follows, "topic", d.topic.slug, "this issue") ?? "",
          shareButton({ url, text: `What Parliament is asking about ${d.topic.label.toLowerCase()}:` }),
          el("button", { class: "btn btn-quiet", type: "button", onclick: () => downloadShareCard({
            kicker: "In Parliament", title: d.topic.label, items: d.items.slice(0, 3).map((i) => i.subject), filename: `sansad-lab-${d.topic.slug}.png` }) }, "Save share card"),
          el("a", { href: `/api/rss/topic/${d.topic.slug}` }, "RSS feed")));
      lightDots(d.breakdown.parties).catch(() => {});
      $("t-breakdown").replaceChildren(
        d.breakdown.states.length ? bars("States raising it most", d.breakdown.states) : "",
        d.breakdown.parties.length ? bars("Parties raising it most", d.breakdown.parties) : "");
      $("t-feed").replaceChildren(d.total ? "" : el("li", { class: "empty" }, "No questions on this issue yet. Sansad Lab is a working prototype; our data may not have caught up."));
      $("t-foot").textContent = d.lastUpdated ? `Last updated ${fmtDate(d.lastUpdated.slice(0, 10))}. Topics are tagged automatically by ministry and keywords; see the methodology.` : "";
    }
    $("t-feed").append(...d.items.map((i) => feedItem(i)));
    const shown = $("t-feed").querySelectorAll(".feed-item").length;
    $("t-more").replaceChildren(shown < d.total
      ? el("button", { class: "btn", type: "button", onclick: () => { page++; load(); } }, `Load more (${formatCount(d.total - shown)} left)`) : "");
  } catch (e) {
    $("t-more").replaceChildren();
    $("t-head").replaceChildren(el("p", { class: "empty" }, e.status === 404 ? "We couldn't find this issue." : "Data temporarily unavailable. Please try again later."));
  }
}

if (!slug) $("t-head").replaceChildren(el("p", { class: "empty" }, "No issue chosen. ", el("a", { href: "/issues" }, "See all issues")));
else load();
