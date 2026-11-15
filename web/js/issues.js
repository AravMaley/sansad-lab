// Home page "Issues" room: topic cards, search across all questions,
// "since your last visit" for followed MPs and topics, and the next session.
import { el, fmtDate } from "./util.js";
import { api } from "./api.js";
import { feedItem } from "./feed.js";
import { TOPICS } from "./topics-data.js";
import { createFollows } from "./follow.js";
import { formatCount } from "./mpview.js";

export async function initIssues() {
  const root = document.getElementById("issues-body");
  const follows = createFollows();

  // Topic cards
  const grid = el("div", { class: "topic-grid" },
    TOPICS.map((t) => el("a", { class: "topic-card", href: `/topic/${t.slug}` },
      el("span", { class: "topic-label" }, t.label), el("span", { class: "topic-blurb" }, t.blurb))));

  // Search
  const input = el("input", { class: "input", type: "search", placeholder: "Search every question, e.g. NEET, flood relief, Vande Bharat", "aria-label": "Search questions" });
  const results = el("ol", { class: "feed" });
  const status = el("p", { class: "note", "aria-live": "polite" });
  const form = el("form", { class: "search-row", role: "search", onsubmit: async (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q.length < 2) { status.textContent = "Type at least 2 characters."; return; }
    status.textContent = "Searching…";
    try {
      const d = await api("search", { q });
      status.textContent = d.total ? `${formatCount(d.total)} questions mention “${q}”. Showing the newest.` : `No questions mention “${q}”.`;
      results.replaceChildren(...d.items.slice(0, 10).map((i) => feedItem(i)));
    } catch { status.textContent = "Search is temporarily unavailable."; }
  } }, input, el("button", { class: "btn btn-primary", type: "submit" }, "Search"));

  const since = el("div", { id: "since", class: "since" });
  const next = el("div", { class: "next-session" });
  root.replaceChildren(since, grid, el("h3", { class: "search-title" }, "Search Parliament"), form, status, results, next);

  // Since your last visit (only if this browser follows something)
  const f = follows.list();
  if (f.mps.length || f.topics.length) {
    const t = f.lastVisit ?? new Date(Date.now() - 7 * 864e5).toISOString();
    try {
      const d = await api("since", { mp: f.mps.join(","), topic: f.topics.join(","), t });
      const label = (s) => TOPICS.find((x) => x.slug === s)?.label ?? s;
      const rows = [
        ...f.mps.map((id) => ({ href: `/mp/${id}`, text: `Your followed MP #${id}`, n: d.mp[id] ?? 0 })),
        ...f.topics.map((s) => ({ href: `/topic/${s}`, text: label(s), n: d.topic[s] ?? 0 })),
      ];
      since.replaceChildren(el("h3", { class: "meta" }, f.lastVisit ? `Since your last visit, ${fmtDate(f.lastVisit.slice(0, 10))}` : "Your follows, last 7 days"),
        el("ul", { class: "since-list" }, rows.map((r) => el("li", {}, el("a", { href: r.href }, r.text), el("span", { class: `since-n${r.n ? " is-new" : ""}` }, r.n ? `${r.n} new` : "nothing new")))));
    } catch { /* the strip is optional */ }
  }
  follows.markVisited(new Date().toISOString());

  // Next session and calendar download
  try {
    const { next: s } = await api("sessions");
    if (s) {
      const live = s.start_date <= new Date().toISOString().slice(0, 10);
      next.replaceChildren(el("p", { class: "meta" }, live ? "Parliament is sitting" : "Next session"),
        el("p", { class: "next-dates" }, `${fmtDate(s.start_date)} – ${fmtDate(s.end_date ?? s.start_date)}`),
        el("a", { class: "btn", href: "/api/calendar.ics" }, "Add to calendar"));
    }
  } catch { /* optional */ }
}
