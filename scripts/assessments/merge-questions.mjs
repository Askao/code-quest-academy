// Merges a batch of newly authored assessment questions into ocr.json or
// aqa.json, checking for id collisions first. Sorted by id afterwards so
// diffs stay readable.
//
//   node scripts/assessments/merge-questions.mjs <board> <authoring.mjs>
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repo = "C:/Users/charl/Documents/GitHub/code-quest-academy/";
const [board, file] = process.argv.slice(2);
const { questions } = await import(pathToFileURL(path.resolve(file)).href);

const contentPath = `${repo}src/content/assessments/${board}.json`;
const existing = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const seen = new Set(existing.map((q) => q.id));

let bad = 0;
for (const q of questions) {
  if (seen.has(q.id)) {
    console.log(`DUPLICATE id: ${q.id}`);
    bad++;
    continue;
  }
  if (q.board !== board) {
    console.log(`${q.id}: board field is "${q.board}", expected "${board}"`);
    bad++;
  }
  seen.add(q.id);
}

console.log(`${questions.length} new questions, ${existing.length} existing, ${bad} problem(s)`);
if (bad) process.exit(1);

const merged = [...existing, ...questions].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
fs.writeFileSync(contentPath, JSON.stringify(merged, null, 1) + "\n");
console.log("written:", contentPath, "-> now", merged.length, "questions");
