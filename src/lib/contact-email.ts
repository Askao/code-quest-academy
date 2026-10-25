/** The email a Contact us message arrives as (sent by contact.server.ts). */
import { escapeHtml, shellHtml } from "./email-shell.ts";
import type { ContactMessage } from "./contact.ts";

export function contactEmail({ name, email, role, message }: ContactMessage): {
  subject: string;
  html: string;
} {
  const who = name || "Someone";
  const html = shellHtml(`
    <h1 style="font-size: 20px; margin: 0 0 16px;">New message from the contact form</h1>
    <p style="margin: 0 0 4px;"><strong>From:</strong> ${escapeHtml(who)} &lt;${escapeHtml(email)}&gt;</p>
    <p style="margin: 0 0 16px;"><strong>Who they are:</strong> ${escapeHtml(role)}</p>
    <div style="white-space: pre-wrap; background: #1a1a1d; border-radius: 6px; padding: 16px; line-height: 1.5;">${escapeHtml(message)}</div>
    <p style="margin: 16px 0 0; color: #999; font-size: 13px;">Press Reply to answer them directly.</p>`);
  return { subject: `Contact form: ${role} - ${who}`.slice(0, 120), html };
}
