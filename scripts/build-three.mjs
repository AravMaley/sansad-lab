// Bundles just the three.js classes the chamber uses into web/vendor/three.js,
// so the site stays build-free at deploy time.
//   node scripts/build-three.mjs
import { writeFile, unlink, mkdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "build", "three-entry.mjs");
const outfile = join(root, "web", "vendor", "three.js");

await mkdir(join(root, "build"), { recursive: true });
await writeFile(entry, `export {
  WebGLRenderer, Scene, PerspectiveCamera, InstancedMesh, BoxGeometry, CylinderGeometry,
  MeshStandardMaterial, MeshBasicMaterial, AmbientLight, DirectionalLight, HemisphereLight,
  Color, Object3D, Raycaster, Vector2, Vector3, Fog, Mesh, RingGeometry, DoubleSide, SRGBColorSpace,
} from "three";
`);

try {
  await build({ entryPoints: [entry], bundle: true, format: "esm", minify: true, target: "es2022", outfile, legalComments: "none" });
  const bytes = await readFile(outfile);
  console.log(`Wrote web/vendor/three.js (${(bytes.length / 1024).toFixed(0)} KB raw, ${(gzipSync(bytes).length / 1024).toFixed(0)} KB gzipped)`);
} finally {
  await unlink(entry).catch(() => {});
}
