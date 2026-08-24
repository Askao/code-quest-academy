/**
 * Lesson and task content lives in the repository (src/content/*.json) so it can be
 * edited, reviewed and self-hosted without touching the database. The database only
 * stores the identity and metadata of each lesson/task plus student progress.
 */
import capstone from "@/content/gcse-capstone.json";
import combiningTechniques from "@/content/gcse-combining-techniques.json";
import files from "@/content/gcse-files.json";
import fundamentals from "@/content/gcse-fundamentals.json";
import functions from "@/content/gcse-functions.json";
import gettingStarted from "@/content/gcse-getting-started.json";
import iteration from "@/content/gcse-iteration.json";
import lists from "@/content/gcse-lists.json";
import searchingSorting from "@/content/gcse-searching-sorting.json";
import selection from "@/content/gcse-selection.json";
import sequencing from "@/content/gcse-sequencing.json";
import strings from "@/content/gcse-strings.json";
import databases from "@/content/gcse-databases.json";
import { GCSE_TOPICS, topicsFor, type Board, type TrackKey } from "@/lib/game";

export type LessonContent = {
  slug: string;
  title: string;
  summary: string;
  notes: string;
  worked_example: string;
  worked_example_note: string;
  /**
   * Canned answers standing in for whatever the worked example's input()
   * calls would read at runtime, so its execution can be traced into a
   * fixed, deliberately-chosen story. Optional - only lessons piloting the
   * step-through variable trace need it; everything else still renders the
   * plain static code block.
   */
  worked_example_demo_input?: string[];
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

/**
 * A task set aside exclusively for homework - never reachable through any
 * lesson's task list, and excluded from Practice/Recap/Boss battles (see
 * pickChallenge in src/lib/progress.ts, which only pulls rows where
 * homework_only = false unless explicitly asked for the homework pool).
 * Keeps homework meaningfully different from what a student has already
 * drilled elsewhere, rather than re-serving the same 150 tasks.
 */
export type HomeworkTaskContent = Omit<TaskContent, "lesson" | "lessonSlug">;

/**
 * A longer, harder assessment task that pulls together everything a topic
 * covers - modelled on GoCodeIt's "Assessment Point" pages. Browsed as a
 * fixed, difficulty-ordered list on /projects rather than randomly picked,
 * and (like homework tasks) never reachable through a lesson's task list or
 * surfaced by Practice/Recap/Boss/Duel's random pickChallenge() calls.
 */
export type ProjectTaskContent = Omit<TaskContent, "lesson" | "lessonSlug">;

/**
 * A task that only ever surfaces through Practice (topic practice, boss
 * battles, the "find a specific task" browse list) - never shown in a
 * lesson's own task list, so practising a topic never just re-serves the
 * same tasks a student already met while learning it. See practiceOnly in
 * pickChallenge (src/lib/progress.ts): topics without any dedicated
 * practice tasks yet transparently fall back to the ordinary task pool,
 * so this is safe to roll out one topic at a time.
 */
export type PracticeTaskContent = Omit<TaskContent, "lesson" | "lessonSlug">;

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
  homeworkTasks?: Omit<HomeworkTaskContent, "track" | "topic">[];
  projectTasks?: Omit<ProjectTaskContent, "track" | "topic">[];
  practiceTasks?: Omit<PracticeTaskContent, "track" | "topic">[];
  quiz?: QuizQuestion[];
};

