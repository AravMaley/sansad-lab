// The Lok Sabha as a 3D chamber: stone terraces, and 543 seats that each cast
// a pool of party-coloured light. One canvas, a handful of draw calls, no
// post-processing. A slow drift keeps the room alive while it is on screen
// (capped at ~30 fps); it stops entirely off-screen or in a hidden tab.
import * as THREE from "../vendor/three.js";

const R = 10;          // chamber radius in scene units
const TIER = 1.9;      // height gained from the front row to the back
const ROWS = 12;
const CAMS = {
  plan: { pos: [0, 9.8, 14.6], look: [0, 0.2, -4.4] },
  seat: { pos: [0, 3.4, 8.2], look: [0, 1.4, -4.8] },
  doors: { pos: [0, 7.5, 17], look: [0, 0.5, -3] },
};
const ease = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

// Soft radial glow drawn once on a canvas: no image assets.
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function mountChamber(container, { seats, inner = 0.4, stage = "#0e1a16", accent = "#ffcf6e", onHover, onSelect }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.className = "chamber-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(stage, 16, 36);
  const camera = new THREE.PerspectiveCamera(36, 2, 0.1, 100);

  scene.add(new THREE.HemisphereLight("#e8f2ec", "#0a1612", 0.8));
  const key = new THREE.DirectionalLight("#fff1dc", 2.6);
  key.position.set(-6, 12, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#7fd1b4", 0.9);
  rim.position.set(8, 5, -14);
  scene.add(rim);

  // Terraces: a flat stone tread and a riser for every row.
  const stone = new THREE.MeshStandardMaterial({ color: "#16241f", roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
  const riserMat = new THREE.MeshStandardMaterial({ color: "#0b1411", roughness: 1, side: THREE.DoubleSide });
  const rowR = Array.from({ length: ROWS }, (_, i) => inner + ((1 - inner) * i) / (ROWS - 1));
  const half = ((1 - inner) / (ROWS - 1)) * R * 0.5;
  rowR.forEach((r, i) => {
    const y = (i / (ROWS - 1)) * TIER;
    const tread = new THREE.Mesh(new THREE.RingGeometry(r * R - half, r * R + half, 72, 1, 0, Math.PI), stone);
    tread.rotation.x = -Math.PI / 2;
    tread.position.y = y;
    scene.add(tread);
    const rise = i === 0 ? y + 0.02 : TIER / (ROWS - 1);
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(r * R - half, r * R - half, rise, 72, 1, true, Math.PI / 2, Math.PI), riserMat);
    riser.position.y = y - rise / 2;
    scene.add(riser);
  });

  // The well, with a faint 13-spoke half wheel where the Speaker sits.
  const wellR = rowR[0] * R - half;
  const well = new THREE.Mesh(new THREE.CircleGeometry(wellR, 72, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(stage).offsetHSL(0, 0, 0.02), roughness: 1, side: THREE.DoubleSide }));
  well.rotation.x = -Math.PI / 2;
  scene.add(well);
  const ring = new THREE.Mesh(new THREE.RingGeometry(wellR * 0.93, wellR * 0.96, 96, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.01;
  scene.add(ring);
  const spokes = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.02, wellR * 0.55),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.22, side: THREE.DoubleSide }), 13);
  const d0 = new THREE.Object3D();
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * Math.PI;
    d0.position.set(Math.cos(a) * wellR * 0.3, 0.012, -Math.sin(a) * wellR * 0.3);
    d0.rotation.set(-Math.PI / 2, 0, a - Math.PI / 2);
    d0.updateMatrix();
    spokes.setMatrixAt(k, d0.matrix);
  }
  scene.add(spokes);

  // Seats: glossy domes, and a pool of light under each.
  const seatGeo = new THREE.SphereGeometry(0.3, 18, 9, 0, Math.PI * 2, 0, Math.PI / 2);
  const mesh = new THREE.InstancedMesh(seatGeo, new THREE.MeshStandardMaterial({ roughness: 0.32, metalness: 0.08 }), seats.length);
  scene.add(mesh);
  const glowGeo = new THREE.PlaneGeometry(1, 1);
  glowGeo.rotateX(-Math.PI / 2);
  const glows = new THREE.InstancedMesh(glowGeo,
    new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }),
    seats.length);
  glows.renderOrder = 1;
  scene.add(glows);

  const base = seats.map((s) => {
    const tier = (s.r - inner) / (1 - inner);
    return {
      x: Math.cos(s.angle) * s.r * R,
      z: -Math.sin(s.angle) * s.r * R,
      y: (Math.round(tier * (ROWS - 1)) / (ROWS - 1)) * TIER,
      color: new THREE.Color(s.color),
      delay: (1 - s.angle / Math.PI) * 0.7 + tier * 0.15,
    };
  });
  const stageColor = new THREE.Color(stage);
  const accentColor = new THREE.Color(accent);
  const state = seats.map(() => ({ lift: 0, liftTo: 0, dim: 0, dimTo: 0, focus: 0, focusTo: 0 }));
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Color();

  let intro = 0, introStart = null;
  function writeSeat(i) {
    const b = base[i];
    const s = state[i];
    const grow = ease(Math.min(1, Math.max(0, (intro * 1.6 - b.delay) / 0.6)));
    const scale = Math.max(0.001, grow) * (1 + s.focus * 0.6 + s.lift * 0.15);
    dummy.position.set(b.x, b.y + s.lift * 0.18 + s.focus * 0.25, b.z);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(scale, scale * 0.85, scale);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    tmp.copy(b.color).lerp(stageColor, s.dim * 0.8).lerp(accentColor, s.focus);
    mesh.setColorAt(i, tmp);

    const g = Math.max(0.001, grow * (1.25 + s.lift * 0.8 + s.focus * 1.8) * (1 - s.dim * 0.85));
    dummy.position.set(b.x, b.y + 0.02, b.z);
    dummy.scale.set(g, 1, g);
    dummy.updateMatrix();
    glows.setMatrixAt(i, dummy.matrix);
    glows.setColorAt(i, tmp);
  }

  // Camera: scroll blends between presets; a slow orbit drift on top.
  let from = CAMS.plan, to = CAMS.seat, blend = 0, blendTarget = 0;
  let px = 0, pxTarget = 0, t = 0;
  let override = null;
  const look = new THREE.Vector3();
  function placeCamera() {
    const e = ease(blend);
    let pos = from.pos.map((v, k) => lerp(v, to.pos[k], e));
    let tgt = from.look.map((v, k) => lerp(v, to.look[k], e));
    if (override) {
      const o = ease(override.t);
      pos = pos.map((v, k) => lerp(v, override.pos[k], o));
      tgt = tgt.map((v, k) => lerp(v, override.look[k], o));
    }
    const drift = override ? 0 : Math.sin(t * 0.12) * 0.16 + px * 0.12;
    const dx = pos[0] - tgt[0], dz = pos[2] - tgt[2];
    const c = Math.cos(drift), s = Math.sin(drift);
    camera.position.set(tgt[0] + dx * c - dz * s, pos[1] + Math.sin(t * 0.2) * 0.12, tgt[2] + dx * s + dz * c);
    camera.lookAt(look.set(...tgt));
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 560 ? 52 : 36;
    camera.updateProjectionMatrix();
    wake();
  }

  let raf = 0, visible = true, last = 0, lastDraw = 0, firstFrame = true;
  function wake() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    t += dt;
    let busy = false;

    if (intro < 1) { introStart ??= now; intro = Math.min(1, (now - introStart) / 1400); busy = true; }
    const step = 1 - Math.pow(0.001, dt);
    if (Math.abs(blend - blendTarget) > 0.0005) { blend += (blendTarget - blend) * step; busy = true; }
    if (Math.abs(px - pxTarget) > 0.0005) { px += (pxTarget - px) * step * 0.6; busy = true; }
    if (override && override.t < 1) { override.t = Math.min(1, override.t + dt / 1.1); busy = true; }

    const all = intro < 1 || firstFrame;
    state.forEach((s, i) => {
      let d = false;
      for (const k of ["lift", "dim", "focus"]) {
        const target = s[k + "To"];
        if (Math.abs(s[k] - target) > 0.002) { s[k] += (target - s[k]) * step; d = true; } else s[k] = target;
      }
      if (d || all) { writeSeat(i); busy = true; }
    });
    mesh.instanceMatrix.needsUpdate = true;
    glows.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    if (glows.instanceColor) glows.instanceColor.needsUpdate = true;

    // Idle drift renders at ~30 fps; transitions render every frame.
    if (busy || now - lastDraw > 33) {
      placeCamera();
      renderer.render(scene, camera);
      lastDraw = now;
      if (firstFrame) { firstFrame = false; container.dataset.chamber = "3d"; }
    }
    wake();
  }

  const section = container.closest("section") ?? container;
  function onScroll() {
    const r = section.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.55)));
    if (Math.abs(p - blendTarget) > 0.001) { blendTarget = p; wake(); }
  }
  addEventListener("scroll", onScroll, { passive: true });
  const onVis = () => { last = 0; wake(); };
  document.addEventListener("visibilitychange", onVis);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = -1;
  function pick(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(mesh)[0];
    return hit ? hit.instanceId : -1;
  }
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pxTarget = ((e.clientX - r.left) / r.width) * 2 - 1;
    if (e.pointerType !== "mouse") return;
    const i = pick(e);
    if (i !== hovered) { hovered = i; onHover?.(i < 0 ? null : i); }
    canvas.style.cursor = i >= 0 ? "pointer" : "";
  });
  canvas.addEventListener("pointerleave", () => { pxTarget = 0; if (hovered !== -1) { hovered = -1; onHover?.(null); } });
  canvas.addEventListener("click", (e) => { const i = pick(e); if (i >= 0) onSelect?.(i); });

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) { last = 0; wake(); } });
  io.observe(container);
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  onScroll();

  const matches = (filter, i) => (typeof filter === "function" ? filter(seats[i], i) : filter.has(seats[i].mpsno));

  return {
    canvas,
    highlight(filter) {
      state.forEach((s, i) => {
        const on = filter ? matches(filter, i) : false;
        s.dimTo = filter && !on ? 1 : 0;
        s.liftTo = on ? 1 : 0;
      });
      wake();
    },
    focusSeat(mpsno) {
      const i = seats.findIndex((s) => s.mpsno === mpsno);
      state.forEach((s, k) => { s.focusTo = k === i ? 1 : 0; s.dimTo = i >= 0 && k !== i ? 0.6 : 0; s.liftTo = k === i ? 1 : 0; });
      if (i >= 0) {
        const b = base[i];
        const out = Math.hypot(b.x, b.z) || 1;
        override = { t: 0, pos: [b.x + (b.x / out) * 3.2, b.y + 3.4, b.z + (b.z / out) * 3.2 + 1.5], look: [b.x, b.y, b.z] };
      } else override = null;
      wake();
    },
    setCamera(name) {
      from = CAMS.plan;
      to = CAMS[name] ?? CAMS.seat;
      blendTarget = name === "plan" ? 0 : 1;
      override = null;
      wake();
    },
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
      io.disconnect();
      ro.disconnect();
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.map?.dispose(); o.material?.dispose(); });
      renderer.dispose();
      canvas.remove();
    },
  };
}
