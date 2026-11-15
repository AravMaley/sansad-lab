// Bundles just the Motion functions the site uses into web/vendor/motion.js,
// so the site stays build-free at deploy time. Run after changing the import list.
//   node scripts/build-motion.mjs
//
// `animate` comes from motion/mini (WAAPI-backed, much smaller); the scroll and
// stagger helpers only exist in the full package. Together they tree-shake to
// roughly 18 KB raw / 8 KB gzipped, against 77 KB / 28 KB for the full import.
import { writeFile, unlink, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const entry = join(root, "build", "motion-entry.mjs");
const outfile = join(root, "web", "vendor", "motion.js");

await mkdir(join(root, "build"), { recursive: true });
await mkdir(join(root, "web", "vendor"), { recursive: true });
await writeFile(entry, [
  'export { animate } from "motion/mini";',
  'export { scroll, inView, stagger } from "motion";',
  "",
].join("\n"));

try {
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: "esm",
    minify: true,
    target: "es2022",
    outfile,
    legalComments: "none",
    metafile: true,
  });
  const bytes = Object.values(result.metafile.outputs)[0].bytes;
  console.log(`Wrote web/vendor/motion.js (${(bytes / 1024).toFixed(1)} KB raw)`);
} finally {
  await unlink(entry).catch(() => {});
}
