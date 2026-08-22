import { Fragment } from "react";
import { inline } from "@/lib/markdown";
import { IdeMock } from "@/components/IdeMock";

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
 * A paragraph-shaped chunk is a numbered list if, after an optional lead-in
 * line ("Here's how it works:"), every remaining line starts "1. ", "2. "
 * etc. Needs at least two numbered lines to count - one alone is more
 * likely just a sentence that happens to start with a digit.
 */
function parseNumbered(chunk: string): { lead: string | null; items: string[] } | null {
  const lines = chunk.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const lead = /^\d+\.\s/.test(lines[0]!) ? null : lines[0]!;
  const rest = lead === null ? lines : lines.slice(1);
  if (rest.length < 2) return null;
  const items: string[] = [];
  for (const l of rest) {
    const m = /^\d+\.\s+(.*)$/.exec(l);
    if (!m) return null;
    items.push(m[1]!);
  }
  return { lead, items };
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

/** Same idea for a "here's the mistake people make" aside - **Watch out:** / **Careful:** / **Important:** lead-ins. */
const WARNING_RE = /^\*\*(Watch out|Careful|Important)[:.]?\*\*/;

type Token =
  | { kind: "text"; text: string }
  | { kind: "code"; code: string }
  | { kind: "ide"; code: string; output: string; error: boolean };

/**
 * ```ide / ```ide-error fences are a small IDE mockup instead of a plain
 * code block: the part before a lone `===` line is the code, the part
 * after is the console output it produces (authored, not executed - see
 * IdeMock). Plain ``` / ```python fences still render as an ordinary code
 * block, unchanged.
 */
function tokenize(notes: string): Token[] {
  const tokens: Token[] = [];
  const fenceRe = /```(python|ide-error|ide)?\n([\s\S]*?)```\n?/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(notes))) {
    if (m.index > lastIndex) tokens.push({ kind: "text", text: notes.slice(lastIndex, m.index) });
    const lang = m[1];
    const body = m[2]!.replace(/\n$/, "");
    if (lang === "ide" || lang === "ide-error") {
      const [code, output] = body.split(/\n===\n/);
      tokens.push({
        kind: "ide",
        code: (code ?? "").trim(),
        output: (output ?? "").trim(),
        error: lang === "ide-error",
      });
    } else {
      tokens.push({ kind: "code", code: body });
    }
    lastIndex = fenceRe.lastIndex;
  }
  if (lastIndex < notes.length) tokens.push({ kind: "text", text: notes.slice(lastIndex) });
  return tokens;
}

/**
 * `skipInlineCallout` is set when this body is already inside a `---` box
 * that took its colour from the same content (e.g. a section that's
 * nothing but a "Watch out" paragraph) - re-drawing the identical callout
 * a second time, nested inside its own already-tinted box, would just be
 * a warning box inside a warning box for no added information.
 */
function renderBody(text: string, keyPrefix: string, skipInlineCallout = false) {
  const tokens = tokenize(text);
  return tokens.map((token, i) => {
    if (token.kind === "ide") {
      return <IdeMock key={`${keyPrefix}-${i}`} code={token.code} output={token.output} error={token.error} />;
    }
    if (token.kind === "code") {
      return (
        <pre
          key={`${keyPrefix}-${i}`}
          className="overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-sm text-foreground"
        >
          <code>{token.code}</code>
        </pre>
      );
    }
    return (
      <Fragment key={`${keyPrefix}-${i}`}>
        {token.text
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
                          <th key={c} className="p-2.5 text-left font-semibold text-foreground">
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

            const numbered = parseNumbered(p);
            if (numbered) {
              return (
                <div key={j}>
                  {numbered.lead ? <p className="mb-2.5">{inline(numbered.lead)}</p> : null}
                  <ol className="space-y-3">
                    {numbered.items.map((item, k) => (
                      <li key={k} className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-[0.7rem] font-semibold text-primary">
                          {k + 1}
                        </span>
                        <span>{inline(item)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            }

            if (!skipInlineCallout && WARNING_RE.test(p)) {
              return (
                <div key={j} className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                  <p className="mt-1.5 text-sm whitespace-pre-wrap">{inline(p)}</p>
                </div>
              );
            }

            if (!skipInlineCallout && EXAM_WORDING_RE.test(p)) {
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
    );
  });
}

/** A line that's just three or more dashes on its own marks a section break - splits notes into separate boxes instead of one long scroll, for lessons dense enough to need it. Opt-in: notes with no `---` render exactly as before. */
const SECTION_BREAK_RE = /\n-{3,}\n/;

/**
 * Each box gets its own colour so neighbouring boxes read as visually
 * distinct chunks, not just the same grey card repeated - reusing the same
 * four-colour set the lesson page's own section badges use. A box whose
 * content is itself a "Watch out"/"Careful" aside or an exam-wording note
 * takes that colour regardless of position, so the colour still means
 * something rather than just cycling; everything else rotates through the
 * remaining three in order.
 */
type Tint = "primary" | "accent" | "success" | "warning";
const TINT_CLASSES: Record<Tint, { border: string; bg: string; bar: string }> = {
  primary: { border: "border-primary/25", bg: "bg-primary/[0.05]", bar: "bg-primary" },
  accent: { border: "border-accent/25", bg: "bg-accent/[0.05]", bar: "bg-accent" },
  success: { border: "border-success/25", bg: "bg-success/[0.05]", bar: "bg-success" },
  warning: { border: "border-warning/30", bg: "bg-warning/[0.06]", bar: "bg-warning" },
};
// Excludes primary: this theme's primary and warning hues sit only 8°
// apart on the wheel (see styles.css), so a "primary" plain box and a
// "Watch out" box would look nearly identical - exactly the opposite of
// what these colours are for. Accent and success stay clearly apart from
// warning and each other.
const PLAIN_ROTATION: Tint[] = ["accent", "success"];
const SECTION_WARNING_RE = /\*\*(Watch out|Careful|Important)[:.]?\*\*/;

/** Returns the tint a section's own content calls for, or null if it should just take the next colour in rotation. */
function sectionTintOverride(text: string): Tint | null {
  if (SECTION_WARNING_RE.test(text)) return "warning";
  if (EXAM_WORDING_RE.test(text)) return "accent";
  return null;
}

export function LessonNotes({ notes }: { notes: string }) {
  const sections = notes
    .split(SECTION_BREAK_RE)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sections.length <= 1) {
    return (
      <div className="space-y-5 text-base leading-relaxed text-muted-foreground">
        {renderBody(notes, "s")}
      </div>
    );
  }

  let plainIndex = 0;
  return (
    <div className="space-y-4">
      {sections.map((section, i) => {
        const override = sectionTintOverride(section);
        const tint = override ?? PLAIN_ROTATION[plainIndex++ % PLAIN_ROTATION.length]!;
        const c = TINT_CLASSES[tint];
        return (
          <div key={i} className={`overflow-hidden rounded-lg border ${c.border} ${c.bg}`}>
            <div className="flex">
              <span className={`w-1 shrink-0 ${c.bar}`} />
              <div className="min-w-0 flex-1 space-y-5 p-4 text-base leading-relaxed text-muted-foreground">
                {renderBody(section, `s${i}`, override !== null)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
