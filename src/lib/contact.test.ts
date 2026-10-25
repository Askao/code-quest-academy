import { test } from "node:test";
import assert from "node:assert/strict";
import { checkContact } from "./contact.ts";

const good = {
  name: "Ada Lovelace",
  email: "ada@school.org",
  role: "Teacher",
  message: "Can my whole department use this?",
};

test("accepts a normal message and trims it", () => {
  const r = checkContact({ ...good, name: "  Ada  ", message: `  ${good.message}  ` });
  assert.deepEqual(r, { ok: true, value: { ...good, name: "Ada" } });
});

test("name is optional", () => {
  assert.equal(checkContact({ ...good, name: "" }).ok, true);
});

test("rejects a missing or bad email, a made-up role, and too-short or too-long messages", () => {
  for (const bad of [
    { ...good, email: "" },
    { ...good, email: "not-an-email" },
    { ...good, role: "Hacker" },
    { ...good, message: "hi" },
    { ...good, message: "x".repeat(5001) },
    { ...good, name: "x".repeat(101) },
  ]) {
    assert.equal(checkContact(bad).ok, false, JSON.stringify(bad).slice(0, 60));
  }
});

test("a filled-in hidden field is treated as spam", () => {
  assert.deepEqual(checkContact({ ...good, website: "http://spam" }), { ok: "spam" });
});

test("survives junk input", () => {
  assert.equal(checkContact(null).ok, false);
  assert.equal(checkContact({ email: 42 }).ok, false);
});

test("the email escapes what people typed and falls back when there's no name", async () => {
  const { contactEmail } = await import("./contact-email.ts");
  const e = contactEmail({ ...good, name: "", message: "<script>alert(1)</script>" } as never);
  assert.ok(!e.html.includes("<script>"));
  assert.ok(e.html.includes("&lt;script&gt;"));
  assert.equal(e.subject, "Contact form: Teacher - Someone");
});
