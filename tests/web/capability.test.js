import { test } from "node:test";
import assert from "node:assert/strict";
import { use3D } from "../../web/js/capability.js";

test("3D only with WebGL, motion allowed and no save-data", () => {
  const ok = { webgl: true, reducedMotion: false, saveData: false };
  assert.equal(use3D(ok), true);
  assert.equal(use3D({ ...ok, webgl: false }), false);
  assert.equal(use3D({ ...ok, reducedMotion: true }), false);
  assert.equal(use3D({ ...ok, saveData: true }), false);
});
