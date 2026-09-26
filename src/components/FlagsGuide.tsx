import { FLAG_EXPLANATIONS, WATCH_LIST_REASONS } from "@/lib/flags";

/**
 * "What do these flags mean?" - a small disclosure that explains, in plain
 * English, how Struggling and Ready for more are worked out and what else puts
 * a student on the report's watch list. Shown next to the roster and the class
 * report so a teacher never has to guess why a badge is there.
 */
export function FlagsGuide({ showWatchList = false }: { showWatchList?: boolean }) {
  return (
    <details className="group rounded-lg border border-border bg-secondary/20 text-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-medium select-none">
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded-full border border-border font-mono text-xs text-muted-foreground"
        >
          i
        </span>
        What do the flags mean?
        <span aria-hidden className="ml-auto text-muted-foreground group-open:hidden">
          ▸
        </span>
        <span aria-hidden className="ml-auto hidden text-muted-foreground group-open:inline">
          ▾
        </span>
      </summary>
      <div className="space-y-4 border-t border-border px-4 py-3">
        {FLAG_EXPLANATIONS.map((f) => (
          <div key={f.name}>
            <p className="font-medium">
              {f.icon} {f.name}
            </p>
            <p className="mt-0.5">{f.what}</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted-foreground">
              {f.detail.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        ))}
        {showWatchList ? (
          <div>
            <p className="font-medium">Who's on the "needs a conversation" list</p>
            <p className="mt-0.5 text-muted-foreground">A student appears there for any of:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5 text-muted-foreground">
              {WATCH_LIST_REASONS.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </details>
  );
}
