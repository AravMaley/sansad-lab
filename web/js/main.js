import { fail } from "./util.js";
import { initHouse } from "./house.js";
import { initMatcher } from "./matcher.js";
import { initMP } from "./mp.js";
import { initLedger } from "./ledger.js";

// Each section loads its own data, so one failure doesn't blank the page.
initHouse().catch((e) => fail(document.getElementById("hemicycle"), e));
initMatcher().catch((e) => fail(document.getElementById("matcher"), e));
initMP().catch((e) => fail(document.getElementById("bill"), e));
initLedger().catch((e) => fail(document.getElementById("ledger-body"), e));

// Mark the nav link for the section in view.
const links = [...document.querySelectorAll(".bar nav a")];
const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    links.forEach((a) => a.setAttribute("aria-current", String(a.hash === "#" + entry.target.id)));
  }
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("main > section").forEach((s) => observer.observe(s));
