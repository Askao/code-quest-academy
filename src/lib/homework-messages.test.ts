import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isUnfinished,
  runPendingMessages,
  sendMessageEmailsFor,
  teacherMessageEmail,
  validateMessageBody,
  type Audience,
  type MessageDeps,
  type MessageRow,
  type MessageStore,
  type Progress,
} from "./homework-messages.ts";
import type { HomeworkRow, Recipient } from "./homework-emails.ts";

// 2026-10-01 is British Summer Time: 12:00Z is 13:00 in the UK, 21:00Z is 22:00.
const DAY = new Date("2026-10-01T12:00:00Z");
const NIGHT = new Date("2026-10-01T21:00:00Z");

const HW: HomeworkRow = {
  id: "hw1",
  class_id: "c1",
  title: "Iteration: loops",
  instructions: "",
  due_at: "2026-10-06T15:00:00Z",
  created_at: "2026-09-28T09:00:00Z",
};

function msg(audience: Audience, id = "m1"): MessageRow {
  return { id, homework_id: "hw1", body: "Question 4 needs a while loop.", audience, created_at: DAY.toISOString(), processed_at: null };
}

const people: Recipient[] = [
  { studentId: "s1", name: "Ann Smith", email: "ann@x" },
  { studentId: "s2", name: "Ben Jones", email: "ben@x" },
  { studentId: "s3", name: "Cai Wu", email: "cai@x" },
];
const progressOf: Record<string, Progress> = {
  s1: { done: 5, total: 5, hasTasks: true }, // finished
  s2: { done: 2, total: 5, hasTasks: true }, // part way
  s3: { done: 0, total: 5, hasTasks: true }, // not started
};

function fakeStore(opts: { homework?: HomeworkRow | null; pending?: MessageRow[] } = {}) {
  const claimed = new Set<string>();
  const processed = new Set<string>();
  const store: MessageStore = {
    homeworkDueBetween: async () => [],
    homeworkCreatedSince: async () => [],
    homeworkById: async () => (opts.homework === undefined ? HW : opts.homework),
    className: async () => "10B2",
    recipients: async () => people,
    alreadyEmailed: async () => new Set(),
    progress: async (_hw, studentId) => progressOf[studentId]!,
    claim: async () => true,
    release: async () => {},
    messageById: async () => null,
    messagesPending: async () => (opts.pending ?? []).filter((m) => !processed.has(m.id)),
    claimMessageEmail: async (m, s) => {
      const key = `${m}:${s}`;
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    },
    releaseMessageEmail: async (m, s) => {
      claimed.delete(`${m}:${s}`);
    },
    markMessageProcessed: async (m) => {
      processed.add(m);
    },
  };
  return { store, claimed, processed };
}

function deps(store: MessageStore, over: Partial<MessageDeps> & { sent?: string[]; failFor?: string[] } = {}): MessageDeps {
  const sent = over.sent ?? [];
  return {
    store,
    now: DAY,
    siteUrl: "https://www.hcodeacademy.co.uk",
    send: async (to) => {
      if (over.failFor?.includes(to)) return false;
      sent.push(to);
      return true;
    },
    ...(over.maxEmails ? { maxEmails: over.maxEmails } : {}),
    ...(over.now ? { now: over.now } : {}),
  };
}

test("a message to everyone reaches the whole roster, finished or not", async () => {
  const { store, processed } = fakeStore();
  const sent: string[] = [];
  const r = await sendMessageEmailsFor(msg("all"), deps(store, { sent }));
  assert.deepEqual(sent, ["ann@x", "ben@x", "cai@x"]);
  assert.equal(r.sent, 3);
  assert.ok(processed.has("m1"), "marked done once everyone has been dealt with");
});

test("a message to unfinished students skips anyone who has finished", async () => {
  const { store } = fakeStore();
  const sent: string[] = [];
  const r = await sendMessageEmailsFor(msg("unfinished"), deps(store, { sent }));
  assert.deepEqual(sent, ["ben@x", "cai@x"]);
  assert.equal(r.skipped, 1);
});

test("nobody is emailed twice, however often it runs", async () => {
  const { store } = fakeStore();
  const sent: string[] = [];
  await sendMessageEmailsFor(msg("all"), deps(store, { sent }));
  await sendMessageEmailsFor(msg("all"), deps(store, { sent }));
  assert.equal(sent.length, 3);
});

test("nothing is sent in the evening, and the message stays pending", async () => {
  const { store, processed } = fakeStore();
  const sent: string[] = [];
  const r = await sendMessageEmailsFor(msg("all"), deps(store, { sent, now: NIGHT }));
  assert.equal(r.held, "quiet-hours");
  assert.equal(sent.length, 0);
  assert.ok(!processed.has("m1"));
});

