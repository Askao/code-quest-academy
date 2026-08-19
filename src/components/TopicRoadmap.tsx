import { Link } from "@tanstack/react-router";

export type RoadmapTopic = {
  key: string;
  label: string;
  state: "complete" | "current" | "locked";
};

/** Horizontal stepper showing every GCSE topic in order with lock/current/complete state. */
export function TopicRoadmap({ topics }: { topics: RoadmapTopic[] }) {
  return (
    <div className="panel overflow-x-auto p-4">
      <div className="flex min-w-max items-center gap-1">
        {topics.map((t, i) => (
          <div key={t.key} className="flex items-center gap-1">
            {i > 0 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
            {t.state === "locked" ? (
              <span
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground opacity-60"
                title={`${t.label} — locked`}
              >
                🔒 {t.label}
              </span>
            ) : (
              <Link
                to="/learn"
                hash={t.key}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  t.state === "complete"
                    ? "border-success/40 bg-success/10 text-success hover:bg-success/20"
                    : "border-primary/60 bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {t.state === "complete" ? "✓" : "→"} {t.label}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
