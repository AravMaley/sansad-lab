// Follow MPs and topics without an account. Follows live only in this
// browser's localStorage; nothing about the visitor is stored on a server.
import { el } from "./util.js";

const KEY = "sansad:follows";
const MAX = 50;
const EMPTY = () => ({ mps: [], topics: [], lastVisit: null });

export function safeLocalStorage() {
  try {
    const s = globalThis.localStorage;
    const probe = "sansad:probe";
    s.setItem(probe, "1");
    s.getItem(probe);
    return s;
  } catch {
    return null;
  }
}

export function createFollows(storage = safeLocalStorage()) {
  let available = Boolean(storage);
  let data = EMPTY();
  if (available) {
    try {
      const raw = storage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Array.isArray(parsed.mps) && Array.isArray(parsed.topics)) {
        data = { mps: parsed.mps.filter(Number.isInteger), topics: parsed.topics.filter((t) => typeof t === "string"), lastVisit: parsed.lastVisit ?? null };
      }
    } catch (e) {
      if (!(e instanceof SyntaxError)) available = false; // storage blocked; corrupt JSON just resets
    }
  }
  const save = () => {
    if (!available) return;
    try { storage.setItem(KEY, JSON.stringify(data)); } catch { /* quota or blocked */ }
  };
  const toggle = (list, key) => {
    if (!available) return;
    const i = data[list].indexOf(key);
    if (i >= 0) data[list].splice(i, 1);
    else if (data.mps.length + data.topics.length < MAX) data[list].push(key);
    save();
  };
  return {
    available,
    list: () => (available ? { mps: [...data.mps], topics: [...data.topics], lastVisit: data.lastVisit } : EMPTY()),
    toggleMp: (id) => toggle("mps", Number(id)),
    toggleTopic: (slug) => toggle("topics", String(slug)),
    isFollowing: (kind, key) => available && (kind === "mp" ? data.mps.includes(Number(key)) : data.topics.includes(String(key))),
    markVisited(nowIso) { if (available) { data.lastVisit = nowIso; save(); } },
  };
}

export function shareLinks({ url, text }) {
  return { whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` };
}

// A Follow toggle button, or null when follows are unavailable in this browser.
export function followButton(follows, kind, key, label) {
  if (!follows.available) return null;
  const btn = el("button", { class: "btn btn-follow", type: "button" });
  const paint = () => {
    const on = follows.isFollowing(kind, key);
    btn.setAttribute("aria-pressed", String(on));
    btn.textContent = on ? `Following ${label}` : `Follow ${label}`;
  };
  btn.addEventListener("click", () => {
    kind === "mp" ? follows.toggleMp(key) : follows.toggleTopic(key);
    paint();
  });
  paint();
  return btn;
}

export function shareButton({ url, text }) {
  return el("a", { class: "btn btn-quiet", href: shareLinks({ url, text }).whatsapp, target: "_blank", rel: "noopener" }, "Share on WhatsApp");
}
