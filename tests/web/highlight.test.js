import { test } from "node:test";
import assert from "node:assert/strict";
import { splitMatches } from "../../web/js/highlight.js";

const hits = (segs) => segs.filter((s) => s.hit).map((s) => s.text);

test("prefix mode marks whole words that start with each search word", () => {
  const segs = splitMatches("Vande Bharat trains and the vandalism report", "vande");
  assert.deepEqual(hits(segs), ["Vande"]);
  assert.equal(segs.map((s) => s.text).join(""), "Vande Bharat trains and the vandalism report");
});

test("prefix mode extends the mark to the end of the word, any case", () => {
  assert.deepEqual(hits(splitMatches("NEET-UG and neet results", "neet")), ["NEET", "neet"]);
  assert.deepEqual(hits(splitMatches("Railways railway rail", "railw")), ["Railways", "railway"]);
});

test("prefix mode handles several words and ignores punctuation in the query", () => {
  assert.deepEqual(hits(splitMatches("Flood relief for flooded districts", "flood, relief!")), ["Flood", "relief", "flooded"]);
});

test("phrase mode marks the phrase anywhere, matching the manifesto search", () => {
  assert.deepEqual(hits(splitMatches("Minimum support price (MSP) and msp law", "msp", { mode: "phrase" })), ["MSP", "msp"]);
  assert.deepEqual(hits(splitMatches("caste census now", "caste cen", { mode: "phrase" })), ["caste cen"]);
});

test("empty or symbol-only query, or empty text, returns the text unmarked", () => {
  assert.deepEqual(splitMatches("Some text", ""), [{ text: "Some text", hit: false }]);
  assert.deepEqual(splitMatches("Some text", "  ?? "), [{ text: "Some text", hit: false }]);
  assert.deepEqual(splitMatches("", "x"), []);
  assert.deepEqual(splitMatches(null, "x"), []);
});

test("regex characters in a phrase query are treated literally", () => {
  assert.deepEqual(hits(splitMatches("a (b) c", "(b)", { mode: "phrase" })), ["(b)"]);
});
