import { Fragment, type ReactNode } from "react";

/** Renders the small markdown subset used across the app: **bold**, `code`, *italic*. */
export function inline(text: string): ReactNode[] {
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
