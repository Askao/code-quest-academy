/** The rules for a teacher's homework message. No imports, so the browser can use it without the email code. */
export const MESSAGE_MAX_LENGTH = 1000;

/** Trimmed, non-empty, within the limit. */
export function validateMessageBody(body: string): { ok: true; body: string } | { ok: false; reason: string } {
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, reason: "Write a message first." };
  if (trimmed.length > MESSAGE_MAX_LENGTH) {
    return { ok: false, reason: `Messages can be up to ${MESSAGE_MAX_LENGTH} characters.` };
  }
  return { ok: true, body: trimmed };
}
