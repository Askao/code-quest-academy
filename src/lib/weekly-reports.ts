/**
 * The weekly student and teacher emails: which week, who gets one, what it
 * says. No database or network access here (weekly-reports.server.ts supplies
 * the data and the sender), so every rule can be tested. The design and the
 * reasoning behind each choice are in the "Weekly reports" mock-up.
 */
import { AVATARS, BANNERS, levelFromXp, topicLabel } from "./game.ts";
import { ctaButton, escapeHtml, shellHtml } from "./email-shell.ts";
import { formatDue, type EmailContent } from "./homework-emails.ts";

// ---------------------------------------------------------------------------
// Data the database hands over (see 20261003110000_weekly_reports.sql)
// ---------------------------------------------------------------------------

export type StudentWeek = {
  student_id: string;
  tasks_passed: number;
  prev_tasks_passed: number;
  xp_earned: number;
  xp_total: number;
  /** UK dates (YYYY-MM-DD) the student attempted something in the window. */
  active_dates: string[];
  topics: Record<string, number>;
  attempts_in_window: number;
  /** Attempts up to and including each task's first pass, so replays can't move accuracy. */
  attempts_counted: number;
  passed_counted: number;
  last_attempt_at: string | null;
  stuck_topics: string[];
};

export type HomeworkStatus = {
  student_id: string;
  homework_id: string;
  class_id: string;
  class_name: string;
  title: string;
  due_at: string | null;
  total: number;
  done: number;
  last_pass: string | null;
  next_task: string | null;
};

export type ResultRow = { student_id: string; title: string; awarded: number; total: number };
export type MarkingRow = { class_id: string; assessment_id: string; title: string; submitted: number; unmarked: number };

// ---------------------------------------------------------------------------
// UK time and the report weeks
// ---------------------------------------------------------------------------

const TZ = "Europe/London";
const DAY_MS = 86_400_000;
export const OVERDUE_RELEVANT_DAYS = 21;
export const INACTIVE_AFTER_DAYS = 14;
/** On a student who is already flagged for something else, a gap this long is worth a mention. */
export const IDLE_NOTE_AFTER_DAYS = 7;

export type UkParts = { year: number; month: number; day: number; weekday: number; hour: number };

/** Calendar date, weekday (0 = Sunday) and hour as they are in the UK at that instant. */
export function ukParts(at: Date): UkParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(at);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday,
    hour: Number(get("hour")) % 24,
  };
}

type CalDate = { year: number; month: number; day: number };

function addDays(d: CalDate, n: number): CalDate {
  const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() };
}

export function isoDate(d: CalDate): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/** The instant midnight starts on this UK calendar date (an hour earlier in UTC during summer time). */
export function ukMidnightUtc(d: CalDate): Date {
  for (const hourOffset of [0, -1]) {
    const candidate = new Date(Date.UTC(d.year, d.month - 1, d.day, hourOffset));
    const p = ukParts(candidate);
    if (p.day === d.day && p.month === d.month && p.hour === 0) return candidate;
  }
  return new Date(Date.UTC(d.year, d.month - 1, d.day));
}

function mondayOf(now: Date): CalDate {
  const p = ukParts(now);
  return addDays(p, -((p.weekday + 6) % 7));
}

export type ReportWindow = {
  from: Date;
  to: Date;
  prevFrom: Date;
  /** The Monday it starts on, used to record that this week's email has been sent. */
  weekStart: string;
  /** Monday to Sunday, as UK dates. */
  days: string[];
};

function daysFrom(monday: CalDate): string[] {
  return Array.from({ length: 7 }, (_, i) => isoDate(addDays(monday, i)));
}

/** Sunday evening: this week so far, Monday 00:00 UK until now. */
export function studentWindow(now: Date): ReportWindow {
  const monday = mondayOf(now);
  return {
    from: ukMidnightUtc(monday),
    to: now,
    prevFrom: ukMidnightUtc(addDays(monday, -7)),
    weekStart: isoDate(monday),
    days: daysFrom(monday),
  };
}

