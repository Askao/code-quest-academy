import { Fragment } from "react";
import { inline } from "@/lib/markdown";

function tableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

/** A paragraph-shaped chunk is a markdown table if its first two lines are a header row and a `---` separator row. */
function parseTable(chunk: string): { header: string[]; rows: string[][] } | null {
  const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  if (!/^\|.*\|$/.test(lines[0]!) || !/^\|[\s:|-]+\|$/.test(lines[1]!)) return null;
  return {
    header: tableRow(lines[0]!),
    rows: lines.slice(2).map(tableRow),
  };
}

/** A paragraph-shaped chunk is a bullet list if every non-blank line starts with "- ". */
function parseBullets(chunk: string): string[] | null {
  const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0 || !lines.every((l) => l.startsWith("- "))) return null;
  return lines.map((l) => l.slice(2));
}

/**
 * A short "here's the exam-specific angle on this" aside recurs across
 * lesson notes (exam wording ↔ Python term mappings). Pulling it into its
 * own callout, instead of leaving it as just more text in the flow, is
 * what actually fixes a notes box reading as one dense wall of text - the
 * words don't change, only whether the eye has to parse them as "one more
 * paragraph" or as a clearly separate, skippable aside.
 */
const EXAM_WORDING_RE = /exam wording/i;

export function LessonNotes({ notes }: { notes: string }) {
  const blocks = notes.split(/```(?:python)?\n?/);

  return (
    <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
      {blocks.map((block, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-sm text-foreground"
          >
            <code>{block.replace(/\n$/, "")}</code>
          </pre>
        ) : (
          <Fragment key={i}>
            {block
              .split(/\n{2,}/)
              .map((p) => p.trim())
              .filter(Boolean)
              .map((p, j) => {
                const table = parseTable(p);
                if (table) {
                  return (
                    <div key={j} className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full border-collapse text-sm">
                        <thead>
                          <tr className="border-b border-border bg-secondary/40">
                            {table.header.map((cell, c) => (
                              <th
                                key={c}
                                className="p-2.5 text-left font-semibold text-foreground"
                              >
                                {inline(cell)}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {table.rows.map((row, r) => (
                            <tr key={r} className="border-b border-border last:border-0">
                              {row.map((cell, c) => (
                                <td key={c} className="p-2.5 align-top">
                                  {inline(cell)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                const bullets = parseBullets(p);
                if (bullets) {
                  return (
                    <ul key={j} className="space-y-3">
                      {bullets.map((item, k) => (
                        <li key={k} className="flex items-start gap-3">
                          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{inline(item)}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (EXAM_WORDING_RE.test(p)) {
                  return (
                    <div key={j} className="rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <p className="font-mono text-xs font-medium tracking-wide text-accent uppercase">
                        Exam wording
                      </p>
                      <p className="mt-1.5 text-sm whitespace-pre-wrap">{inline(p)}</p>
                    </div>
                  );
                }

                return (
                  <p key={j} className="whitespace-pre-wrap">
                    {inline(p)}
                  </p>
                );
              })}
          </Fragment>
        ),
      )}
    </div>
  );
}
