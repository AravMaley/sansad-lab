// The dot field: one canvas behind every page, one dot per Lok Sabha seat,
// coloured by party. On the home page the dots gather into "the crowd"
// (one cluster per alliance); everywhere else they rest as a quiet field
// that drifts with scroll and parts around the pointer. Pages can light up
// dots: an MP's page lights their party, an issue page the parties asking.
import { crowdLayout, fieldLayout } from "./dots-layout.js";

const FRAME = 1000 / 30;          // 30 fps cap
const REPEL = 90;                 // px around the pointer
const motionOK = () => !matchMedia("(prefers-reduced-motion: reduce)").matches;

export function mountDots({ parties, owners }) {
  const canvas = document.createElement("canvas");
  canvas.className = "dots";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const n = owners.length;
  const color = owners.map((o) => parties[o].hex);
  const dots = Array.from({ length: n }, () => ({ x: 0, y: 0, a: 0, s: 1 }));

  let W = 0, H = 0, dpr = 1;
  let field = [], crowdLocal = null, crowdR = 4, crowdEl = null, onLayout = null;
  let level = null;                 // (i) => 0 | 1 | 2, or null for no highlight
  let pointer = null, wakeUntil = 0, modeChangedAt = 0, lastMode = "", last = 0, raf = 0;
  const animate = motionOK();

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const prevW = W, prevH = H;
    W = innerWidth; H = innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    // Size the canvas in px to match what we draw: 100vh on phones is taller
    // than innerHeight while the browser toolbar shows, which stretched dots.
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    // A phone toolbar showing or hiding only nudges the height; keep the
    // background field still instead of sliding every dot.
    if (!field.length || W !== prevW || Math.abs(H - prevH) > 120) field = fieldLayout(n, W, H + 160);
    if (crowdEl) {
      const r = crowdEl.getBoundingClientRect();
      const out = crowdLayout(parties, owners, { x: 0, y: 0, w: r.width, h: r.height });
      crowdLocal = out.points; crowdR = Math.min(7, out.r * 0.82);
      onLayout?.(out.groups);
    }
    wake();
  }

  function crowdRect() {
    if (!crowdEl) return null;
    const r = crowdEl.getBoundingClientRect();
    return r.bottom > H * 0.3 && r.top < H * 0.8 ? r : null;  // gathered only while in view
  }

  function frame() {
    raf = 0;
    const now = performance.now();
    if (document.hidden) return;
    if (now - last < FRAME && animate) { raf = requestAnimationFrame(frame); return; }
    last = now;
    const rect = crowdRect();
    const mode = rect ? "crowd" : "field";
    if (mode !== lastMode) { lastMode = mode; modeChangedAt = now; wakeUntil = now + 2600; }
    const t = now / 1000;
    const drift = animate ? (scrollY * 0.12) % (H + 40) : 0;
    let moving = false;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < n; i++) {
      const d = dots[i];
      let tx, ty, ta, ts;
      const lv = level ? level(i) : -1;
      if (rect) {
        const p = crowdLocal[i];
        const shimmer = animate ? Math.sin(t * 1.4 + i * 0.7) * crowdR * 0.12 : 0;
        tx = rect.left + p.x + shimmer; ty = rect.top + p.y - shimmer;
        ta = lv === -1 ? 0.95 : lv === 0 ? 0.16 : 1;
        ts = crowdR * (lv === 2 ? 1.6 : 1);
      } else {
        const p = field[i];
        tx = p.x + (animate ? Math.sin(t * 0.35 + i) * 5 : 0);
        ty = ((p.y - drift + H + 40) % (H + 40)) - 20;
        ta = lv === -1 ? 0.4 : lv === 0 ? 0.12 : lv === 1 ? 0.75 : 1;
        ts = (W < 640 ? 1.8 : 2.4) * (lv === 2 ? 3 : lv === 1 ? 1.35 : 1);
      }
      if (pointer && animate) {
        const dx = tx - pointer.x, dy = ty - pointer.y, dist = Math.hypot(dx, dy);
        if (dist < REPEL && dist > 0.01) {
          const push = (1 - dist / REPEL) ** 2 * (rect ? 14 : 30);
          tx += (dx / dist) * push; ty += (dy / dist) * push;
        }
      }
      if (!animate || !lastMode) { d.x = tx; d.y = ty; d.a = ta; d.s = ts; }
      else {
        // Staggered wave: later dots start moving a little later after a mode change.
        const k = now - modeChangedAt < i * 1.2 ? 0 : 0.14;
        // A dot wrapping round the screen edge jumps instead of sliding across.
        if (Math.abs(ty - d.y) > H * 0.6 && !rect) d.y = ty;
        d.x += (tx - d.x) * k; d.y += (ty - d.y) * k;
        d.a += (ta - d.a) * 0.18; d.s += (ts - d.s) * 0.18;
        if (Math.abs(tx - d.x) + Math.abs(ty - d.y) > 0.3 || Math.abs(ta - d.a) > 0.01) moving = true;
      }
      if (d.y < -10 || d.y > H + 10) continue;
      ctx.globalAlpha = d.a;
      ctx.fillStyle = color[i];
      ctx.beginPath(); ctx.arc(d.x, d.y, d.s, 0, Math.PI * 2); ctx.fill();
      if (lv === 2) {
        ctx.globalAlpha = 0.18;
        ctx.beginPath(); ctx.arc(d.x, d.y, d.s * 3.2, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // Keep drawing while anything moves, while the crowd is in view (it
    // shimmers), or briefly after scroll/pointer input. Otherwise rest.
    if (animate && (moving || rect || now < wakeUntil)) raf = requestAnimationFrame(frame);
  }

  function wake(ms = 1200) {
    wakeUntil = Math.max(wakeUntil, performance.now() + ms);
    if (!raf) raf = requestAnimationFrame(frame);
  }

  addEventListener("resize", resize);
  addEventListener("scroll", () => wake(), { passive: true });
  document.addEventListener("visibilitychange", () => wake());
  if (matchMedia("(hover: hover)").matches) {
    addEventListener("pointermove", (e) => { pointer = { x: e.clientX, y: e.clientY }; wake(); }, { passive: true });
    document.documentElement.addEventListener("pointerleave", () => { pointer = null; wake(); });
  }
  resize();
  // Start scattered across the screen, so the home page opens with the
  // dots gathering into the crowd.
  dots.forEach((d, i) => { d.x = field[i].x; d.y = field[i].y - 20; });

  return {
    // Gather the dots into the crowd inside this element (home page).
    crowd(elm, cb) { crowdEl = elm; onLayout = cb; resize(); },
    // level(i) → 0 dim, 1 lit, 2 spotlight; null clears.
    highlight(fn) { level = fn; wake(); },
    // The dot under a viewport point, in crowd mode only.
    pick(x, y) {
      const rect = crowdRect();
      if (!rect) return null;
      let best = null, bestD = Math.max(10, crowdR * 2.2);
      for (let i = 0; i < n; i++) {
        const dist = Math.hypot(dots[i].x - x, dots[i].y - y);
        if (dist < bestD) { bestD = dist; best = i; }
      }
      return best;
    },
    owners,
  };
}
