// Decides whether to run the 3D chamber or keep the SVG one.

export function use3D({ webgl, reducedMotion, saveData }) {
  return Boolean(webgl && !reducedMotion && !saveData);
}

export function detect() {
  let webgl = false;
  try {
    const c = document.createElement("canvas");
    webgl = Boolean(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { /* no WebGL */ }
  return {
    webgl,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: Boolean(navigator.connection?.saveData),
  };
}
