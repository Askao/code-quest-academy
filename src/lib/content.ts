/**
 * Lesson and task content lives in the repository (src/content/*.json) so it can be
 * edited, reviewed and self-hosted without touching the database. The database only
 * stores the identity and metadata of each lesson/task plus student progress.
 */
import files from "@/content/gcse-files.json";
import fundamentals from "@/content/gcse-fundamentals.json";
import functions from "@/content/gcse-functions.json";
import iteration from "@/content/gcse-iteration.json";
import lists from "@/content/gcse-lists.json";
import selection from "@/content/gcse-selection.json";
import sequencing from "@/content/gcse-sequencing.json";
import strings from "@/content/gcse-strings.json";
import { GCSE_TOPICS, type TrackKey } from "@/lib/game";

export type LessonContent = {
  slug: string;
  title: string;
  summary: string;
  notes: string;
  worked_example: string;
  worked_example_note: string;
  track: TrackKey;
  topic: string;
  order: number;
};

export type TaskContent = {
  slug: string;
  lesson: number;
  lessonSlug: string;
  tier: number;
  difficulty: number;
  xp: number;
  title: string;
  brief: string;
  starter: string;
  hints: string[];
  tests: { stdin?: string; expect: string }[];
  track: TrackKey;
  topic: string;
  /** Multi-part problems: tasks sharing a group are steps of one bigger scenario. */
  group?: string;
  part?: string;
  /** Optional bonus task for fast finishers - never required to complete the lesson. */
  stretch?: boolean;
};

export type QuizQuestion = {
  lessonSlug: string;
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type RawTopic = {
  track: string;
  topic: string;
  lessons: Omit<LessonContent, "track" | "topic" | "order">[];
  tasks: Omit<TaskContent, "lessonSlug" | "track" | "topic">[];
  quiz?: QuizQuestion[];
};

const RAW = [
  fundamentals,
  sequencing,
  selection,
  iteration,
  lists,
  strings,
  functions,
  files,
] as unknown as RawTopic[];

export const LESSONS: LessonContent[] = RAW.flatMap((t) =>
  t.lessons.map((l, i) => ({
    ...l,
    track: t.track as TrackKey,
    topic: t.topic,
    order: i + 1,
  })),
);

export const TASKS: TaskContent[] = RAW.flatMap((t) =>
  t.tasks.map((task) => ({
    ...task,
    lessonSlug: `${t.track}-${t.topic}-${task.lesson}`,
    track: t.track as TrackKey,
    topic: t.topic,
  })),
);

export const QUIZZES: QuizQuestion[] = RAW.flatMap((t) => t.quiz ?? []);

const lessonBySlug = new Map(LESSONS.map((l) => [l.slug, l]));
const taskBySlug = new Map(TASKS.map((t) => [t.slug, t]));

export function getLesson(slug: string) {
  return lessonBySlug.get(slug) ?? null;
}

export function getTask(slug: string) {
  return taskBySlug.get(slug) ?? null;
}

export function lessonsForTopic(track: TrackKey, topic: string) {
  return LESSONS.filter((l) => l.track === track && l.topic === topic);
}

export function tasksForLesson(lessonSlug: string) {
  return TASKS.filter((t) => t.lessonSlug === lessonSlug);
}

export function quizForLesson(lessonSlug: string) {
  return QUIZZES.filter((q) => q.lessonSlug === lessonSlug);
}

/** Tasks sharing a `group` are ordered steps (Part A, B, ...) of one bigger problem. */
export function tasksInGroup(group: string) {
  return TASKS.filter((t) => t.group === group).sort((a, b) =>
    (a.part ?? "").localeCompare(b.part ?? ""),
  );
}

/**
 * Topics that have lesson content, in the canonical GCSE_TOPICS order (this
 * order is what sequential lesson gating in /learn walks) - not just
 * "whichever topic happened to load first".
 */
export function topicsWithLessons(track: TrackKey) {
  const present = new Set(LESSONS.filter((l) => l.track === track).map((l) => l.topic));
  const ordered = (track === "gcse" ? GCSE_TOPICS : []).map((t) => t.key);
  return ordered.filter((topic) => present.has(topic));
}

/**
 * A lesson is complete once every one of its *required* tasks has a passed
 * attempt (stretch tasks are optional fast-finisher content and never block
 * completion) and, if it has a quiz, the quiz has been passed at least once.
 * Used both to show progress and to decide what's locked in /learn.
 */
export function isLessonComplete(
  lessonSlug: string,
  passedTaskSlugs: Set<string>,
  quizPassedLessonSlugs: Set<string>,
): boolean {
  const tasks = tasksForLesson(lessonSlug).filter((t) => !t.stretch);
  const allTasksPassed = tasks.length > 0 && tasks.every((t) => passedTaskSlugs.has(t.slug));
  const quiz = quizForLesson(lessonSlug);
  const quizOk = quiz.length === 0 || quizPassedLessonSlugs.has(lessonSlug);
  return allTasksPassed && quizOk;
}

export function isTopicComplete(
  track: TrackKey,
  topic: string,
  passedTaskSlugs: Set<string>,
  quizPassedLessonSlugs: Set<string>,
): boolean {
  const lessons = lessonsForTopic(track, topic);
  return (
    lessons.length > 0 &&
    lessons.every((l) => isLessonComplete(l.slug, passedTaskSlugs, quizPassedLessonSlugs))
  );
}

/**
 * Students who belong to a class (any `class_members` row) get a
 * teacher-controlled gate on top of the mastery gate above: a lesson stays
 * locked until their teacher has assigned it, even once they'd otherwise be
 * ready. Self-signed-up users with no class rows skip this check entirely.
 */
export function isLessonAssigned(lessonSlug: string, assignedSlugs: Set<string>): boolean {
  return assignedSlugs.has(lessonSlug);
}

/** Merge repository content over a database challenge row. */
export function withContent<T extends { slug: string }>(row: T): T {
  const c = taskBySlug.get(row.slug);
  if (!c) return row;
  return {
    ...row,
    title: c.title,
    brief: c.brief,
    starter_code: c.starter,
    hints: c.hints,
    tests: c.tests,
    difficulty: c.difficulty,
    xp: c.xp,
    ...(c.group ? { group: c.group, part: c.part } : {}),
  };
}
