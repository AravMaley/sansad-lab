import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const WEB = new URL("../../web/", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const pages = readdirSync(WEB).filter((f) => f.endsWith(".html"));
const policy = () => {
  const cfg = JSON.parse(readFileSync(join(WEB, "vercel.json"), "utf8"));
  return cfg.headers.flatMap((h) => h.headers).find((h) => h.key === "Content-Security-Policy").value;
};

test("the content policy forbids inline scripts", () => {
  const script = policy().split(";").map((s) => s.trim()).find((s) => s.startsWith("script-src"));
  assert.ok(script && !script.includes("unsafe-inline"), script);
});

test("no page contains an inline script, which the policy would block", () => {
  for (const f of pages) {
    const html = readFileSync(join(WEB, f), "utf8");
    for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      assert.match(m[1], /\bsrc=/, `${f} has an inline <script>`);
      assert.equal(m[2].trim(), "", `${f} has a <script src> with inline code`);
    }
    assert.ok(!/\son(click|load|error|submit|change|input)=/i.test(html), `${f} has an inline event handler`);
  }
});

test("every script a page loads exists", () => {
  for (const f of pages) {
    const html = readFileSync(join(WEB, f), "utf8");
    for (const m of html.matchAll(/<script\b[^>]*\bsrc="(\/[^"]+)"/gi)) {
      assert.ok(existsSync(join(WEB, m[1])), `${f} loads missing ${m[1]}`);
    }
  }
});
