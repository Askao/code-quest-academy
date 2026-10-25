import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_PATH, CONTACT_ROLES, LIMITS, checkContact } from "@/lib/contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact us — H-Code" },
      {
        name: "description",
        content: "Questions about H-Code Academy for your school, your class or your account.",
      },
      { property: "og:title", content: "Contact us — H-Code" },
    ],
  }),
  component: Contact,
});

type Status =
  { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", role: "", message: "", website: "" });
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const set = (k: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [k]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const check = checkContact(form);
    if (check.ok === false) {
      setStatus({ kind: "error", message: check.error });
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch(CONTACT_PATH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({
          kind: "error",
          message: body.error ?? "Something went wrong. Please try again.",
        });
        return;
      }
      setStatus({ kind: "sent" });
    } catch {
      setStatus({ kind: "error", message: "Couldn't reach the server. Check your connection." });
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold">
            H-Code Academy
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-10">
        <h1 className="text-3xl font-bold">Contact us</h1>
        <p className="mt-2 text-muted-foreground">
          Questions about using H-Code with your school, a problem with your account, or an idea?
          Send a message and we'll reply by email.
        </p>

        {status.kind === "sent" ? (
          <div className="panel mt-8 p-6" role="status">
            <p className="font-semibold">Thanks, your message has been sent.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              We'll reply to {form.email} as soon as we can.
            </p>
            <Button asChild variant="secondary" className="mt-4">
              <Link to="/">Back to the home page</Link>
            </Button>
          </div>
        ) : (
          <form className="mt-8 space-y-5" onSubmit={submit} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="contact-name">Your name (optional)</Label>
              <Input
                id="contact-name"
                autoComplete="name"
                maxLength={LIMITS.name}
                value={form.name}
                onChange={(e) => set("name")(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-email">Your email</Label>
              <Input
                id="contact-email"
                type="email"
                autoComplete="email"
                required
                maxLength={LIMITS.email}
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-role">I am a…</Label>
              <select
                id="contact-role"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.role}
                onChange={(e) => set("role")(e.target.value)}
              >
                <option value="" disabled>
                  Choose one
                </option>
                {CONTACT_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                required
                rows={7}
                maxLength={LIMITS.message}
                value={form.message}
                onChange={(e) => set("message")(e.target.value)}
              />
            </div>
            {/* Hidden from people; bots that fill in every field give themselves away. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label>
                Leave this empty
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => set("website")(e.target.value)}
                />
              </label>
            </div>

            {status.kind === "error" ? (
              <p className="text-sm text-destructive" role="alert">
                {status.message}
              </p>
            ) : null}

            <Button type="submit" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? "Sending…" : "Send message"}
            </Button>
            <p className="text-xs text-muted-foreground">
              We only use your details to reply to you. See our{" "}
              <Link to="/privacy" className="underline hover:text-foreground">
                privacy policy
              </Link>
              .
            </p>
          </form>
        )}
      </main>
    </div>
  );
}
