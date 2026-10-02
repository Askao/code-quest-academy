// Merges questions written in the plain-text authoring format into ocr.json /
// aqa.json. Authoring in text avoids escaping every quote, newline and code
// fence by hand. Format (one block per question):
//
//   ### ocr-fundamentals-19 | concept-name | ability | marks | text|code
//   ...question markdown, code fences and blank lines allowed...
//   --- scheme
//   1 | mark point text | optional guidance
//   1 | another point
//
// The board and topic come from the id (<board>-<topic>-<number>). Refuses
// to run if an id already exists. Sorted by id afterwards, like the JS merger.
//
//   node scripts/assessments/merge-text-questions.mjs <authoring.txt>
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..") + "/";
const file = process.argv[2];
const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

const questions = [];
const problems = [];
for (const block of text.split(/^### /m).slice(1)) {
  const nl = block.indexOf("\n");
  const header = block.slice(0, nl).split("|").map((s) => s.trim());
  const rest = block.slice(nl + 1);
  const cut = rest.indexOf("\n--- scheme");
  if (header.length !== 5 || cut === -1) {
    problems.push(`bad block: ${block.slice(0, 60)}`);
    continue;
  }
  const [id, concept, ability, marks, format] = header;
  const m = id.match(/^(ocr|aqa)-(.+)-(\d{2,3})$/);
  if (!m) {
    problems.push(`bad id: ${id}`);
    continue;
  }
  const markScheme = rest
    .slice(cut + "\n--- scheme".length)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const parts = l.split(" | ");
      const pts = Number(parts[0]);
      if (!Number.isInteger(pts) || parts.length < 2) problems.push(`${id}: bad scheme line: ${l}`);
      return { text: parts[1] ?? "", marks: pts, guidance: parts.slice(2).join(" | ") };
    });
  questions.push({
    id,
    board: m[1],
    topic: m[2],
    concept,
    ability: Number(ability),
    marks: Number(marks),
    format,
    question: rest.slice(0, cut).trim(),
    markScheme,
  });
}

const boards = new Set(questions.map((q) => q.board));
if (boards.size !== 1) problems.push(`file mixes boards: ${[...boards]}`);
const board = [...boards][0];
const contentPath = `${repo}src/content/assessments/${board}.json`;
const existing = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const seen = new Set(existing.map((q) => q.id));
for (const q of questions) {
  if (seen.has(q.id)) problems.push(`DUPLICATE id: ${q.id}`);
  seen.add(q.id);
}
console.log(`${questions.length} new ${board} questions, ${existing.length} existing, ${problems.length} problem(s)`);
if (problems.length) {
  console.log(problems.join("\n"));
  process.exit(1);
}
const merged = [...existing, ...questions].sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));
fs.writeFileSync(contentPath, JSON.stringify(merged, null, 1) + "\n");
console.log("written:", contentPath, "-> now", merged.length, "questions");
