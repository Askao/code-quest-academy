/**
 * POST /api/contact - the Contact us form. Emails the message to
 * general@hcodeacademy.co.uk (or CONTACT_TO, if set) from the usual noreply
 * address, with Reply-To set to the sender, so pressing Reply in the inbox
 * answers them directly. Nothing is stored in the database.
 *
 * Abuse limits: same-site requests only, a hidden honeypot field, and at
 * most 5 messages per connection per hour (kept in memory, by a hash of the
 * IP, never written anywhere).
 */
import { createHash } from "node:crypto";
import { CONTACT_EMAIL, CONTACT_PATH, checkContact } from "./contact";
import { escapeHtml, sendResendEmail, shellHtml } from "./email-shell";
import { clientIp } from "./visitor-location";

export { CONTACT_PATH };

const PER_HOUR = 5;
const HOUR_MS = 60 * 60 * 1000;
const recent = new Map<string, number[]>();

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function sameSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const host = new URL(origin).host;
    const siteHost = new URL(process.env["SITE_URL"] ?? "https://www.hcodeacademy.co.uk").host;
    return host === siteHost || host === request.headers.get("host");
  } catch {
    return false;
  }
}

function overLimit(request: Request): boolean {
  const ip = clientIp(request.headers) ?? "unknown";
  const key = createHash("sha256").update(ip).digest("base64");
  const now = Date.now();
  const times = (recent.get(key) ?? []).filter((t) => now - t < HOUR_MS);
  if (times.length >= PER_HOUR) return true;
  times.push(now);
  recent.set(key, times);
  if (recent.size > 10_000) recent.clear(); // memory bound; worst case the limit resets
  return false;
}

export async function handleContact(request: Request): Promise<Response> {
  if (!sameSite(request)) return json({ error: "Not allowed" }, 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Something went wrong. Please try again." }, 400);
  }
  const check = checkContact(body);
  if (check.ok === "spam") return json({ ok: true }, 200);
  if (!check.ok) return json({ error: check.error }, 400);
  if (overLimit(request)) {
    return json({ error: "You've sent a few messages already. Please try again in an hour." }, 429);
  }

  const { name, email, role, message } = check.value;
  const who = name || "Someone";
  const html = shellHtml(`
    <h1 style="font-size: 20px; margin: 0 0 16px;">New message from the contact form</h1>
    <p style="margin: 0 0 4px;"><strong>From:</strong> ${escapeHtml(who)} &lt;${escapeHtml(email)}&gt;</p>
    <p style="margin: 0 0 16px;"><strong>Who they are:</strong> ${escapeHtml(role)}</p>
    <div style="white-space: pre-wrap; background: #1a1a1d; border-radius: 6px; padding: 16px; line-height: 1.5;">${escapeHtml(message)}</div>
    <p style="margin: 16px 0 0; color: #999; font-size: 13px;">Press Reply to answer them directly.</p>`);
  const to = process.env["CONTACT_TO"] || CONTACT_EMAIL;
  const sent = await sendResendEmail(
    to,
    `Contact form: ${role} - ${who}`.slice(0, 120),
    html,
    email,
  );
  if (!sent) {
    return json({ error: "We couldn't send your message just now. Please try again later." }, 502);
  }
  return json({ ok: true }, 200);
}
