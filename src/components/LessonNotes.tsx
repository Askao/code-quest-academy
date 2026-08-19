import { Fragment } from "react";

/** Renders the small markdown subset used in lesson notes: fences, **bold**, `code`. */
function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    if (p.startsWith("`") && p.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-secondary px-1.5 py-0.5 text-[0.85em] text-foreground">
          {p.slice(1, -1)}
        </code>
      );
    }
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
      return <em key={i}>{p.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
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
              .map((p, j) => (
                <p key={j} className="whitespace-pre-wrap">
                  {inline(p)}
                </p>
              ))}
          </Fragment>
        ),
      )}
    </div>
  );
}
