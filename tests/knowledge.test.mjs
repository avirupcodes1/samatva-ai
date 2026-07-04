// Tests for the RAG retrieval layer (lexical BM25-lite over the curated KB).
import { test } from "node:test";
import assert from "node:assert/strict";
import { retrieve, groundingBlock, KNOWLEDGE } from "../src/lib/knowledge.ts";

test("retrieve: a sleep query surfaces a sleep-related snippet", () => {
  const ids = retrieve("I can't sleep the night before my exam").map((s) => s.id);
  assert.ok(
    ids.some((id) => ["sleep", "night-worry", "breath-478"].includes(id)),
    `got: ${ids.join(", ")}`,
  );
});

test("retrieve: comparison query surfaces the comparison snippet", () => {
  const ids = retrieve("I keep comparing myself to the toppers in my batch").map((s) => s.id);
  assert.ok(ids.includes("comparison") || ids.includes("social-media"), ids.join(", "));
});

test("retrieve: mock-result query surfaces the mock snippet", () => {
  const ids = retrieve("I got really bad marks in my mock test").map((s) => s.id);
  assert.ok(ids.includes("mock-result"), ids.join(", "));
});

test("retrieve: rest-guilt query surfaces relevant snippet", () => {
  const ids = retrieve("I feel so guilty whenever I rest instead of studying").map((s) => s.id);
  assert.ok(ids.includes("rest-guilt") || ids.includes("burnout"), ids.join(", "));
});

test("retrieve: irrelevant or empty queries return nothing", () => {
  assert.equal(retrieve("qwzzx xylophone platypus").length, 0);
  assert.equal(retrieve("").length, 0);
  assert.equal(retrieve("   ").length, 0);
});

test("retrieve: respects k and is deterministic", () => {
  const q = "I am so anxious and stressed about my exam";
  const r1 = retrieve(q, 2);
  assert.ok(r1.length <= 2 && r1.length >= 1);
  const r2 = retrieve(q, 2);
  assert.deepEqual(
    r1.map((s) => s.id),
    r2.map((s) => s.id),
  );
});

test("groundingBlock: empty for none, formatted for some", () => {
  assert.equal(groundingBlock([]), "");
  const block = groundingBlock(retrieve("I can't focus and keep procrastinating"));
  assert.ok(block.includes("Ground your reply"));
  assert.ok(block.length > 20);
});

test("KB integrity: unique ids, non-empty fields", () => {
  const ids = new Set(KNOWLEDGE.map((s) => s.id));
  assert.equal(ids.size, KNOWLEDGE.length);
  for (const s of KNOWLEDGE) {
    assert.ok(s.title.length > 0);
    assert.ok(s.text.length > 10);
    assert.ok(s.tags.length > 0);
  }
});
