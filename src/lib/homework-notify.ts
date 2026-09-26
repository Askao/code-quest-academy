import { supabase } from "@/integrations/supabase/client";

export type NotifyOutcome =
  | { kind: "sent"; sent: number }
  | { kind: "held" }
  | { kind: "failed" };

/** What the teacher should be told, in one line. Pure, so it can be tested. */
export function notifyMessage(o: NotifyOutcome): string | null {
  if (o.kind === "held") return "Students will be emailed at 7am.";
  if (o.kind === "failed") return "Couldn't email students just now - it will be retried within the hour.";
  return o.sent > 0 ? `Emailed ${o.sent} student${o.sent === 1 ? "" : "s"}.` : null;
}

/**
 * Asks the server to email the class about a homework that was just set. The
 * server works out who to email from the database - only the homework's id is
 * sent - and the hourly job retries anything that fails here, so a problem is
 * a delay, not a lost email.
 */
export async function notifyHomeworkSet(homeworkId: string): Promise<NotifyOutcome> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return { kind: "failed" };
    const res = await fetch("/api/homework/notify", {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ homeworkId }),
    });
    if (!res.ok) return { kind: "failed" };
    const body = (await res.json()) as { sent?: number; failed?: number; held?: string };
    if (body.held) return { kind: "held" };
    if ((body.failed ?? 0) > 0) return { kind: "failed" };
    return { kind: "sent", sent: body.sent ?? 0 };
  } catch {
    return { kind: "failed" };
  }
}
