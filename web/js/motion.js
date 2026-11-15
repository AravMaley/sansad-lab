// Shared motion helpers. Everything here degrades to "just show the content"
// when prefers-reduced-motion is set or when Motion fails to load.
import { animate, inView, stagger } from "../vendor/motion.js";

export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

export const EASE = {
  out: [0.2, 0.7, 0.2, 1],
  soft: [0.33, 1, 0.68, 1],
};

/**
 * Reveal elements once, when they first scroll into view.
 * Elements start hidden via CSS (.will-reveal) so there's no flash of
 * un-animated content; we clear that class whatever happens.
 */
export function reveal(target, { y = 14, delay = 0, each = 0.06, amount = 0.2 } = {}) {
  const nodes = typeof target === "string" ? [...document.querySelectorAll(target)] : [target].flat();
  if (!nodes.length) return;

  const show = (n) => n.classList.remove("will-reveal");
  if (reduced) return nodes.forEach(show);

  nodes.forEach((n) => n.classList.add("will-reveal"));

  // Siblings that scroll in together get a staggered delay, so a row of cards
  // arrives in sequence rather than all at once.
  const indexAmongSiblings = (n) => [...(n.parentElement?.children ?? [])].indexOf(n);

  nodes.forEach((node) => {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      show(node);
      animate(
        node,
        { opacity: [0, 1], transform: [`translateY(${y}px)`, "none"] },
        { duration: 0.55, delay: delay + Math.min(indexAmongSiblings(node), 6) * each, ease: EASE.out }
      );
    };
    // Motion passes an IntersectionObserverEntry; we only need the trigger.
    inView(node, run, { amount });
    // Failsafe: never leave content invisible if inView doesn't fire.
    setTimeout(run, 2500 + delay * 1000);
  });
}

/**
 * Count up the first number inside a node when it scrolls into view, keeping
 * whatever surrounds it ("46%", "2 of 380") intact. The final frame restores
 * the original text exactly, so rounding can never alter a published figure.
 */
export function countUp(node, { duration = 1.1 } = {}) {
  if (reduced || !node) return;
  const final = node.textContent;
  const match = final.match(/\d[\d,]*/);
  if (!match) return;

  const to = Number(match[0].replace(/,/g, ""));
  if (!Number.isFinite(to) || to < 2) return;
  const [before, after] = [final.slice(0, match.index), final.slice(match.index + match[0].length)];

  inView(node, () => {
    const started = performance.now();
    const tick = (now) => {
      const t = Math.min((now - started) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = t < 1 ? before + Math.round(to * eased).toLocaleString("en-IN") + after : final;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { amount: 0.6 });
}

/** Count up every node matching a selector. */
export const countUpAll = (sel) => document.querySelectorAll(sel).forEach((n) => countUp(n));

/** A short attention pulse — used when a panel's contents change in place. */
export function pulse(node) {
  if (reduced || !node) return;
  animate(node, { opacity: [0.4, 1], transform: ["translateY(6px)", "none"] }, { duration: 0.4, ease: EASE.out });
}

export { animate, inView, stagger };
