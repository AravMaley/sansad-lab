import { test } from "node:test";
import assert from "node:assert/strict";
import { totalLine, ministryLabel } from "../../web/js/mpview.js";
import { fmtDate } from "../../web/js/util.js";
import { apiUrl } from "../../web/js/api.js";

test("totalLine never headlines zero questions", () => {
  assert.equal(totalLine(0), null);
  assert.equal(totalLine(1), "1 question asked in the 18th Lok Sabha");
  assert.equal(totalLine(1234), "1,234 questions asked in the 18th Lok Sabha");
});

test("apiUrl keeps query params on browsers without URLSearchParams.size", () => {
  const d = Object.getOwnPropertyDescriptor(URLSearchParams.prototype, "size");
  Object.defineProperty(URLSearchParams.prototype, "size", { get: () => undefined, configurable: true });
  try {
    assert.equal(apiUrl("search", { q: "neet", page: 0, empty: "", gone: null }), "/api/search?q=neet&page=0");
    assert.equal(apiUrl("members", {}), "/api/members");
  } finally {
    Object.defineProperty(URLSearchParams.prototype, "size", d);
  }
});

test("fmtDate tolerates missing or malformed dates", () => {
  assert.equal(fmtDate(null), "");
  assert.equal(fmtDate("not-a-date"), "");
  assert.match(fmtDate("2026-08-12"), /2026/);
});

test("ministryLabel tolerates a missing ministry", () => {
  assert.equal(ministryLabel(null), "unknown ministry");
  assert.equal(ministryLabel("RAILWAYS"), "railways");
});