const RAW = [
  gettingStarted,
  fundamentals,
  sequencing,
  selection,
  iteration,
  combiningTechniques,
  lists,
  strings,
  functions,
  files,
  searchingSorting,
  databases,
  capstone,
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

export const HOMEWORK_TASKS: HomeworkTaskContent[] = RAW.flatMap((t) =>
  (t.homeworkTasks ?? []).map((task) => ({
    ...task,
    track: t.track as TrackKey,
    topic: t.topic,
  })),
);

export const PROJECT_TASKS: ProjectTaskContent[] = RAW.flatMap((t) =>
  (t.projectTasks ?? []).map((task) => ({
    ...task,
    track: t.track as TrackKey,
    topic: t.topic,
  })),
);

export const PRACTICE_TASKS: PracticeTaskContent[] = RAW.flatMap((t) =>
  (t.practiceTasks ?? []).map((task) => ({
    ...task,
    track: t.track as TrackKey,
    topic: t.topic,
  })),
);

export const QUIZZES: QuizQuestion[] = RAW.flatMap((t) => t.quiz ?? []);

const lessonBySlug = new Map(LESSONS.map((l) => [l.slug, l]));
const taskBySlug = new Map<
  string,
  TaskContent | HomeworkTaskContent | ProjectTaskContent | PracticeTaskContent
>([...TASKS, ...HOMEWORK_TASKS, ...PROJECT_TASKS, ...PRACTICE_TASKS].map((t) => [t.slug, t]));

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

/** A topic's projects, easiest first - the fixed, difficulty-ordered list /projects shows. */
export function projectsForTopic(track: TrackKey, topic: string) {
  return PROJECT_TASKS.filter((p) => p.track === track && p.topic === topic).sort(
    (a, b) => a.difficulty - b.difficulty,
  );
}

/** A topic's dedicated practice-only tasks - empty until that topic's pool has been authored. */
export function practiceTasksForTopic(track: TrackKey, topic: string) {
  return PRACTICE_TASKS.filter((p) => p.track === track && p.topic === topic);
}

/**
 * Just the required practice tasks for a topic - stretch tasks (harder,
 * beyond the normal difficulty-5 ceiling; see the GCSE stretch tier)
 * excluded. Used anywhere "is this topic's practice done" is decided -
 * COMPLETED badges, the reset gate, roster/dashboard completion counts -
 * so extension content a student may never touch doesn't block a status
 * that's meant to mean "finished the core pool". Browsing/picking still
 * uses practiceTasksForTopic directly so stretch tasks stay reachable.
 */
export function corePracticeTasksForTopic(track: TrackKey, topic: string) {
  return practiceTasksForTopic(track, topic).filter((p) => !p.stretch);
}

export type ProjectGroup = { title: string; slugs: string[] };

/**
 * A topic's projects collapsed into distinct project units rather than
 * individual part rows - a multi-part project (group/part set, e.g.
 * gcse-sequencing-proj1a/b/c) becomes one unit spanning every part, a
 * single-part project becomes a unit of one. Used anywhere "how many of
 * this topic's projects has X finished" needs to count whole projects,
 * not parts - a project only counts as done once every part in it does.
 * See the teacher class overview's per-student project progress.
 */
export function projectGroupsForTopic(track: TrackKey, topic: string): ProjectGroup[] {
  const tasks = projectsForTopic(track, topic);
  const seen = new Set<string>();
  const groups: ProjectGroup[] = [];
  for (const t of tasks) {
    if (t.group) {
      if (seen.has(t.group)) continue;
      seen.add(t.group);
      const parts = tasks
        .filter((x) => x.group === t.group)
        .sort((a, b) => (a.part ?? "").localeCompare(b.part ?? ""));
      groups.push({ title: parts[0]!.title.split(" — ")[0]!, slugs: parts.map((p) => p.slug) });
    } else {
      groups.push({ title: t.title, slugs: [t.slug] });
    }
  }
  return groups;
}

/** Tasks sharing a `group` are ordered steps (Part A, B, ...) of one bigger problem. */
/**
 * Searches every task pool, not just the ordinary lesson tasks - multi-part
 * projects (e.g. gcse-sequencing-proj1a/b/c) use group/part too, and only
 * live in PROJECT_TASKS. A group is only ever entirely within one pool in
 * practice, but checking all of them means this doesn't silently return
 * nothing the moment group/part gets used somewhere new.
 */
export function tasksInGroup(group: string) {
  return [...TASKS, ...HOMEWORK_TASKS, ...PROJECT_TASKS, ...PRACTICE_TASKS]
    .filter((t) => t.group === group)
    .sort((a, b) => (a.part ?? "").localeCompare(b.part ?? ""));
}

/**
 * Topics that have lesson content, in the canonical GCSE_TOPICS order (this
 * order is what sequential lesson gating in /learn walks) - not just
 * "whichever topic happened to load first".
 */
export function topicsWithLessons(track: TrackKey, board?: Board) {
  const present = new Set(LESSONS.filter((l) => l.track === track).map((l) => l.topic));
  const ordered = topicsFor(track, board).map((t) => t.key);
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
 * The task slugs a student is actually allowed to see in Practice/Recap:
 * every task (required or stretch) belonging to a lesson they've already
 * completed, across every topic in the track. Practice and Recap exist to
 * reinforce material already covered, not to surprise a student with
 * content from a lesson they haven't reached yet.
 */
export function completedTaskSlugs(
  track: TrackKey,
  passedTaskSlugs: Set<string>,
  quizPassedLessonSlugs: Set<string>,
): Set<string> {
  const result = new Set<string>();
  for (const topic of topicsWithLessons(track)) {
    for (const lesson of lessonsForTopic(track, topic)) {
      if (isLessonComplete(lesson.slug, passedTaskSlugs, quizPassedLessonSlugs)) {
        for (const task of tasksForLesson(lesson.slug)) {
          result.add(task.slug);
        }
      }
    }
  }
  return result;
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
