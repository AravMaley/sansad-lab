// Party list of the 18th Lok Sabha with display colours, shared by the dot
// field and the home page. Loaded once per page.
import { loadJSON } from "./util.js";

export const ALLIANCE_VAR = { NDA: "--nda", INDIA: "--india", OTH: "--oth" };
const TINTS = [100, 72, 52, 86, 62]; // cycled so neighbouring parties differ

// Canvas cannot read CSS color-mix(), so mix the alliance colour towards the
// page colour by hand.
function mixHex(base, paper, t) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [rgb(base), rgb(paper)];
  return "#" + a.map((v, i) => Math.round(v * t + b[i] * (1 - t)).toString(16).padStart(2, "0")).join("");
}

let cache;
export function loadParties() {
  cache ??= loadJSON("/data/lok-sabha-18.json").then((data) => {
    const css = getComputedStyle(document.documentElement);
    const paper = css.getPropertyValue("--paper").trim() || "#0e1a16";
    const ranks = {};
    ["NDA", "INDIA", "OTH"].forEach((a) => {
      data.parties.filter((p) => p.alliance === a).sort((x, y) => y.seats - x.seats)
        .forEach((p, i) => { ranks[p.short] = i; });
    });
    const parties = data.parties.map((p, idx) => {
      const tint = TINTS[ranks[p.short] % TINTS.length];
      const base = css.getPropertyValue(ALLIANCE_VAR[p.alliance]).trim() || "#8f9488";
      return { ...p, idx, hex: mixHex(base, paper, tint / 100) };
    });
    return { data, parties };
  });
  return cache;
}

// Match a party short name from sansad.in ("BJP", "AITC") to ours.
export function partyIndex(parties, short) {
  const k = (short ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return parties.find((p) => p.short.toUpperCase().replace(/[^A-Z0-9]/g, "") === k)?.idx ?? null;
}
