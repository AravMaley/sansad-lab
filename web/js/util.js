export async function loadJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Couldn’t load ${path} (${res.status})`);
  return res.json();
}

// el("p", { class: "note" }, "text", childNode, ...)
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "style") node.style.cssText = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  node.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

const SVG_NS = "http://www.w3.org/2000/svg";
export function svg(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
export const fmtDate = (iso) => dateFmt.format(new Date(iso + "T00:00:00"));

export function sourceLink(url, label = "Source") {
  return el("a", { class: "src", href: url, target: "_blank", rel: "noopener" }, label + " ↗");
}

// Per-viewer memory (quiz answers, votes). Never required for the page to work.
export const store = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem("sansad:" + key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem("sansad:" + key, JSON.stringify(value)); } catch { /* private mode */ }
  },
};

export function fail(container, err) {
  container.replaceChildren(el("p", { class: "error" }, err.message));
}
