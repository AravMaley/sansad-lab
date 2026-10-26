// Bundles laws/*.json (source of truth) into web/data/bills.json for the site.
// Run: node scripts/build-data.mjs
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lawsDir = join(root, "laws");
const outFile = join(root, "web", "data", "bills.json");

const REQUIRED = ["id", "title", "year", "summary", "votes", "arguments_for", "arguments_against", "timeline", "status", "reflection"];
const CHOICES = ["aye", "no", "committee", "abstain"];

function validate(bill, file) {
  const errors = [];
  for (const key of REQUIRED) if (bill[key] === undefined) errors.push(`missing "${key}"`);
  for (const v of bill.votes ?? []) {
    if (!v.source) errors.push(`vote in ${v.house} has no source`);
    if (v.method === "division" && (typeof v.ayes !== "number" || typeof v.noes !== "number")) {
      errors.push(`division in ${v.house} needs numeric ayes/noes`);
    }
  }
  for (const list of ["arguments_for", "arguments_against", "timeline"]) {
    (bill[list] ?? []).forEach((item, i) => { if (!item.source) errors.push(`${list}[${i}] has no source`); });
  }
  for (const c of CHOICES) if (!bill.reflection?.[c]) errors.push(`reflection.${c} missing`);
  if (errors.length) throw new Error(`${file}:\n  - ${errors.join("\n  - ")}`);
}

const files = (await readdir(lawsDir)).filter((f) => f.endsWith(".json"));
const bills = [];
for (const file of files) {
  const bill = JSON.parse(await readFile(join(lawsDir, file), "utf8"));
  validate(bill, file);
  bills.push(bill);
}
bills.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

await writeFile(outFile, JSON.stringify({ bills }, null, 2) + "\n");
console.log(`Wrote ${bills.length} bills to web/data/bills.json`);
