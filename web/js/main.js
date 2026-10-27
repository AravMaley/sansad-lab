import { fail } from "./util.js";
import { initHouse } from "./house.js";
import { initMatcher } from "./matcher.js";
import { initMP } from "./mp.js";
import { initLedger } from "./ledger.js";

// Each section loads its own data, so one failure doesn't blank the page.
// Motion is optional: if it fails to load, content is already visible.
const sections = [
  [initHouse, "hemicycle"],
  [initMatcher, "matcher"],
  [initMP, "bill"],
  [initLedger, "ledger-body"],
];

await Promise.all(sections.map(([init, id]) =>
  init().catch((e) => fail(document.getElementById(id), e))
));

try {
  const { reveal, countUpAll } = await import("./motion.js");
  reveal(".room .meta, .room > .wrap > .display, .room > .wrap > .lede");
  reveal(".facts div", { each: 0.07 });
  reveal(".panel", { y: 18, each: 0.1 });
  reveal(".record", { each: 0.05 });
  countUpAll(".facts dt, .ab-labels strong, .record .big, .hbar .val");
} catch {
  /* Motion unavailable — the page works without it. */
}

// Mark the nav link for the section in view.
const links = [...document.querySelectorAll(".bar nav a")];
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    links.forEach((a) => a.setAttribute("aria-current", String(a.hash === "#" + entry.target.id)));
  }
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main > section").forEach((s) => observer.observe(s));
