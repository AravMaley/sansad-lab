import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { docxToText } from "../../scripts/ingest/docx.js";
import { buildExcerpts } from "../../scripts/ingest/excerpt.js";

const bytes = (n) => new Uint8Array(readFileSync(new URL(`../fixtures/${n}`, import.meta.url)));
const norm = (s) => s.replace(/\s+/g, " ").trim();
const words = (s) => s.split(/\s+/).filter(Boolean).length;

test("docxToText returns null for a file that is not a zip", () => {
  assert.equal(docxToText(bytes("not-a-zip.doc")), null);
});

test("starred answer laid on the table takes the statement", () => {
  const text = docxToText(bytes("starred-statement.docx"));
  const e = buildExcerpts(text);
  assert.match(e.questionExcerpt, /^\(a\) the current status of mineral exploration/);
  assert.doesNotMatch(e.questionExcerpt, /Will the Minister/i);
  assert.ok(e.answerExcerpt && e.answerExcerpt.length > 0);
  assert.doesNotMatch(e.answerExcerpt, /statement is laid on the table/i);
  assert.doesNotMatch(e.answerExcerpt, /THE STATEMENT REFERRED TO/);
});

test("unstarred answer given inline is excerpted", () => {
  const e = buildExcerpts(docxToText(bytes("unstarred-direct.docx")));
  assert.match(e.questionExcerpt, /^\(a\) the major initiatives/);
  assert.match(e.answerExcerpt, /^\(a\) to \(e\):\s?As of June 2026/);
  assert.doesNotMatch(e.answerExcerpt, /PEMMASANI/);
});

test("excerpts are short and verbatim", () => {
  for (const f of ["starred-statement.docx", "unstarred-direct.docx"]) {
    const text = docxToText(bytes(f));
    const e = buildExcerpts(text);
    for (const ex of [e.questionExcerpt, e.answerExcerpt]) {
      assert.ok(words(ex) <= 61, `${f}: ${words(ex)} words`);
      assert.ok(norm(text).includes(norm(ex.replace(/…$/, ""))), `${f}: not verbatim: ${ex}`);
    }
    assert.ok(e.questionText.length >= e.questionExcerpt.replace(/…$/, "").length);
  }
});

test("empty or unrecognised text gives all nulls", () => {
  const empty = { questionText: null, answerText: null, questionExcerpt: null, answerExcerpt: null };
  assert.deepEqual(buildExcerpts(""), empty);
  assert.deepEqual(buildExcerpts(null), empty);
});
