// The Lok Sabha as a 3D chamber: one instanced mesh of tiered seats.
// Renders only when something changes (intro, scroll, pointer, highlight)
// and stops entirely while off-screen.
import * as THREE from "../vendor/three.js";

const R = 10;          // chamber radius in scene units
const TIER = 1.8;      // height gained from the front row to the back
const CAMS = {
  plan:  { pos: [0, 14, 12.5], look: [0, -2.2, -4.2] },
  seat:  { pos: [0, 3.2, 7.4],  look: [0, 1.2, -4.5] },
  doors: { pos: [0, 7.5, 17],   look: [0, 0.5, -3] },
};
const ease = (t) => 1 - Math.pow(1 - t, 3);
const lerp = (a, b, t) => a + (b - a) * t;

export function mountChamber(container, { seats, inner = 0.4, stage = "#0e1a16", accent = "#f28c28", onHover, onSelect }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(stage, 1);
  const canvas = renderer.domElement;
  canvas.className = "chamber-canvas";
  canvas.setAttribute("aria-hidden", "true");
  container.append(canvas);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(stage, 14, 34);
  const camera = new THREE.PerspectiveCamera(38, 2, 0.1, 100);

  scene.add(new THREE.HemisphereLight("#fff4e0", "#20342c", 2.2));
  const key = new THREE.DirectionalLight("#ffd9a8", 3);
  key.position.set(-8, 14, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#7fd1b4", 0.6);
  rim.position.set(9, 6, -12);
  scene.add(rim);

  // The well of the House and a faint ring at the Speaker's end.
  const floor = new THREE.Mesh(
    new THREE.RingGeometry(0.2, R * 1.12, 96, 1, 0, Math.PI),
    new THREE.MeshStandardMaterial({ color: new THREE.Color(stage).offsetHSL(0, 0, 0.04), roughness: 1, side: THREE.DoubleSide }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const well = new THREE.Mesh(
    new THREE.RingGeometry(R * inner * 0.86, R * inner * 0.9, 96, 1, 0, Math.PI),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
  );
  well.rotation.x = -Math.PI / 2;
  well.position.y = 0.01;
  scene.add(well);

  // Seats
  const geo = new THREE.BoxGeometry(0.36, 0.3, 0.34);
  geo.translate(0, 0.15, 0); // grow up from the floor
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.05 }), seats.length);
  scene.add(mesh);

  const base = seats.map((s) => {
    const tier = (s.r - inner) / (1 - inner);
    return {
      x: Math.cos(s.angle) * s.r * R,
      z: -Math.sin(s.angle) * s.r * R,
      y: tier * TIER,
      rotY: s.angle - Math.PI / 2,
      color: new THREE.Color(s.color),
      delay: (1 - s.angle / Math.PI) * 0.7 + tier * 0.15,
    };
  });
  const stageColor = new THREE.Color(stage);
  const accentColor = new THREE.Color(accent);
  const state = seats.map(() => ({ lift: 0, liftTo: 0, dim: 0, dimTo: 0, focus: 0, focusTo: 0 }));
  const dummy = new THREE.Object3D();
  const tmp = new THREE.Color();

  let intro = 0; // 0 → 1 over the opening wave
  function writeSeat(i) {
    const b = base[i];
    const s = state[i];
    const grow = Math.min(1, Math.max(0, (intro * 1.6 - b.delay) / 0.6));
    dummy.position.set(b.x, b.y + s.lift * 0.35, b.z);
    dummy.rotation.set(0, -b.rotY, 0);
    dummy.scale.set(1, Math.max(0.001, ease(grow)) * (1 + s.focus * 0.8), 1);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    tmp.copy(b.color).lerp(stageColor, s.dim * 0.78).lerp(accentColor, s.focus);
    mesh.setColorAt(i, tmp);
  }

  // Camera: a blend between presets, driven by scroll, plus pointer parallax.
  let from = CAMS.plan, to = CAMS.seat, blend = 0, blendTarget = 0;
  let px = 0, pxTarget = 0;
  let override = null; // { pos, look, t } when flying to a seat
  const look = new THREE.Vector3();
  function placeCamera() {
    const t = ease(blend);
    let pos = from.pos.map((v, k) => lerp(v, to.pos[k], t));
    let tgt = from.look.map((v, k) => lerp(v, to.look[k], t));
    if (override) {
      const o = ease(override.t);
      pos = pos.map((v, k) => lerp(v, override.pos[k], o));
      tgt = tgt.map((v, k) => lerp(v, override.look[k], o));
    }
    camera.position.set(pos[0] + px * 0.9, pos[1], pos[2]);
    camera.lookAt(look.set(...tgt));
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 560 ? 50 : 38;
    camera.updateProjectionMatrix();
    wake();
  }

  // Render loop that sleeps when nothing is moving.
  let raf = 0, visible = true, last = 0, firstFrame = true;
  function wake() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    let moving = false;

    if (intro < 1) { intro = Math.min(1, intro + dt / 1.6); moving = true; }
    const step = 1 - Math.pow(0.001, dt); // smooth approach
    if (Math.abs(blend - blendTarget) > 0.0005) { blend += (blendTarget - blend) * step; moving = true; }
    if (Math.abs(px - pxTarget) > 0.0005) { px += (pxTarget - px) * step * 0.6; moving = true; }
    if (override && override.t < 1) { override.t = Math.min(1, override.t + dt / 1.1); moving = true; }

    let seatsDirty = intro < 1 || firstFrame;
    state.forEach((s, i) => {
      let d = false;
      for (const k of ["lift", "dim", "focus"]) {
        const target = s[k + "To"];
        if (Math.abs(s[k] - target) > 0.002) { s[k] += (target - s[k]) * step; d = true; }
        else s[k] = target;
      }
      if (d || seatsDirty) { writeSeat(i); moving = true; }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    placeCamera();
    renderer.render(scene, camera);
    if (firstFrame) { firstFrame = false; container.dataset.chamber = "3d"; }
    if (moving) wake();
    else last = 0;
  }

  // Scroll: the further the chamber's section has scrolled, the lower the camera.
  const section = container.closest("section") ?? container;
  function onScroll() {
    const r = section.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height * 0.55)));
    if (Math.abs(p - blendTarget) > 0.001) { blendTarget = p; wake(); }
  }
  addEventListener("scroll", onScroll, { passive: true });

  // Pointer: parallax and hover picking.
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
    wake();
    if (e.pointerType !== "mouse") return;
    const i = pick(e);
    if (i !== hovered) { hovered = i; onHover?.(i < 0 ? null : i); }
  });
  canvas.addEventListener("pointerleave", () => { pxTarget = 0; wake(); if (hovered !== -1) { hovered = -1; onHover?.(null); } });
  canvas.addEventListener("click", (e) => { const i = pick(e); if (i >= 0) onSelect?.(i); });

  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); });
  io.observe(container);
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  onScroll();

  const matches = (filter, i) =>
    typeof filter === "function" ? filter(seats[i], i) : filter.has(seats[i].mpsno);

  return {
    canvas,
    // filter: Set of mpsno, or (seat, index) => boolean; null clears.
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
        override = {
          t: 0,
          pos: [b.x + (b.x / out) * 3.2, b.y + 3.4, b.z + (b.z / out) * 3.2 + 1.5],
          look: [b.x, b.y, b.z],
        };
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
      io.disconnect();
      ro.disconnect();
      geo.dispose();
      mesh.material.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