/** Monday morning: the week that has just finished, Monday 00:00 to Sunday 24:00 UK. */
export function teacherWindow(now: Date): ReportWindow {
  const thisMonday = mondayOf(now);
  const monday = addDays(thisMonday, -7);
  return {
    from: ukMidnightUtc(monday),
    to: ukMidnightUtc(thisMonday),
    prevFrom: ukMidnightUtc(addDays(monday, -7)),
    weekStart: isoDate(monday),
    days: daysFrom(monday),
  };
}

export type ReportKind = "student" | "teacher";

/** Students are emailed from 17:00 on Sunday and teachers from 07:00 on Monday, never after 21:00. */
export function reportDue(now: Date): ReportKind | null {
  const p = ukParts(now);
  if (p.hour >= 21) return null;
  if (p.weekday === 0 && p.hour >= 17) return "student";
  if (p.weekday === 1 && p.hour >= 7) return "teacher";
  return null;
}

const fmt = (opts: Intl.DateTimeFormatOptions, d: Date) => new Intl.DateTimeFormat("en-GB", { timeZone: TZ, ...opts }).format(d);

function weekRange(from: Date, to: Date): string {
  const end = new Date(to.getTime() - 1);
  const long = { weekday: "long", day: "numeric", month: "long" } as const;
  return `${fmt(long, from)} to ${fmt(long, end)}`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function firstName(full: string): string {
  return full.trim().split(/\s+/)[0] || "there";
}

/** "Marcus T." - enough to know who, without a full name travelling by email. */
export function shortName(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A student";
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${parts[parts.length - 1]![0]!.toUpperCase()}.`;
}

// ---------------------------------------------------------------------------
// Homework relevance
// ---------------------------------------------------------------------------

export type OpenHomework = {
  homeworkId: string;
  title: string;
  className: string;
  dueAt: string | null;
  done: number;
  total: number;
  overdue: boolean;
  nextTask: string | null;
};

const isUnfinished = (h: HomeworkStatus) => h.total > 0 && h.done < h.total;

/** Unfinished homework worth mentioning: due ahead, or overdue by less than three weeks. Overdue first, then soonest due. */
export function outstandingHomework(items: HomeworkStatus[], now: Date): OpenHomework[] {
  const oldest = now.getTime() - OVERDUE_RELEVANT_DAYS * DAY_MS;
  return items
    .filter((h) => isUnfinished(h) && (!h.due_at || new Date(h.due_at).getTime() >= oldest))
    .map((h) => ({
      homeworkId: h.homework_id,
      title: h.title,
      className: h.class_name,
      dueAt: h.due_at,
      done: h.done,
      total: h.total,
      overdue: !!h.due_at && new Date(h.due_at).getTime() < now.getTime(),
      nextTask: h.next_task,
    }))
    .sort((a, b) => {
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
      const ad = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const bd = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
      return ad - bd;
    });
}

function finishedThisWeek(items: HomeworkStatus[], from: Date, to: Date): HomeworkStatus[] {
  return items.filter(
    (h) =>
      h.total > 0 &&
      h.done === h.total &&
      !!h.last_pass &&
      new Date(h.last_pass).getTime() >= from.getTime() &&
      new Date(h.last_pass).getTime() < to.getTime(),
  );
}

function dueWord(dueAt: string, now: Date): string {
  const ms = new Date(dueAt).getTime() - now.getTime();
  if (ms < 7 * DAY_MS) return `on ${fmt({ weekday: "long" }, new Date(dueAt))}`;
  return `on ${fmt({ day: "numeric", month: "long" }, new Date(dueAt))}`;
}

// ---------------------------------------------------------------------------
// Email pieces (inline styles, like every other H-Code email)
// ---------------------------------------------------------------------------

const label = (text: string) =>
  `<p style="font-family: monospace; font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: #8c8c94; margin: 26px 0 10px;">${escapeHtml(text)}</p>`;

type Chip = "red" | "amber" | "green" | "plain";
const CHIPS: Record<Chip, string> = {
  red: "background: #3a1d1f; color: #f1a3a3;",
  amber: "background: #3a2f17; color: #f0cf86;",
  green: "background: #1b3022; color: #9ad6a6;",
  plain: "background: #17171b; color: #cfcfd4; border: 1px solid #2b2b31;",
};
const chip = (text: string, kind: Chip) =>
  `<span style="display: inline-block; font-size: 12px; font-weight: 600; padding: 2px 9px; border-radius: 999px; white-space: nowrap; ${CHIPS[kind]}">${escapeHtml(text)}</span>`;

function bar(done: number, total: number, red = false): string {
  const pct = total > 0 ? Math.max(4, Math.round((done / total) * 100)) : 0;
  return `<div style="height: 6px; background: #2b2b31; border-radius: 3px; margin-top: 8px; overflow: hidden;"><div style="height: 6px; width: ${pct}%; background: ${red ? "#f1a3a3" : "#e8c27a"};"></div></div>`;
}

function item(opts: { name: string; chipHtml?: string; lines: string[]; barHtml?: string }): string {
  return `<div style="padding: 12px 0; border-top: 1px solid #2b2b31;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;"><tr>
      <td style="font-weight: 600;">${opts.name}</td>
      <td style="text-align: right; vertical-align: top;">${opts.chipHtml ?? ""}</td>
    </tr></table>
    ${opts.lines.map((l) => `<div style="color: #8c8c94; font-size: 13px; margin-top: 2px;">${l}</div>`).join("")}
    ${opts.barHtml ?? ""}
  </div>`;
}

const box = (html: string) =>
  `<div style="border: 1px solid #2b2b31; background: #17171b; border-radius: 8px; padding: 14px 16px; color: #cfcfd4;">${html}</div>`;

function tile(big: string, caption: string, note?: string, extra = ""): string {
  return `<td style="vertical-align: top; width: 33%; padding: 0 5px 0 0;">
    <div style="border: 1px solid #2b2b31; background: #17171b; border-radius: 8px; padding: 12px 14px;">
      <div style="font-size: 26px; font-weight: 700; line-height: 1.1;">${big}</div>
      <div style="color: #cfcfd4; font-size: 13px;">${escapeHtml(caption)}</div>
      ${note ? `<div style="color: #8c8c94; font-size: 12.5px; margin-top: 4px;">${escapeHtml(note)}</div>` : ""}
      ${extra}
    </div>
  </td>`;
}

const preheader = (text: string) =>
  `<div style="display: none; max-height: 0; overflow: hidden; color: transparent; opacity: 0;">${escapeHtml(text)}</div>`;

const statRow = (left: string, right: string) =>
  `<table role="presentation" style="width: 100%; border-collapse: collapse;"><tr><td style="padding: 6px 0; color: #cfcfd4; font-size: 14px;">${left}</td><td style="padding: 6px 0; text-align: right; font-weight: 600; font-size: 14px;">${right}</td></tr></table>`;

// ---------------------------------------------------------------------------
// Student email
// ---------------------------------------------------------------------------

export type StudentEmailInput = {
  name: string;
  week: StudentWeek;
  /** This student's homework rows. */
  homework: HomeworkStatus[];
  results: ResultRow[];
  window: ReportWindow;
  now: Date;
  siteUrl: string;
};

/** Someone who was active this week, or who still owes homework. Everyone else is left alone. */
export function studentReportWanted(week: StudentWeek | undefined, open: OpenHomework[]): boolean {
  return (week?.attempts_in_window ?? 0) > 0 || open.length > 0;
}

/** Level-gated avatars and banners passed between two XP totals, for the "New in your Locker" line. */
export function newCosmetics(xpBefore: number, xpAfter: number): { level: number; unlocked: string[]; levelUp: boolean } {
  const before = levelFromXp(xpBefore).level;
  const level = levelFromXp(xpAfter).level;
  const unlocked = [...AVATARS, ...BANNERS]
    .filter((c) => /^Reach level \d+$/.test(c.requirement))
    .filter((c) => {
      const need = Number(c.requirement.replace("Reach level ", ""));
      return need > before && need <= level;
    })
    .map((c) => `${c.name} ${AVATARS.some((a) => a.key === c.key) ? "avatar" : "banner"}`);
  return { level, unlocked, levelUp: level > before };
}

export function studentSubject(passed: number, open: number): string {
  if (passed > 0 && open > 0) return `Your week on H-Code: ${plural(passed, "task")} passed, ${plural(open, "homework")} to finish`;
  if (open > 0) return `Your week on H-Code: ${plural(open, "homework")} to finish`;
  if (passed > 0) return `Your week on H-Code: ${plural(passed, "task")} passed, nothing outstanding`;
  return "Your week on H-Code";
}

export function buildStudentEmail(i: StudentEmailInput): EmailContent {
  const { week, window, now, siteUrl } = i;
  const open = outstandingHomework(i.homework, now);
  const finished = finishedThisWeek(i.homework, window.from, window.to);
  const shown = open.slice(0, 5);

  const overdueCount = open.filter((h) => h.overdue).length;
  const upcoming = open.find((h) => !h.overdue && h.dueAt);
  const summary =
    open.length === 0
      ? `<b style="color: #eee;">Nothing outstanding.</b> You are all caught up.`
      : `<b style="color: #eee;">${plural(open.length, "homework")} still to do.</b> ${[
          overdueCount > 0 ? `${overdueCount} overdue` : "",
          upcoming?.dueAt ? `next due ${dueWord(upcoming.dueAt, now)}` : "",
        ]
          .filter(Boolean)
          .join(", ")
          .replace(/^./, (c) => c.toUpperCase())}${overdueCount > 0 || upcoming ? "." : ""}`;

  const homeworkHtml =
    open.length === 0 && finished.length === 0
      ? ""
      : `${label("Homework to finish")}
    ${
      open.length === 0
        ? `<div style="padding: 12px 0; border-top: 1px solid #2b2b31; border-bottom: 1px solid #2b2b31; color: #cfcfd4;">Nothing outstanding.</div>`
        : shown
            .map((h) =>
              item({
                name: escapeHtml(h.title),
                chipHtml: h.overdue
                  ? chip("Overdue", "red")
                  : h.dueAt
                    ? chip(`Due ${fmt({ weekday: "long" }, new Date(h.dueAt))}`, "amber")
                    : chip("No deadline", "plain"),
                lines: [
                  `${escapeHtml(h.className)}${h.dueAt ? ` &middot; ${h.overdue ? "was due " : ""}${escapeHtml(formatDue(h.dueAt))}` : ""}`,
                  `${h.done} of ${h.total} tasks done`,
                ],
                barHtml: bar(h.done, h.total, h.overdue),
              }),
            )
            .join("")
    }
    ${open.length > shown.length ? `<p style="color: #8c8c94; font-size: 13px; margin: 8px 0 0;">${plural(open.length - shown.length, "more homework", "more homeworks")} on your homework page.</p>` : ""}
    ${finished
      .slice(0, 3)
      .map((h) =>
        item({
          name: escapeHtml(h.title),
          chipHtml: chip(`Finished ${fmt({ weekday: "long" }, new Date(h.last_pass!))}`, "green"),
          lines: [`${escapeHtml(h.class_name)} &middot; all ${h.total} tasks done`],
        }),
      )
      .join("")}`;

  const level = levelFromXp(week.xp_total);
  const gained = week.tasks_passed - week.prev_tasks_passed;
  const delta =
    gained > 0 ? `${gained} more than last week` : gained < 0 ? `${-gained} fewer than last week` : "Same as last week";
  const dayLetters = ["M", "T", "W", "T", "F", "S", "S"];
  const active = new Set(week.active_dates);
  const strip = window.days
    .map((d, n) => {
      const on = active.has(d);
      return `<span style="display: inline-block; width: 16px; height: 16px; line-height: 16px; border-radius: 50%; text-align: center; font-size: 8.5px; margin-right: 4px; ${
        on ? "background: #e8c27a; border: 1px solid #e8c27a; color: #111; font-weight: 700;" : "border: 1px solid #2b2b31; color: #8c8c94;"
      }">${dayLetters[n]}</span>`;
    })
    .join("");
  const daysActive = window.days.filter((d) => active.has(d)).length;

  const tiles = `<table role="presentation" style="width: 100%; border-collapse: collapse;"><tr>
    ${tile(String(week.tasks_passed), "tasks passed", delta)}
    ${tile(String(week.xp_earned), "XP earned", `Level ${level.level}, ${level.needed - level.intoLevel} XP to level ${level.level + 1}`)}
    ${tile(String(daysActive), "days active", undefined, `<div style="margin-top: 8px;">${strip}</div>`)}
  </tr></table>`;

  const worked = Object.entries(week.topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([topic, n]) => statRow(escapeHtml(topicLabel(topic)), `${plural(n, "task")} passed`))
    .join("");

  const locker = newCosmetics(week.xp_total - week.xp_earned, week.xp_total);
  const lockerText = locker.levelUp
    ? `You reached level ${locker.level}${locker.unlocked.length ? ` and unlocked the ${locker.unlocked.join(" and the ")}` : ""}.`
    : "";

  const resultsHtml = i.results
    .map((r) => statRow(escapeHtml(r.title), `${r.awarded} out of ${r.total}${r.total > 0 ? ` (${Math.round((r.awarded / r.total) * 100)}%)` : ""}`))
    .join("");

  const first = open[0];
  const nextStep = first
    ? `${first.nextTask ? `Start with ${escapeHtml(first.nextTask)} in ${escapeHtml(first.title)}.` : `Open ${escapeHtml(first.title)}.`}${first.overdue ? " It is overdue, so it is the best place to begin." : ""}`
    : "You are up to date. A task in Practice is a good way to keep your streak going.";
  const link = first ? `${siteUrl}/homework/${first.homeworkId}` : `${siteUrl}/practice`;

  const intro =
    week.tasks_passed === 0
      ? `Hi ${escapeHtml(firstName(i.name))}, no tasks passed this week. The quickest way back in is below.`
      : `Hi ${escapeHtml(firstName(i.name))}, here is how your week went.`;

  const subject = studentSubject(week.tasks_passed, open.length);
  const pre = first ? `${first.title}${first.overdue ? " is overdue" : first.dueAt ? ` is due ${dueWord(first.dueAt, now)}` : ""}. ${first.done} of ${first.total} tasks done.` : "Here is your week on H-Code.";

  return {
    subject,
    html: shellHtml(`
    ${preheader(pre)}
    <h1 style="font-size: 24px; margin: 0 0 4px;">Your week, ${escapeHtml(firstName(i.name))}</h1>
    <p style="color: #8c8c94; margin: 0 0 6px; font-size: 14px;">${escapeHtml(weekRange(window.from, window.to))}</p>
    <p style="color: #cfcfd4; margin: 0 0 16px;">${intro}</p>
    ${box(summary)}
    ${homeworkHtml}
    ${label("Your week")}
    ${tiles}
    ${worked ? `${label("What you worked on")}${worked}` : ""}
    ${lockerText ? `${label("New in your Locker")}<p style="margin: 0; color: #cfcfd4;">${escapeHtml(lockerText)}</p>` : ""}
    ${resultsHtml ? `${label("Results in")}${resultsHtml}` : ""}
    ${label("Start here")}
    <p style="margin: 0; color: #cfcfd4;">${nextStep}</p>
    ${ctaButton(link, first ? "Open the homework" : "Open Practice")}
    <p style="color: #888; font-size: 12px; margin: 32px 0 0;">You get this every Sunday because you have an account on H-Code. Your teacher can see the same numbers. To stop these emails, turn them off on your <a href="${siteUrl}/account" style="color: #e8c27a;">account page</a>.</p>
  `),
  };
}

// ---------------------------------------------------------------------------
// Teacher email
// ---------------------------------------------------------------------------

export type TeacherClass = { id: string; name: string; studentIds: string[] };

export type TeacherEmailInput = {
  teacherName: string;
  classes: TeacherClass[];
  weeks: Map<string, StudentWeek>;
  homework: HomeworkStatus[];
  marking: MarkingRow[];
  /** Full names by student id. */
  names: Map<string, string>;
  window: ReportWindow;
  now: Date;
  siteUrl: string;
};

type Flag = {
  studentId: string;
  className: string;
  overdue: HomeworkStatus[];
  stuckTopic: string | null;
  inactiveDays: number | null;
  neverStarted: boolean;
};

const classOf = (classes: TeacherClass[], studentId: string) => classes.find((c) => c.studentIds.includes(studentId));

function computeFlags(i: TeacherEmailInput): Flag[] {
  const oldest = i.now.getTime() - OVERDUE_RELEVANT_DAYS * DAY_MS;
  const out: Flag[] = [];
  for (const c of i.classes) {
    for (const studentId of c.studentIds) {
      if (classOf(i.classes, studentId)?.id !== c.id) continue;
      const week = i.weeks.get(studentId);
      const overdue = i.homework.filter(
        (h) =>
          h.student_id === studentId &&
          isUnfinished(h) &&
          !!h.due_at &&
          new Date(h.due_at).getTime() < i.now.getTime() &&
          new Date(h.due_at).getTime() >= oldest,
      );
      const last = week?.last_attempt_at ? new Date(week.last_attempt_at).getTime() : null;
      const idleDays = last === null ? null : Math.floor((i.now.getTime() - last) / DAY_MS);
      const inactive = last === null || (idleDays ?? 0) >= INACTIVE_AFTER_DAYS;
      const stuck = week?.stuck_topics?.[0] ?? null;
      if (overdue.length === 0 && !stuck && !inactive) continue;
      out.push({
        studentId,
        className: c.name,
        overdue,
        stuckTopic: stuck,
        inactiveDays: idleDays !== null && idleDays >= IDLE_NOTE_AFTER_DAYS ? idleDays : null,
        neverStarted: last === null,
      });
    }
  }
  return out.sort(
    (a, b) =>
      b.overdue.length - a.overdue.length ||
      Number(!!b.stuckTopic) - Number(!!a.stuckTopic) ||
      (b.inactiveDays ?? 0) - (a.inactiveDays ?? 0),
  );
}

function idleText(f: Flag): string {
  if (f.neverStarted) return "Hasn't started yet.";
  return `No activity for ${f.inactiveDays} days.`;
}

function flagReason(f: Flag): string {
  const idle = f.inactiveDays !== null || f.neverStarted ? ` ${idleText(f)}` : "";
  if (f.overdue.length === 1) {
    const h = f.overdue[0]!;
    return `${h.title}, ${h.done} of ${h.total}.${idle}`;
  }
  if (f.overdue.length > 1) return `${f.overdue.length} homeworks overdue.${idle}`;
  if (f.stuckTopic) return `Three fails in a row on ${topicLabel(f.stuckTopic)}.`;
  return f.neverStarted ? "Hasn't started yet." : `Nothing for ${f.inactiveDays} days.`;
}

type ClassStats = {
  cls: TeacherClass;
  active: number;
  handedIn: number | null;
  accuracy: number | null;
  flagged: number;
  overdueStudents: number;
  marking: MarkingRow[];
  homework: { id: string; title: string; dueAt: string; assigned: number; finished: number; overdue: number }[];
};

function classStats(i: TeacherEmailInput, cls: TeacherClass, flags: Flag[]): ClassStats {
  const members = new Set(cls.studentIds);
  const weeks = cls.studentIds.map((s) => i.weeks.get(s)).filter((w): w is StudentWeek => !!w);
  const active = weeks.filter((w) => w.attempts_in_window > 0).length;
  const counted = weeks.reduce((s, w) => s + w.attempts_counted, 0);
  const passed = weeks.reduce((s, w) => s + w.passed_counted, 0);

  const rows = i.homework.filter((h) => h.class_id === cls.id && members.has(h.student_id) && h.total > 0 && !!h.due_at);
  const dueInWeek = rows.filter((h) => {
    const t = new Date(h.due_at!).getTime();
    return t >= i.window.from.getTime() && t < i.window.to.getTime();
  });
  const byHomework = new Map<string, HomeworkStatus[]>();
  for (const r of rows) byHomework.set(r.homework_id, [...(byHomework.get(r.homework_id) ?? []), r]);
  const horizon = i.now.getTime() + 7 * DAY_MS;
  const homework = [...byHomework.entries()]
    .map(([id, rs]) => {
      const due = rs[0]!.due_at!;
      return {
        id,
        title: rs[0]!.title,
        dueAt: due,
        assigned: rs.length,
        finished: rs.filter((r) => r.done === r.total).length,
        overdue: new Date(due).getTime() < i.now.getTime() ? rs.filter((r) => r.done < r.total).length : 0,
      };
    })
    .filter((h) => new Date(h.dueAt).getTime() >= i.window.from.getTime() && new Date(h.dueAt).getTime() <= horizon)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, 4);

  const classFlags = flags.filter((f) => members.has(f.studentId) && classOf(i.classes, f.studentId)?.id === cls.id);
  return {
    cls,
    active,
    handedIn: dueInWeek.length ? Math.round((dueInWeek.filter((h) => h.done === h.total).length / dueInWeek.length) * 100) : null,
    accuracy: counted ? Math.round((passed / counted) * 100) : null,
    flagged: classFlags.length,
    overdueStudents: classFlags.filter((f) => f.overdue.length > 0).length,
    marking: i.marking.filter((m) => m.class_id === cls.id),
    homework,
  };
}

