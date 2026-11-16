import { fail } from "./util.js";
import "./site.js";

// Each page holds some of these sections. Each loads its own data, so one
// failure doesn't blank the page. Modules load only for sections present.
const sections = [
  ["crowd", () => import("./house.js").then((m) => m.initHouse())],
  ["findmp", () => import("./findmp.js").then((m) => m.initFindMP())],
  ["issues-body", () => import("./issues.js").then((m) => m.initIssues())],
  ["matcher", () => import("./matcher.js").then((m) => m.initMatcher())],
  ["bill", () => import("./mp.js").then((m) => m.initMP())],
  ["timeline-body", () => import("./timeline.js").then((m) => m.initTimeline())],
  ["ledger-body", () => import("./ledger.js").then((m) => m.initLedger())],
];

await Promise.all(sections
  .filter(([id]) => document.getElementById(id))
  .map(([id, init]) => init().catch((e) => fail(document.getElementById(id), e))));

try {
  const { reveal, countUpAll } = await import("./motion.js");
  reveal(".room .meta, .room > .wrap > .display, .room > .wrap > .lede");
  reveal(".facts div", { each: 0.07 });
  reveal(".panel, .door", { y: 18, each: 0.1 });
  reveal(".record", { each: 0.05 });
  countUpAll(".facts dt, .ab-labels strong, .record .big, .hbar .val");
} catch {
  /* Motion unavailable — the page works without it. */
}
