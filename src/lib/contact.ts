/**
 * The Contact us form: what counts as a valid message. Shared by the form
 * (src/routes/contact.tsx) and the server handler (contact.server.ts), so
 * both reject the same things.
 */

export const CONTACT_PATH = "/api/contact";
export const CONTACT_EMAIL = "general@hcodeacademy.co.uk";

export const CONTACT_ROLES = ["Teacher", "Student", "Parent or carer", "Other"] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const LIMITS = { name: 100, email: 254, message: 5000 } as const;

export type ContactMessage = { name: string; email: string; role: ContactRole; message: string };

export type ContactCheck =
  | { ok: true; value: ContactMessage }
  | { ok: false; error: string }
  // A bot filled in the hidden field: pretend it worked, send nothing.
  | { ok: "spam" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkContact(input: unknown): ContactCheck {
  const raw = (input ?? {}) as Record<string, unknown>;
  const text = (k: string) => (typeof raw[k] === "string" ? (raw[k] as string).trim() : "");
  if (text("website") !== "") return { ok: "spam" };

  const name = text("name");
  const email = text("email");
  const role = text("role");
  const message = text("message");

  if (!email || !EMAIL.test(email) || email.length > LIMITS.email) {
    return { ok: false, error: "Enter a valid email address so we can reply." };
  }
  if (name.length > LIMITS.name) return { ok: false, error: "That name is too long." };
  if (!(CONTACT_ROLES as readonly string[]).includes(role)) {
    return { ok: false, error: "Choose who you are from the list." };
  }
  if (message.length < 10) return { ok: false, error: "Write a little more in your message." };
  if (message.length > LIMITS.message) {
    return { ok: false, error: `Keep your message under ${LIMITS.message} characters.` };
  }
  return { ok: true, value: { name, email, role: role as ContactRole, message } };
}