test("the hourly catch-up sends a held message in the morning, once", async () => {
  const held = msg("all");
  const { store, processed } = fakeStore({ pending: [held] });
  const sent: string[] = [];
  assert.equal((await runPendingMessages(deps(store, { sent, now: NIGHT }))).held, "quiet-hours");
  await runPendingMessages(deps(store, { sent }));
  assert.equal(sent.length, 3);
  assert.ok(processed.has("m1"));
  await runPendingMessages(deps(store, { sent }));
  assert.equal(sent.length, 3, "a finished message is not picked up again");
});

test("a failed send is released and retried, without re-sending to the others", async () => {
  const { store, claimed, processed } = fakeStore({ pending: [msg("all")] });
  const sent: string[] = [];
  const first = await sendMessageEmailsFor(msg("all"), deps(store, { sent, failFor: ["ben@x"] }));
  assert.equal(first.failed, 1);
  assert.deepEqual(sent, ["ann@x", "cai@x"]);
  assert.ok(!claimed.has("m1:s2"), "the failure was released");
  assert.ok(!processed.has("m1"), "so it is retried");
  await runPendingMessages(deps(store, { sent }));
  assert.deepEqual(sent, ["ann@x", "cai@x", "ben@x"]);
  assert.ok(processed.has("m1"));
});

test("a message too big for one run's budget carries over", async () => {
  const { store, processed } = fakeStore({ pending: [msg("all")] });
  const sent: string[] = [];
  await sendMessageEmailsFor(msg("all"), deps(store, { sent, maxEmails: 2 }));
  assert.equal(sent.length, 2);
  assert.ok(!processed.has("m1"));
  await runPendingMessages(deps(store, { sent, maxEmails: 2 }));
  assert.equal(sent.length, 3);
  assert.ok(processed.has("m1"));
});

test("a deleted homework just closes the message off", async () => {
  const { store, processed } = fakeStore({ homework: null });
  const sent: string[] = [];
  await sendMessageEmailsFor(msg("all"), deps(store, { sent }));
  assert.equal(sent.length, 0);
  assert.ok(processed.has("m1"));
});

test("unfinished means anything short of every task, or no list yet", () => {
  assert.equal(isUnfinished({ done: 5, total: 5, hasTasks: true }), false);
  assert.equal(isUnfinished({ done: 4, total: 5, hasTasks: true }), true);
  assert.equal(isUnfinished({ done: 0, total: 0, hasTasks: false }), true);
  assert.equal(isUnfinished({ done: 0, total: 0, hasTasks: true }), true);
});

const fields = {
  studentName: "Ann Smith",
  className: "10B2",
  title: "Iteration: loops",
  body: "Question 4 needs a while loop.\n\nBring your code on Thursday.",
  dueAt: "2026-10-06T15:00:00Z",
  homeworkId: "hw1",
  siteUrl: "https://www.hcodeacademy.co.uk",
  progress: { done: 3, total: 5, hasTasks: true },
};

test("the email carries the message, the student's own progress and a link", () => {
  const e = teacherMessageEmail(fields);
  assert.equal(e.subject, 'Message from your teacher about "Iteration: loops"');
  assert.ok(e.html.includes("Hi Ann,"));
  assert.ok(e.html.includes("Question 4 needs a while loop."));
  assert.ok(e.html.includes("white-space: pre-line"), "line breaks in the message survive");
  assert.ok(e.html.includes("3 of 5 tasks done"));
  assert.ok(e.html.includes("Tuesday 6 October at 16:00"));
  assert.ok(e.html.includes("https://www.hcodeacademy.co.uk/homework/hw1"));
  assert.ok(e.html.includes("You can't reply"));
});

test("the progress row is left out when there is no task list", () => {
  const e = teacherMessageEmail({ ...fields, progress: { done: 0, total: 0, hasTasks: false } });
  assert.ok(!e.html.includes("Your progress"));
});

test("everything a person typed is escaped", () => {
  const e = teacherMessageEmail({
    ...fields,
    studentName: "<b>Ann</b>",
    body: '<script>alert("x")</script> & <a href="https://evil">click</a>',
    title: "<i>Loops</i>",
    className: "10<B>",
  });
  assert.ok(!e.html.includes("<script>"));
  assert.ok(!e.html.includes('<a href="https://evil"'));
  assert.ok(!e.html.includes("<b>Ann"));
  assert.ok(e.html.includes("&lt;script&gt;"));
});

test("message text is trimmed, required and limited to 1000 characters", () => {
  assert.deepEqual(validateMessageBody("  hello  "), { ok: true, body: "hello" });
  assert.equal(validateMessageBody("   ").ok, false);
  assert.equal(validateMessageBody("x".repeat(1000)).ok, true);
  assert.equal(validateMessageBody("x".repeat(1001)).ok, false);
});