export function teacherSubject(classes: number, flagged: number): string {
  const c = plural(classes, "class", "classes");
  return flagged > 0
    ? `Your week on H-Code: ${c}, ${plural(flagged, "student")} need${flagged === 1 ? "s" : ""} a nudge`
    : `Your week on H-Code: ${c}, everyone on track`;
}

/** Null when there is nothing to say (no students, no activity, nothing due, nothing to flag or mark). */
export function buildTeacherEmail(i: TeacherEmailInput): EmailContent | null {
  const classes = i.classes.filter((c) => c.studentIds.length > 0);
  if (classes.length === 0) return null;
  const flags = computeFlags({ ...i, classes });
  const stats = classes.map((c) => classStats({ ...i, classes }, c, flags));
  const horizon = i.now.getTime() + 7 * DAY_MS;
  const upcoming = stats
    .flatMap((s) => s.homework.map((h) => ({ ...h, className: s.cls.name })))
    .filter((h) => new Date(h.dueAt).getTime() > i.now.getTime() && new Date(h.dueAt).getTime() <= horizon)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  const anyActivity = stats.some((s) => s.active > 0);
  const anyMarking = stats.some((s) => s.marking.length > 0);
  const anyHomework = stats.some((s) => s.homework.length > 0);
  if (!anyActivity && !anyMarking && !anyHomework && flags.length === 0) return null;

  const students = classes.reduce((s, c) => s + c.studentIds.length, 0);
  const top = flags.slice(0, 5);
  const nudgeHtml =
    flags.length === 0
      ? `<div style="padding: 12px 0; border-top: 1px solid #2b2b31; border-bottom: 1px solid #2b2b31; color: #cfcfd4;">Everyone is on track this week.</div>`
      : top
          .map((f) => {
            const name = shortName(i.names.get(f.studentId) ?? "");
            const kind: Chip = f.overdue.length > 0 ? "red" : f.stuckTopic ? "amber" : "plain";
            const text = f.overdue.length === 1 ? "Overdue" : f.overdue.length > 1 ? `${f.overdue.length} overdue` : f.stuckTopic ? "Stuck" : "Inactive";
            return item({
              name: `${escapeHtml(name)} <span style="color: #8c8c94; font-weight: 400;">&middot; ${escapeHtml(f.className)}</span>`,
              chipHtml: chip(text, kind),
              lines: [escapeHtml(flagReason(f))],
            });
          })
          .join("") +
        (flags.length > top.length
          ? `<p style="color: #8c8c94; font-size: 13px; margin: 10px 0 0;">${plural(flags.length - top.length, "more student")} on the markbook.</p>`
          : "");

  const detail = [...stats].sort((a, b) => b.flagged - a.flagged || b.cls.studentIds.length - a.cls.studentIds.length)[0]!;
  const metric = (s: ClassStats) =>
    `Active ${s.active} of ${s.cls.studentIds.length}${s.handedIn !== null ? ` &middot; homework handed in ${s.handedIn}%` : ""}${s.accuracy !== null ? ` &middot; accuracy ${s.accuracy}%` : ""}`;

  const cardsHtml = stats
    .map((s) => {
      const heading = `<table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 24px;"><tr><td style="font-size: 17px; font-weight: 700;">${escapeHtml(s.cls.name)}</td><td style="text-align: right; color: #8c8c94; font-size: 13px;">${plural(s.cls.studentIds.length, "student")}</td></tr></table>`;
      if (s !== detail) {
        return `${heading}${statRow(metric(s), "")}${s.overdueStudents > 0 ? statRow(`${plural(s.overdueStudents, "student")} ${s.overdueStudents === 1 ? "has" : "have"} homework overdue`, "") : ""}${s.marking.length ? statRow(`${plural(s.marking.reduce((n, m) => n + m.unmarked, 0), "paper")} waiting to be marked`, "") : ""}`;
      }
      const metrics = `<table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 10px;"><tr>
        ${tile(`${s.active}<span style="font-size: 15px; color: #8c8c94;"> / ${s.cls.studentIds.length}</span>`, "active this week")}
        ${tile(s.handedIn !== null ? `${s.handedIn}%` : "-", "homework handed in")}
        ${tile(s.accuracy !== null ? `${s.accuracy}%` : "-", "accuracy")}
      </tr></table>`;
      const hwRows = s.homework
        .map((h) =>
          item({
            name: escapeHtml(h.title),
            chipHtml:
              h.overdue > 0
                ? chip(`Due ${fmt({ weekday: "long" }, new Date(h.dueAt))}, ${h.overdue} overdue`, "red")
                : chip(`Due ${fmt({ weekday: "long" }, new Date(h.dueAt))}`, "amber"),
            lines: [`${h.finished} of ${h.assigned} finished`],
            barHtml: bar(h.finished, h.assigned),
          }),
        )
        .join("");
      const markRows = s.marking
        .map((m) =>
          item({
            name: `${escapeHtml(m.title)}`,
            chipHtml: chip(`${m.unmarked} waiting`, "amber"),
            lines: [`${m.submitted} handed in, ${m.unmarked} still to mark.`],
          }),
        )
        .join("");
      return `${heading}${metrics}<div style="margin-top: 14px;">${hwRows}${markRows}</div>`;
    })
    .join("");

  const upcomingHtml = upcoming
    .slice(0, 6)
    .map((h) => statRow(`${escapeHtml(fmt({ weekday: "short", day: "numeric", month: "short" }, new Date(h.dueAt)))} &middot; ${escapeHtml(h.title)} (${escapeHtml(h.className)})`, `${h.finished} / ${h.assigned}`))
    .join("");

  const first = detail;
  const pre = flags.length
    ? `${first.cls.name}: ${plural(first.flagged, "student")} to speak to${first.marking.length ? `, ${plural(first.marking.reduce((n, m) => n + m.unmarked, 0), "paper")} to mark` : ""}.`
    : "Everyone is on track this week.";

  return {
    subject: teacherSubject(classes.length, flags.length),
    html: shellHtml(`
    ${preheader(pre)}
    <h1 style="font-size: 24px; margin: 0 0 4px;">Week in review</h1>
    <p style="color: #8c8c94; margin: 0 0 16px; font-size: 14px;">${escapeHtml(weekRange(i.window.from, i.window.to))} &middot; ${plural(classes.length, "class", "classes")} &middot; ${plural(students, "student")}</p>
    <p style="color: #cfcfd4; margin: 0 0 6px;">Hi ${escapeHtml(firstName(i.teacherName))}, here is how your classes got on.</p>
    ${label("Needs a nudge")}
    ${nudgeHtml}
    ${cardsHtml}
    ${upcomingHtml ? `${label("Due this week")}${upcomingHtml}` : ""}
    ${ctaButton(`${i.siteUrl}/teacher`, "Open the markbook")}
    <p style="color: #888; font-size: 12px; margin: 32px 0 0;">You get this every Monday for the classes you teach or co-teach. Accuracy counts each student's attempts up to their first pass of a task. Student names are shortened because email leaves the school's systems.</p>
  `),
  };
}
