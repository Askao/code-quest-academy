import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isQuietHours,
  reminderEmail,
  runHourly,
  sendSetEmailsFor,
  setHomeworkEmail,
  shouldRemind,
  timeLeft,
  ukHour,
  type EmailKind,
  type EmailStore,
  type HomeworkRow,
  type Recipient,
} from "./homework-emails.ts";

// 2026-10-01 is British Summer Time (UTC+1); 2026-12-01 is GMT (UTC+0).
const at = (iso: string) => new Date(iso);
const hoursFrom = (now: Date, h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

test("UK hour follows daylight saving", () => {
  assert.equal(ukHour(at("2026-10-01T09:00:00Z")), 10);
  assert.equal(ukHour(at("2026-12-01T09:00:00Z")), 9);
  assert.equal(ukHour(at("2026-10-01T23:30:00Z")), 0);
});

test("quiet hours are 21:00 to 07:00 UK time", () => {
  assert.equal(isQuietHours(at("2026-10-01T05:59:00Z")), true); // 06:59 BST
  assert.equal(isQuietHours(at("2026-10-01T06:00:00Z")), false); // 07:00 BST
  assert.equal(isQuietHours(at("2026-10-01T19:59:00Z")), false); // 20:59 BST
  assert.equal(isQuietHours(at("2026-10-01T20:00:00Z")), true); // 21:00 BST
  assert.equal(isQuietHours(at("2026-12-01T20:59:00Z")), false); // 20:59 GMT
  assert.equal(isQuietHours(at("2026-12-01T21:00:00Z")), true);
  assert.equal(isQuietHours(at("2026-10-02T00:00:00Z")), true);
});

test("timeLeft reads naturally", () => {
  const now = at("2026-10-01T12:00:00Z");
  assert.equal(timeLeft(hoursFrom(now, 20), now), "about 20 hours");
  assert.equal(timeLeft(hoursFrom(now, 1), now), "about 1 hour");
  assert.equal(timeLeft(new Date(now.getTime() + 10 * 60_000).toISOString(), now), "less than an hour");
});

const now = at("2026-10-01T12:00:00Z");
const base = {
  dueAt: hoursFrom(now, 20),
  createdAt: hoursFrom(now, -72),
  done: 1,
  total: 4,
  hasTasks: true,
  now,
};

test("reminder: due within 24 hours and unfinished", () => {
  assert.equal(shouldRemind(base), true);
  assert.equal(shouldRemind({ ...base, dueAt: hoursFrom(now, 24) }), true, "exactly a day left counts");
  assert.equal(shouldRemind({ ...base, done: 0 }), true, "not started at all");
});

test("reminder: not when it doesn't apply", () => {
  assert.equal(shouldRemind({ ...base, dueAt: hoursFrom(now, 24.5) }), false, "more than a day left");
  assert.equal(shouldRemind({ ...base, dueAt: hoursFrom(now, -1) }), false, "already overdue");
  assert.equal(shouldRemind({ ...base, dueAt: null }), false, "no deadline");
  assert.equal(shouldRemind({ ...base, done: 4 }), false, "finished");
  assert.equal(shouldRemind({ ...base, createdAt: hoursFrom(now, -3) }), false, "only just set");
  assert.equal(shouldRemind({ ...base, hasTasks: false, total: 0, done: 0 }), false, "nothing to do");
});

test("reminder: a student with an empty list but a real homework still gets nudged", () => {
  assert.equal(shouldRemind({ ...base, total: 0, done: 0, hasTasks: true }), true);
});

test("emails escape anything a person typed", () => {
  const f = {
    studentName: "<b>Ann</b> Smith",
    className: "10A & <i>B</i>",
    title: 'Loops "quiz" <script>alert(1)</script>',
    instructions: "Do <this> & that",
    dueAt: hoursFrom(now, 20),
    homeworkId: "abc",
    siteUrl: "https://www.hcodeacademy.co.uk",
  };
  for (const e of [setHomeworkEmail(f), reminderEmail({ ...f, done: 1, total: 3, now })]) {
    assert.ok(!e.html.includes("<script>"), "no raw script tag");
    assert.ok(!e.html.includes("<b>Ann"), "no raw markup from a name");
    assert.ok(!e.html.includes("<i>B</i>"), "no raw markup from a class name");
    assert.ok(e.html.includes("&lt;script&gt;"));
  }
});

test("set email content", () => {
  const e = setHomeworkEmail({
    studentName: "Ann Smith",
    className: "10A",
    title: "Loops",
    instructions: "",
    dueAt: at("2026-10-03T15:00:00Z").toISOString(),
    homeworkId: "hw1",
    siteUrl: "https://www.hcodeacademy.co.uk",
  });
  assert.equal(e.subject, "New homework: Loops");
  assert.ok(e.html.includes("Hi Ann,"), "first name only");
  assert.ok(e.html.includes("Saturday 3 October at 16:00"), "due time in UK time (BST)");
  assert.ok(e.html.includes("https://www.hcodeacademy.co.uk/homework/hw1"));
});

test("set email without a deadline says so", () => {
  const e = setHomeworkEmail({
    studentName: "",
    className: "10A",
    title: "Loops",
    instructions: "",
    dueAt: null,
    homeworkId: "hw1",
    siteUrl: "https://x",
  });
  assert.ok(e.html.includes("No deadline"));
  assert.ok(e.html.includes("Hi there,"));
});

test("reminder email content", () => {
  const e = reminderEmail({
    studentName: "Ben Jones",
    className: "10A",
    title: "Loops",
    instructions: "",
    dueAt: hoursFrom(now, 20),
    homeworkId: "hw1",
    siteUrl: "https://x",
    done: 1,
    total: 4,
    now,
  });
  assert.equal(e.subject, 'Reminder: "Loops" is due in about 20 hours');
  assert.ok(e.html.includes("1 of 4 tasks done"));
  assert.ok(e.html.includes("3 still to do"));
});

// ---- the run, against an in-memory store --------------------------------

function fakeStore(opts: {
  homework: HomeworkRow[];
  members: Record<string, Recipient[]>;
  progress?: Record<string, { done: number; total: number; hasTasks: boolean }>;
  claimed?: [string, string, EmailKind][];
}) {
  const claims = new Set((opts.claimed ?? []).map((c) => c.join("|")));
  const store: EmailStore = {
    homeworkDueBetween: async (from, to) =>
      opts.homework.filter((h) => h.due_at && new Date(h.due_at) > from && new Date(h.due_at) <= to),
    homeworkCreatedSince: async (since) => opts.homework.filter((h) => new Date(h.created_at) >= since),
    homeworkById: async (id) => opts.homework.find((h) => h.id === id) ?? null,
    className: async () => "10A",
    recipients: async (c) => opts.members[c] ?? [],
    alreadyEmailed: async (hid, kind) =>
      new Set([...claims].filter((c) => c.startsWith(hid + "|") && c.endsWith("|" + kind)).map((c) => c.split("|")[1]!)),
    progress: async (hw, s) => opts.progress?.[s] ?? { done: 0, total: 4, hasTasks: true },
    claim: async (h, s, k) => {
      const key = [h, s, k].join("|");
      if (claims.has(key)) return false;
      claims.add(key);
      return true;
    },
    release: async (h, s, k) => {
      claims.delete([h, s, k].join("|"));
    },
  };
  return { store, claims };
}

const ann: Recipient = { studentId: "ann", name: "Ann A", email: "ann@x.test" };
const ben: Recipient = { studentId: "ben", name: "Ben B", email: "ben@x.test" };
const day = at("2026-10-01T12:00:00Z"); // 13:00 BST
const hw = (over: Partial<HomeworkRow> = {}): HomeworkRow => ({
  id: "h1",
  class_id: "c1",
  title: "Loops",
  instructions: "",
  due_at: hoursFrom(day, 72),
  created_at: hoursFrom(day, -1),
  ...over,
});
const recorder = () => {
  const sent: { to: string; subject: string }[] = [];
  return { sent, send: async (to: string, subject: string) => (sent.push({ to, subject }), true) };
};

test("set: emails each student once, and only once", async () => {
  const { store } = fakeStore({ homework: [hw()], members: { c1: [ann, ben] } });
  const r = recorder();
  const deps = { store, send: r.send, now: day, siteUrl: "https://x" };
  const first = await sendSetEmailsFor(hw(), deps);
  assert.deepEqual([first.sent, first.failed], [2, 0]);
  const again = await sendSetEmailsFor(hw(), deps);
  assert.equal(again.sent, 0, "a second press of the button emails nobody again");
  assert.deepEqual(r.sent.map((s) => s.to).sort(), ["ann@x.test", "ben@x.test"]);
});

test("set: held overnight, then sent by the morning run", async () => {
  const night = at("2026-10-01T21:30:00Z"); // 22:30 BST
  const { store } = fakeStore({ homework: [hw({ created_at: night.toISOString() })], members: { c1: [ann] } });
  const r = recorder();
  const held = await sendSetEmailsFor(hw(), { store, send: r.send, now: night, siteUrl: "https://x" });
  assert.equal(held.held, "quiet-hours");
  assert.equal(r.sent.length, 0);
  const morning = at("2026-10-02T06:05:00Z"); // 07:05 BST
  const run = await runHourly({ store, send: r.send, now: morning, siteUrl: "https://x" });
  assert.equal(run.sent, 1, "the held email goes out in the morning");
  assert.equal(r.sent[0]!.subject, "New homework: Loops");
});

test("a failed send is not recorded, so the next run retries it", async () => {
  const { store, claims } = fakeStore({ homework: [hw()], members: { c1: [ann] } });
  const failing = await sendSetEmailsFor(hw(), { store, send: async () => false, now: day, siteUrl: "https://x" });
  assert.deepEqual([failing.sent, failing.failed], [0, 1]);
  assert.equal(claims.size, 0);
  const r = recorder();
  const retry = await runHourly({ store, send: r.send, now: new Date(day.getTime() + 3_600_000), siteUrl: "https://x" });
  assert.equal(retry.sent, 1);
});

test("a send that throws counts as a failure and is released", async () => {
  const { store, claims } = fakeStore({ homework: [hw()], members: { c1: [ann, ben] } });
  let n = 0;
  const flaky = async () => {
    if (n++ === 0) throw new Error("network");
    return true;
  };
  const res = await sendSetEmailsFor(hw(), { store, send: flaky, now: day, siteUrl: "https://x" });
  assert.deepEqual([res.sent, res.failed], [1, 1], "one bad send doesn't stop the rest");
  assert.equal(claims.size, 1);
});

test("reminders: only unfinished students of homework due within a day", async () => {
  const due = hw({ due_at: hoursFrom(day, 20), created_at: hoursFrom(day, -72) });
  const far = hw({ id: "h2", due_at: hoursFrom(day, 60), created_at: hoursFrom(day, -72) });
  const { store } = fakeStore({
    homework: [due, far],
    members: { c1: [ann, ben] },
    progress: { ann: { done: 4, total: 4, hasTasks: true }, ben: { done: 1, total: 4, hasTasks: true } },
    claimed: [
      ["h1", "ann", "set"],
      ["h1", "ben", "set"],
      ["h2", "ann", "set"],
      ["h2", "ben", "set"],
    ],
  });
  const r = recorder();
  const res = await runHourly({ store, send: r.send, now: day, siteUrl: "https://x" });
  assert.equal(res.sent, 1);
  assert.equal(r.sent[0]!.to, "ben@x.test");
  assert.match(r.sent[0]!.subject, /^Reminder:/);
  const again = await runHourly({ store, send: r.send, now: new Date(day.getTime() + 3_600_000), siteUrl: "https://x" });
  assert.equal(again.sent, 0, "one reminder per student per homework");
});

test("reminders: nothing in quiet hours, but the window stays open for the morning", async () => {
  const due = hw({ due_at: "2026-10-02T09:00:00Z", created_at: "2026-09-28T09:00:00Z" });
  const { store } = fakeStore({
    homework: [due],
    members: { c1: [ben] },
    claimed: [["h1", "ben", "set"]],
  });
  const r = recorder();
  const night = await runHourly({ store, send: r.send, now: at("2026-10-01T22:00:00Z"), siteUrl: "https://x" });
  assert.equal(night.held, "quiet-hours");
  assert.equal(r.sent.length, 0);
  const morning = await runHourly({ store, send: r.send, now: at("2026-10-02T06:10:00Z"), siteUrl: "https://x" });
  assert.equal(morning.sent, 1);
});

test("catch-up: overdue homework gets no 'set' email", async () => {
  const past = hw({ due_at: hoursFrom(day, -2), created_at: hoursFrom(day, -30) });
  const { store } = fakeStore({ homework: [past], members: { c1: [ann] } });
  const r = recorder();
  const res = await runHourly({ store, send: r.send, now: day, siteUrl: "https://x" });
  assert.equal(res.sent, 0);
});

test("one run never sends more than its cap", async () => {
  const many: Recipient[] = Array.from({ length: 10 }, (_, i) => ({
    studentId: "s" + i,
    name: "S" + i,
    email: `s${i}@x.test`,
  }));
  const { store } = fakeStore({ homework: [hw()], members: { c1: many } });
  const r = recorder();
  const res = await runHourly({ store, send: r.send, now: day, siteUrl: "https://x", maxEmails: 4 });
  assert.equal(res.sent, 4);
  const next = await runHourly({ store, send: r.send, now: day, siteUrl: "https://x", maxEmails: 4 });
  assert.equal(next.sent, 4, "the next run carries on where it stopped, without repeating anyone");
  assert.equal(new Set(r.sent.map((s) => s.to)).size, 8);
});
