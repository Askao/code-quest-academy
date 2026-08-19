/**
 * Lesson and task content lives in the repository (src/content/*.json) so it can be
 * edited, reviewed and self-hosted without touching the database. The database only
 * stores the identity and metadata of each lesson/task plus student progress.
 */
import iteration from "@/content/gcse-iteration.json";
import lists from "@/content/gcse-lists.json";
import selection from "@/content/gcse-selection.json";
import sequencing from "@/content/gcse-sequencing.json";
import type { TrackKey } from "@/lib/game";

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
};

type RawTopic = {
  track: string;
  topic: string;
  lessons: Omit<LessonContent, "track" | "topic" | "order">[];
  tasks: Omit<TaskContent, "lessonSlug" | "track" | "topic">[];
};

const RAW = [sequencing, selection, iteration, lists] as unknown as RawTopic[];

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

export function topicsWithLessons(track: TrackKey) {
  return [...new Set(LESSONS.filter((l) => l.track === track).map((l) => l.topic))];
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
  };
}
