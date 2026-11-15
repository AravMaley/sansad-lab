import { test } from "node:test";
import assert from "node:assert/strict";
import { TOPICS, tagTopics } from "../../scripts/ingest/topics.js";

test("there are the 15 planned topics with labels and blurbs", () => {
  assert.deepEqual(TOPICS.map((t) => t.slug), [
    "education", "jobs", "farming", "health", "railways", "womens-safety", "environment",
    "roads", "internet", "water", "prices", "defence", "sport", "startups", "housing",
  ]);
  for (const t of TOPICS) {
    assert.match(t.slug, /^[a-z-]+$/);
    assert.ok(t.label && t.blurb);
  }
});

test("ministry route", () => {
  assert.deepEqual(tagTopics({ ministry: "RAILWAYS", subject: "Vande Bharat trains" }), ["railways"]);
  assert.ok(tagTopics({ ministry: "EDUCATION", subject: "NEET paper leak" }).includes("education"));
});

test("keyword route", () => {
  assert.ok(tagTopics({ ministry: "HOME AFFAIRS", subject: "Crimes against women in Delhi" }).includes("womens-safety"));
  assert.ok(tagTopics({ ministry: "FINANCE", subject: "Rise in inflation of food prices" }).includes("prices"));
});

test("no match gives an empty list and tags are unique", () => {
  assert.deepEqual(tagTopics({ ministry: "ATOMIC ENERGY", subject: "Nuclear power" }), []);
  const t = tagTopics({ ministry: "EDUCATION", subject: "School education and college exams" });
  assert.equal(new Set(t).size, t.length);
  assert.deepEqual(tagTopics({ ministry: null, subject: null }), []);
});
