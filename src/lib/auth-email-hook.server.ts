import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Handles GoTrue's "Send Email" auth hook (GOTRUE_HOOK_SEND_EMAIL_*), called
 * server-to-server directly by GoTrue, not via the app's normal TanStack
 * Start server-function RPC path - it needs a plain HTTP endpoint reachable
 * on the app's own domain. Wired up in src/server.ts, ahead of the SSR
 * handler.
 *
 * This exists because GoTrue's built-in SMTP mailer can't actually reach
 * Resend (or any external SMTP host) from this Railway environment -
 * outbound SMTP is blocked at the network level (confirmed: smtp.resend.com
 * times out on 465/587/443 alike, while api.resend.com:443 connects fine).
 * Sending through Resend's HTTPS API instead sidesteps that entirely.
 */

export const AUTH_EMAIL_HOOK_PATH = "/api/auth/send-email-hook";

type EmailActionType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email_change_current"
  | "email_change_new"
  | "reauthentication";

type HookPayload = {
  user: { email: string; user_metadata?: { full_name?: string } };
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: EmailActionType;
  };
};

// Standard Webhooks verification (https://www.standardwebhooks.com) - the
// scheme GoTrue's hook secrets (GOTRUE_HOOK_SEND_EMAIL_SECRETS, formatted
// "v1,whsec_<base64>", multiple separated by "|") are built on.
function verifySignature(
  secretsEnv: string,
  id: string,
  timestamp: string,
  body: string,
  signatureHeader: string,
): boolean {
  const signedContent = `${id}.${timestamp}.${body}`;
  const provided = signatureHeader
    .split(" ")
    .map((s) => s.trim())
    .filter(Boolean);
  const secrets = secretsEnv
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const secret of secrets) {
    const whsec = secret.split(",")[1];
    if (!whsec?.startsWith("whsec_")) continue;
    const key = Buffer.from(whsec.slice("whsec_".length), "base64");
    const expected = createHmac("sha256", key).update(signedContent).digest("base64");
    const expectedBuf = Buffer.from(expected);
    for (const entry of provided) {
      const sig = entry.split(",")[1];
      if (!sig) continue;
      const sigBuf = Buffer.from(sig);
      if (sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf)) {
        return true;
      }
    }
  }
  return false;
}

function copyFor(type: EmailActionType): { subject: string; heading: string; cta: string } {
  switch (type) {
    case "signup":
      return { subject: "Confirm your H-Code account", heading: "Confirm your email", cta: "Confirm email" };
    case "recovery":
      return { subject: "Reset your H-Code password", heading: "Reset your password", cta: "Reset password" };
    case "email_change":
    case "email_change_current":
    case "email_change_new":
      return {
        subject: "Confirm your new email — H-Code",
        heading: "Confirm your new email",
        cta: "Confirm email",
      };
    case "magiclink":
      return { subject: "Your H-Code sign-in link", heading: "Sign in to H-Code", cta: "Sign in" };
    case "invite":
      return { subject: "You've been invited to H-Code", heading: "Accept your invite", cta: "Accept invite" };
    default:
      return { subject: "H-Code account action", heading: "Confirm this action", cta: "Continue" };
  }
}

function renderEmailHtml(
  link: string,
  name: string | undefined,
  copy: { heading: string; cta: string },
): string {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return `<!doctype html>
<html>
  <body style="font-family: system-ui, sans-serif; background: #0d0d0f; color: #eee; padding: 32px 16px; margin: 0;">
    <div style="max-width: 480px; margin: 0 auto;">
      <p style="color: #e8c27a; font-family: monospace; font-size: 14px; margin: 0 0 24px;">&gt;_ H-Code</p>
      <h1 style="font-size: 22px; margin: 0 0 16px;">${copy.heading}</h1>
      <p style="margin: 0 0 8px;">${greeting}</p>
      <p style="color: #ccc; margin: 0 0 24px;">Click below to continue. This link expires shortly for your security.</p>
      <p style="margin: 0 0 24px;">
        <a href="${link}" style="display: inline-block; background: #e8c27a; color: #111; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">${copy.cta}</a>
      </p>
      <p style="color: #888; font-size: 13px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </body>
</html>`;
}

export async function handleAuthEmailHook(request: Request): Promise<Response> {
  const secretsEnv = process.env["GOTRUE_HOOK_SEND_EMAIL_SECRETS"];
  const resendKey = process.env["RESEND_API_KEY"];
  const authExternalUrl = process.env["GOTRUE_EXTERNAL_URL"];
  if (!secretsEnv || !resendKey || !authExternalUrl) {
    console.error(
      "[auth-email-hook] Missing GOTRUE_HOOK_SEND_EMAIL_SECRETS / RESEND_API_KEY / GOTRUE_EXTERNAL_URL",
    );
    return new Response("Server misconfigured", { status: 500 });
  }

  const body = await request.text();
  const id = request.headers.get("webhook-id") ?? "";
  const timestamp = request.headers.get("webhook-timestamp") ?? "";
  const signature = request.headers.get("webhook-signature") ?? "";
  if (!id || !timestamp || !signature) {
    return new Response("Missing signature headers", { status: 401 });
  }

  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
    return new Response("Stale or invalid timestamp", { status: 401 });
  }
  if (!verifySignature(secretsEnv, id, timestamp, body, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: HookPayload;
  try {
    payload = JSON.parse(body) as HookPayload;
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const { user, email_data } = payload;
  const link =
    `${authExternalUrl.replace(/\/$/, "")}/verify?token=${encodeURIComponent(email_data.token_hash)}` +
    `&type=${encodeURIComponent(email_data.email_action_type)}` +
    `&redirect_to=${encodeURIComponent(email_data.redirect_to)}`;
  const copy = copyFor(email_data.email_action_type);
  const html = renderEmailHtml(link, user.user_metadata?.full_name, copy);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: "H-Code <noreply@hcodeacademy.co.uk>",
      to: user.email,
      subject: copy.subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[auth-email-hook] Resend send failed:", res.status, await res.text());
    return new Response("Email send failed", { status: 500 });
  }
  return new Response(null, { status: 200 });
}
