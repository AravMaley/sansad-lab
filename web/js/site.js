// Runs on every page: marks the current menu item and mounts the dot field.
// Pages that want to light up dots import `dotsReady`.
import { loadParties } from "./parties.js";
import { dotOwners } from "./dots-layout.js";

const here = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
for (const a of document.querySelectorAll(".bar nav a")) {
  const href = a.getAttribute("href");
  const match = href === here || (href === "/mps" && here.startsWith("/mp/")) || (href === "/issues" && here.startsWith("/topic"));
  if (match) a.setAttribute("aria-current", "page");
}

export const dotsReady = (async () => {
  if (!document.createElement("canvas").getContext) return null;
  const { parties } = await loadParties();
  const { mountDots } = await import("./dotfield.js");
  return mountDots({ parties, owners: dotOwners(parties) });
})().catch((e) => { console.warn("Dot field unavailable", e); return null; });
