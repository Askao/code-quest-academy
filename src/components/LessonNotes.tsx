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

export function LessonNotes({ notes }: { notes: string }) {
  const blocks = notes.split(/```(?:python)?\n?/);

  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      {blocks.map((block, i) =>
        i % 2 === 1 ? (
          <pre
            key={i}
            className="overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-xs text-foreground"
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
                      <table className="w-full border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border bg-secondary/40">
                            {table.header.map((cell, c) => (
                              <th
                                key={c}
                                className="p-2 text-left font-semibold text-foreground"
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
                                <td key={c} className="p-2 align-top">
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
