/**
 * "Hide this for a while" for the small prompts around the site: the
 * teachers' share bar and the join-a-class reminder for students. Kept in
 * this browser only (localStorage): hiding a prompt is a convenience, not
 * something that needs to follow anyone between devices. If storage is
 * blocked the prompt simply shows again, which is harmless.
 */

export const SHARE_BAR_KEY = "hcode-share-bar-hidden-until";
export const JOIN_REMINDER_KEY = "hcode-join-reminder-hidden-until";

/** True while `hiddenUntil` (an ISO date, or null) is still in the future. */
export function isSnoozed(hiddenUntil: string | null, now: Date = new Date()): boolean {
  if (!hiddenUntil) return false;
  const until = Date.parse(hiddenUntil);
  return Number.isFinite(until) && until > now.getTime();
}

/** The ISO date `days` days after `now`. */
export function snoozeUntil(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export function readSnoozed(key: string): boolean {
  try {
    return isSnoozed(window.localStorage.getItem(key));
  } catch {
    return false;
  }
}

export function snooze(key: string, days: number) {
  try {
    window.localStorage.setItem(key, snoozeUntil(days));
  } catch {
    // Storage blocked: the prompt will just come back next time.
  }
}
