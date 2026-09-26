// Run with: npm test
// Checks every assessment question and mark scheme in this folder for the
// mistakes that would be embarrassing (or unfair) in front of students - the
// pool is authored by hand and is meant to grow large, so this is the safety net.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { topicsFor } from "../../lib/game.ts";

type MarkPoint = { text: string; marks: number; guidance: string };
type Question = {
  id: string;
  board: "ocr" | "aqa";
  topic: string;
  ability: number;
  marks: number;
  format: "text" | "code";
  question: string;
  markScheme: MarkPoint[];
};

const dir = path.dirname(fileURLToPath(import.meta.url));
const boards = ["ocr", "aqa"] as const;
const bank: Question[] = boards.flatMap(
  (b) => JSON.parse(fs.readFileSync(path.join(dir, `${b}.json`), "utf8")) as Question[],
);

test("the pool is not empty for either board", () => {
  for (const b of boards)
    assert.ok(
      bank.some((q) => q.board === b),
      `no ${b} questions`,
    );
});

test("ids are unique and follow board-topic-number", () => {
  const seen = new Set<string>();
  for (const q of bank) {
    assert.ok(!seen.has(q.id), `duplicate id ${q.id}`);
    seen.add(q.id);
    assert.match(q.id, new RegExp(`^${q.board}-${q.topic}-\\d{2,3}$`), `bad id ${q.id}`);
  }
});

test("each question belongs to its board's file and to a topic that board teaches", () => {
  for (const q of bank) {
    const allowed = topicsFor("gcse", q.board).map((t) => t.key as string);
    assert.ok(allowed.includes(q.topic), `${q.id}: topic ${q.topic} is not on the ${q.board} spec`);
  }
  for (const b of boards) {
    const inFile = JSON.parse(fs.readFileSync(path.join(dir, `${b}.json`), "utf8")) as Question[];
    assert.ok(
      inFile.every((q) => q.board === b),
      `${b}.json contains another board's question`,
    );
  }
});

test("marks and ability are in range, and marks rise with ability like a real paper", () => {
  for (const q of bank) {
    assert.ok(Number.isInteger(q.marks) && q.marks >= 1 && q.marks <= 12, `${q.id}: marks`);
    assert.ok([1, 2, 3].includes(q.ability), `${q.id}: ability`);
    assert.ok(["text", "code"].includes(q.format), `${q.id}: format`);
    if (q.ability === 1) assert.ok(q.marks <= 2, `${q.id}: ability 1 should be 1-2 marks`);
    if (q.ability === 2)
      assert.ok(q.marks >= 3 && q.marks <= 4, `${q.id}: ability 2 should be 3-4 marks`);
    if (q.ability === 3) assert.ok(q.marks >= 5, `${q.id}: ability 3 should be 5+ marks`);
  }
});

test("the [n] marks printed in the question add up to its marks", () => {
  for (const q of bank) {
    const printed = [...q.question.matchAll(/\[(\d+)\]/g)].reduce((s, m) => s + Number(m[1]), 0);
    assert.equal(printed, q.marks, `${q.id}: question shows [${printed}] but is worth ${q.marks}`);
  }
});

test("mark schemes can actually award the full marks, and never more than a point is worth", () => {
  for (const q of bank) {
    assert.ok(q.markScheme.length > 0, `${q.id}: no mark scheme`);
    for (const p of q.markScheme) {
      assert.ok(p.text.trim().length > 0, `${q.id}: empty mark point`);
      assert.ok(Number.isInteger(p.marks) && p.marks >= 1, `${q.id}: point marks`);
      assert.ok(p.marks <= q.marks, `${q.id}: a point is worth more than the whole question`);
    }
    const available = q.markScheme.reduce((s, p) => s + p.marks, 0);
    assert.ok(
      available >= q.marks,
      `${q.id}: scheme offers ${available} but question is ${q.marks}`,
    );
  }
});

test("code fences in question text are balanced (an odd number would swallow the rest)", () => {
  for (const q of bank) {
    const fences = (q.question.match(/```/g) ?? []).length;
    assert.equal(fences % 2, 0, `${q.id}: unbalanced code fence`);
  }
});

test("programming questions ask the student to write something", () => {
  for (const q of bank) {
    if (q.format === "code") {
      assert.ok(
        /write/i.test(q.question),
        `${q.id}: a code question should ask the student to write something`,
      );
    }
  }
});

test("every topic in the pool has questions at every ability level, on both boards", () => {
  const topics = new Set(bank.map((q) => q.topic));
  for (const b of boards) {
    for (const t of topics) {
      for (const a of [1, 2, 3]) {
        assert.ok(
          bank.some((q) => q.board === b && q.topic === t && q.ability === a),
          `${b} ${t} has no ability-${a} question`,
        );
      }
    }
  }
});
