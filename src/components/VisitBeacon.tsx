import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { VISIT_PATH, visitStep, type VisitStep } from "@/lib/visitor-location";

const HUMAN_EVENTS = ["pointerdown", "pointermove", "keydown", "scroll", "touchstart"] as const;

/**
 * Tells the server a person is looking at the site (visitor-location.server.ts),
 * but only once they have scrolled, tapped, typed or moved the mouse: bots
 * that never run the page, or never touch it, are never counted. Sends the
 * page's step (homepage, sign-up form, other), nothing else. Renders nothing.
 */
export function VisitBeacon() {
  const step = useRouterState({
    select: (s) => visitStep(s.location.pathname, s.location.search as Record<string, unknown>),
  });
  const interacted = useRef(false);
  const sent = useRef(new Set<VisitStep>());
  const current = useRef(step);
  current.current = step;

  const send = (s: VisitStep) => {
    if (sent.current.has(s)) return;
    sent.current.add(s);
    try {
      void fetch(VISIT_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ page: s }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Counting visits must never get in anyone's way.
    }
  };

  useEffect(() => {
    const onFirst = () => {
      if (interacted.current) return;
      interacted.current = true;
      for (const e of HUMAN_EVENTS) window.removeEventListener(e, onFirst);
      send(current.current);
    };
    for (const e of HUMAN_EVENTS) window.addEventListener(e, onFirst, { passive: true });
    return () => {
      for (const e of HUMAN_EVENTS) window.removeEventListener(e, onFirst);
    };
  }, []);

  // Moving to the sign-up form after the first interaction counts that step too.
  useEffect(() => {
    if (interacted.current) send(step);
  }, [step]);

  return null;
}
