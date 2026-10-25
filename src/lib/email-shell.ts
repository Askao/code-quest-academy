/**
 * The bits every H-Code email shares: the dark page shell, the gold button,
 * HTML escaping, and sending through the Resend HTTP API (outbound SMTP is
 * blocked from this Railway environment - see auth-email-hook.server.ts).
 */
import {
  bulkAllowed,
  bulkDailyLimit,
  freshQuota,
  noteResponse,
  type QuotaState,
} from "./email-quota.ts";

/** For anything a person typed (names, homework titles) that ends up inside email HTML. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function shellHtml(bodyHtml: string): string {
  return `<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; background: #0d0d0f; color: #eee; padding: 32px 16px; margin: 0;">
    <div style="max-width: 560px; margin: 0 auto;">
      <p style="color: #e8c27a; font-family: monospace; font-size: 14px; margin: 0 0 24px;">&gt;_ H-Code</p>
      ${bodyHtml}
    </div>
  </body>
</html>`;
}

export function ctaButton(href: string, label: string): string {
  return `<p style="margin: 24px 0 0;">
    <a href="${href}" style="display: inline-block; background: #e8c27a; color: #111; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">${label}</a>
  </p>`;
}

let quota: QuotaState = freshQuota(new Date());

/**
 * Whether bulk email (homework, messages, weekly reports) may go out now.
 * False once today's sends reach the bulk limit - see email-quota.ts.
 */
export function bulkEmailAllowed(): boolean {
  return bulkAllowed(quota, new Date(), bulkDailyLimit());
}

export type SendOptions = {
  replyTo?: string;
  /**
   * Bulk email is held back (not sent, returns false) once today's allowance
   * for it is used, so account emails always have room. Callers already
   * retry a failed send on their next run.
   */
  bulk?: boolean;
};

export async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
  options: SendOptions = {},
): Promise<boolean> {
  const resendKey = process.env["RESEND_API_KEY"];
  if (!resendKey) {
    console.error("[email] Missing RESEND_API_KEY");
    return false;
  }
  if (options.bulk && !bulkEmailAllowed()) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "H-Code <noreply@hcodeacademy.co.uk>",
      to,
      subject,
      html,
      ...(options.replyTo ? { reply_to: options.replyTo } : {}),
    }),
  });
  let errorName: string | null = null;
  if (!res.ok) {
    const text = await res.text();
    try {
      errorName = (JSON.parse(text) as { name?: string }).name ?? null;
    } catch {
      errorName = null;
    }
    console.error("[email] Resend send failed:", res.status, text);
  }
  quota = noteResponse(quota, new Date(), {
    status: res.status,
    quotaHeader: res.headers.get("x-resend-daily-quota"),
    errorName,
  });
  return res.ok;
}
