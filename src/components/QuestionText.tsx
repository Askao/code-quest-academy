import { Fragment, type ReactNode } from "react";
import { inline } from "@/lib/markdown";

/**
 * Renders an assessment question: paragraphs, "- " bullet lists, markdown
 * tables and ``` code blocks (the pseudocode / Exam Reference Language
 * snippets in the questions), with **bold** and `code` inside the text.
 * Whitespace inside code blocks is kept exactly - indentation matters when
 * someone is asked to trace a program.
 */
function cells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function Chunk({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  if (lines.length >= 2 && /^\|.*\|$/.test(lines[0]!) && /^\|[\s:|-]+\|$/.test(lines[1]!)) {
    return (
      <div className="overflow-x-auto">
        <table className="text-sm">
          <thead>
            <tr>
              {cells(lines[0]!).map((h, i) => (
                <th
                  key={i}
                  className="border border-border bg-secondary/40 px-3 py-1.5 text-left font-medium"
                >
                  {inline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.slice(2).map((row, r) => (
              <tr key={r}>
                {cells(row).map((c, i) => (
                  <td key={i} className="border border-border px-3 py-1.5">
                    {inline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const leadIsBullet = lines[0]!.startsWith("- ");
  const rest = leadIsBullet ? lines : lines.slice(1);
  if (rest.length > 0 && rest.every((l) => l.startsWith("- "))) {
    return (
      <div className="space-y-1.5">
        {!leadIsBullet ? <p>{inline(lines[0]!)}</p> : null}
        <ul className="list-disc space-y-1 pl-5">
          {rest.map((l, i) => (
            <li key={i}>{inline(l.slice(2))}</li>
          ))}
        </ul>
      </div>
    );
  }

  return <p>{inline(lines.join(" "))}</p>;
}

export function QuestionText({ text, className = "" }: { text: string; className?: string }) {
  const nodes: ReactNode[] = [];
  const parts = text.split(/```[^\n]*\n([\s\S]*?)```/g);
  // split() with one capture group alternates: prose, code, prose, code, ...
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      nodes.push(
        <pre
          key={i}
          className="overflow-x-auto rounded-md border border-border bg-secondary/40 p-3 font-mono text-sm leading-relaxed"
        >
          <code>{part.replace(/\n$/, "")}</code>
        </pre>,
      );
    } else {
      part
        .split(/\n\s*\n/)
        .filter((c) => c.trim())
        .forEach((chunk, j) => nodes.push(<Chunk key={`${i}-${j}`} text={chunk} />));
    }
  });
  return (
    <div className={`space-y-3 text-base leading-relaxed ${className}`}>
      {nodes.map((n, i) => (
        <Fragment key={i}>{n}</Fragment>
      ))}
    </div>
  );
}
