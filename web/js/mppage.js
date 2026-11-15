// MP page: profile, questions by ministry, and the question feed.
import { el, fmtDate } from "./util.js";
import { api } from "./api.js";
import { feedItem } from "./feed.js";
import { emptyStateMessage, statusLabel, formatCount, totalLine, ministryLabel } from "./mpview.js";

const mpsno = Number(location.pathname.match(/\/mp\/(\d+)/)?.[1] ?? new URLSearchParams(location.search).get("id"));
const $ = (id) => document.getElementById(id);
const filters = { ministry: "", q: "" };
let page = 0;

function renderHead(member, total) {
  document.title = `${member.name} · Sansad Lab`;
  const label = statusLabel(member);
  $("mp-head").replaceChildren(
    member.photo_url ? el("img", { class: "mp-photo", src: member.photo_url, alt: "", width: 96, height: 96, loading: "lazy" }) : null,
    el("div", {},
      el("p", { class: "meta" }, `${member.constituency} · ${member.state}`),
      el("h1", { class: "display-sm" }, member.name),
      el("p", { class: "mp-sub" }, member.party ?? "", member.terms ? ` · ${member.terms === 1 ? "first term" : `${member.terms} terms`}` : "",
        label ? el("span", { class: "tag" }, label) : null),
      totalLine(total) ? el("p", { class: "mp-total" }, totalLine(total)) : null,
      el("p", { class: "mp-links" },
        el("a", { href: `/api/rss/mp/${mpsno}` }, "RSS feed"),
        // Follow and share buttons are added by follow.js when available.
        el("span", { id: "mp-actions" })),
    ),
  );
}

function renderCounts(counts) {
  const top = counts.slice(0, 8);
  const max = Math.max(1, ...top.map((c) => c.n));
  $("mp-counts").replaceChildren(
    top.length ? el("h2", { class: "meta" }, "Most asked about") : "",
    ...top.map((c) =>
      el("button", { class: "hbar-btn", type: "button", onclick: () => setMinistry(c.ministry) },
        el("span", { class: "hbar-label" }, ministryLabel(c.ministry)),
        el("span", { class: "hbar-track" }, el("span", { class: "hbar-fill", style: `width:${(c.n / max) * 100}%` })),
        el("span", { class: "hbar-n num" }, c.n))),
  );
}

function renderControls(counts) {
  const sel = el("select", { class: "select", "aria-label": "Filter by ministry", onchange: (e) => setMinistry(e.target.value) },
    el("option", { value: "" }, "All ministries"),
    counts.map((c) => el("option", { value: c.ministry ?? "", selected: c.ministry === filters.ministry }, ministryLabel(c.ministry))));
  const input = el("input", { class: "input", type: "search", placeholder: "Search this MP's questions", "aria-label": "Search this MP's questions", value: filters.q });
  let t;
  input.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { filters.q = input.value.trim(); load(true); }, 350); });
  $("mp-controls").replaceChildren(sel, input);
}

function setMinistry(m) {
  filters.ministry = m;
  const sel = $("mp-controls").querySelector("select");
  if (sel) sel.value = m;
  load(true);
}

async function load(reset = false) {
  if (reset) page = 0;
  const more = $("mp-more");
  more.replaceChildren(el("p", { class: "note" }, "Loading…"));
  try {
    const data = await api(`mp/${mpsno}`, { page, ministry: filters.ministry, q: filters.q });
    if (reset || page === 0) $("mp-feed").replaceChildren();
    if (page === 0 && !filters.ministry && !filters.q) {
      renderHead(data.member, data.total);
      renderCounts(data.counts);
      renderControls(data.counts);
      $("mp-foot").textContent = data.lastUpdated ? `Last updated ${fmtDate(data.lastUpdated.slice(0, 10))}. Excerpts are taken word for word from the official answers.` : "";
    }
    const empty = !filters.ministry && !filters.q ? emptyStateMessage(data.member, data.total) : null;
    if (empty) $("mp-feed").replaceChildren(el("li", { class: "empty" }, empty));
    else if (!data.items.length && page === 0) $("mp-feed").replaceChildren(el("li", { class: "empty" }, "No questions match. Try another ministry or search."));
    $("mp-feed").append(...data.items.map((i) => feedItem(i, { currentMp: mpsno })));
    const shown = $("mp-feed").querySelectorAll(".feed-item").length;
    more.replaceChildren(shown < data.total
      ? el("button", { class: "btn", type: "button", onclick: () => { page++; load(); } }, `Load more (${formatCount(data.total - shown)} left)`)
      : "");
    document.dispatchEvent(new CustomEvent("mp:loaded", { detail: data }));
  } catch (e) {
    more.replaceChildren();
    const msg = e.status === 404 ? "We couldn't find this MP." : "Data temporarily unavailable. Please try again later.";
    if (page === 0) $("mp-head").replaceChildren(el("p", { class: "empty" }, msg));
    else more.append(el("p", { class: "empty" }, msg));
  }
}

if (!Number.isInteger(mpsno) || mpsno <= 0) $("mp-head").replaceChildren(el("p", { class: "empty" }, "No MP chosen. ", el("a", { href: "/#yourmp" }, "Find your MP")));
else load(true);
