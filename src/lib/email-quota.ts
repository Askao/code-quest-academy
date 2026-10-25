/**
 * Keeps Resend's daily email allowance from being used up by bulk email.
 *
 * On the free plan Resend allows 100 emails a day, then refuses everything
 * until the next day, including sign-up confirmations and password resets,
 * which have no retry. So bulk email (homework, messages, weekly reports)
 * stops once BULK_DAILY_LIMIT have gone out that day, leaving the rest for
 * account emails. Bulk email that is held back is picked up by the next run
 * once the day has turned over; nothing is dropped.
 *
 * How many have gone out comes from Resend itself: free-plan responses carry
 * an x-resend-daily-quota header with today's count. Paid plans have no daily
 * cap and no header, so nothing is ever held back there. A "daily quota
 * exceeded" refusal also stops bulk email for the rest of the day, which
 * covers the count being unknown after a restart.
 */

const DEFAULT_BULK_DAILY_LIMIT = 70;

export type QuotaState = { day: string; used: number | null; exhausted: boolean };

/** Resend's day, which resets at midnight UTC. */
export function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function bulkDailyLimit(env: Record<string, string | undefined> = process.env): number {
  const raw = env["RESEND_BULK_DAILY_LIMIT"];
  const n = raw === undefined || raw.trim() === "" ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : DEFAULT_BULK_DAILY_LIMIT;
}

export function freshQuota(now: Date): QuotaState {
  return { day: utcDay(now), used: null, exhausted: false };
}

/** The state for today, starting afresh when the day has changed. */
function today(state: QuotaState, now: Date): QuotaState {
  return state.day === utcDay(now) ? state : freshQuota(now);
}

export function bulkAllowed(state: QuotaState, now: Date, limit: number): boolean {
  const s = today(state, now);
  if (s.exhausted) return false;
  return s.used === null || s.used < limit;
}

/** Updates the state from one Resend response. */
export function noteResponse(
  state: QuotaState,
  now: Date,
  res: { status: number; quotaHeader: string | null; errorName?: string | null },
): QuotaState {
  const s = { ...today(state, now) };
  if (res.quotaHeader !== null && /^\d+$/.test(res.quotaHeader.trim())) {
    s.used = Number(res.quotaHeader.trim());
  }
  if (res.status === 429 && res.errorName === "daily_quota_exceeded") s.exhausted = true;
  return s;
}
