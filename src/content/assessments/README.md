# Assessment question bank

Original exam-style questions for teacher-marked assessments, in the style of
OCR (J277) and AQA (8525) GCSE Computer Science. **They are not exam-board
questions** - the board's wording, command words, pseudocode and mark-scheme
conventions are followed, but every question here is written for H-Code.

- `ocr.json` - OCR style (OCR Exam Reference Language, "Award 1 mark for...")
- `aqa.json` - AQA style (AQA pseudo-code, "Allow" / "Do not allow")

## A question

```json
{
  "id": "ocr-iteration-04",
  "board": "ocr",
  "topic": "iteration",
  "ability": 2,
  "marks": 4,
  "format": "code",
  "question": "Write a program that ... [4]",
  "markScheme": [
    { "text": "Uses a condition-controlled loop", "marks": 1, "guidance": "Accept WHILE / DO UNTIL." }
  ]
}
```

| Field | Rule |
|---|---|
| `id` | `<board>-<topic>-<number>`, unique. The topic is a key from `GCSE_TOPICS` in `src/lib/game.ts` (`databases` is AQA-only). |
| `ability` | 1 accessible (1-2 marks), 2 core (3-4 marks), 3 stretch (5+ marks). |
| `marks` | What the question is worth. The `[n]` marks printed in the question must add up to this. |
| `format` | `text` (prose answer) or `code` (monospace box; the question should say "Write..."). |
| `question` | Markdown: `**bold**`, `` `code` ``, `- ` bullets, `\| tables \|`, and fenced code blocks for the pseudocode. |
| `markScheme` | The points the teacher rules YES/NO on. `guidance` holds "Accept..." / "Do not accept..." notes. |

A question may offer **more points than marks** ("any two of these four"): the
teacher's score is capped at `marks`. It must never offer fewer.

## Adding to the pool

1. Add questions to `ocr.json` / `aqa.json`.
2. `npm test` - the checks in `assessments.test.ts` catch a wrong mark total, a
   mark scheme that can't award full marks, an unbalanced code fence, a topic
   the board doesn't teach, and a topic missing a difficulty level.
3. `node scripts/build-assessment-seed.mjs` - regenerates
   `supabase/migrations/20260926130000_seed_assessment_questions.sql`.
4. `npm i --no-save @electric-sql/pglite && node scripts/test-assessments-sql.mjs`
   - checks the seed loads and the access rules still hold.
5. Apply the regenerated seed to the database. It is safe to apply again: questions
   are upserted by id, and marking already done keeps its own copy of each point's marks.

**Every new question needs a subject-teacher read-through before students see it**
(wording, spec fit, and that the mark scheme awards what an examiner would).
