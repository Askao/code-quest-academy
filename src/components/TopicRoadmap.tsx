import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

export type RoadmapTopic = {
  key: string;
  label: string;
  state: "complete" | "current" | "locked";
};

/** Horizontal stepper showing every GCSE topic in order with lock/current/complete state. */
export function TopicRoadmap({ topics }: { topics: RoadmapTopic[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateFades();
    activeRef.current?.scrollIntoView({ inline: "center", block: "nearest" });
    window.addEventListener("resize", updateFades);
    return () => window.removeEventListener("resize", updateFades);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topics]);

  const scrollBy = (dx: number) => scrollRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  return (
    <div className="panel relative p-4">
      {canScrollLeft ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 rounded-l-xl bg-gradient-to-r from-card to-transparent" />
          <button
            type="button"
            aria-label="Scroll topics left"
            onClick={() => scrollBy(-200)}
            className="absolute top-1/2 left-1 z-20 -translate-y-1/2 rounded-full border border-border bg-card p-1 text-muted-foreground hover:text-foreground"
          >
            ‹
          </button>
        </>
      ) : null}
      {canScrollRight ? (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 rounded-r-xl bg-gradient-to-l from-card to-transparent" />
          <button
            type="button"
            aria-label="Scroll topics right"
            onClick={() => scrollBy(200)}
            className="absolute top-1/2 right-1 z-20 -translate-y-1/2 rounded-full border border-border bg-card p-1 text-muted-foreground hover:text-foreground"
          >
            ›
          </button>
        </>
      ) : null}
      <div
        ref={scrollRef}
        onScroll={updateFades}
        className="scrollbar-none flex items-center gap-1 overflow-x-auto scroll-smooth"
      >
        {topics.map((t, i) => (
          <div
            key={t.key}
            ref={t.state === "current" ? activeRef : undefined}
            className="flex shrink-0 items-center gap-1"
          >
            {i > 0 ? <span className="mx-1 h-px w-6 shrink-0 bg-border" /> : null}
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
