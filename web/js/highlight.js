// Marks the searched words inside result text.
// "prefix" mirrors the database search: each query word matches the start of a
// word ("vande" marks "Vande"). "phrase" mirrors the manifesto search: the
// whole query matches anywhere.

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The pattern's first group is the text before the word (start of string or a
// non-letter), so the mark covers only group 2. No lookbehind: Safari before
// 16.4 cannot parse it.
function pattern(q, mode) {
  const query = String(q ?? "").trim();
  if (mode === "phrase") {
    const parts = query.split(/\s+/).filter(Boolean).map(escape);
    return parts.length ? new RegExp(`()(${parts.join("\\s+")})`, "giu") : null;
  }
  const words = query.toLowerCase().split(/\s+/).map((w) => w.replace(/[^\p{L}\p{N}]/gu, "")).filter((w) => w.length >= 2);
  if (!words.length) return null;
  return new RegExp(`(^|[^\\p{L}\\p{N}])((?:${words.map(escape).join("|")})[\\p{L}\\p{N}]*)`, "giu");
}

export function splitMatches(text, q, { mode = "prefix" } = {}) {
  const s = String(text ?? "");
  if (!s) return [];
  const re = pattern(q, mode);
  if (!re) return [{ text: s, hit: false }];
  const out = [];
  let last = 0;
  for (const m of s.matchAll(re)) {
    if (!m[2]) continue;
    const at = m.index + m[1].length;
    if (at > last) out.push({ text: s.slice(last, at), hit: false });
    out.push({ text: m[2], hit: true });
    last = at + m[2].length;
  }
  if (last < s.length) out.push({ text: s.slice(last), hit: false });
  return out;
}

// Returns strings and <mark> elements, ready to pass as el() children.
export function highlight(text, q, opts) {
  if (!q) return text;
  return splitMatches(text, q, opts).map((seg) => {
    if (!seg.hit) return seg.text;
    const m = document.createElement("mark");
    m.className = "hit";
    m.textContent = seg.text;
    return m;
  });
}
