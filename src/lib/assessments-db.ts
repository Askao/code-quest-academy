import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Ability, BankQuestionMeta } from "@/lib/assessments";

/**
 * The assessment tables and functions are newer than the generated Supabase
 * types, so this is the same client without them - each query result is cast
 * to the row types below instead. Regenerating the types would let this go.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const sb = supabase as unknown as SupabaseClient<any, "public", any>;

export type BoardKey = "ocr" | "aqa";

export type AssessmentRow = {
  id: string;
  class_id: string;
  title: string;
  instructions: string;
  board: BoardKey;
  topics: string[];
  time_limit_minutes: number;
  question_count: number;
  total_marks: number;
  opens_at: string | null;
  closes_at: string | null;
  results_released: boolean;
  created_at: string;
};

export type AttemptRow = {
  id: string;
  assessment_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  marked_at: string | null;
};

/** A question as a teacher sees it (the bank is teacher-only). */
export type BankQuestion = BankQuestionMeta & {
  answer_format: "text" | "code";
  question: string;
};

export type MarkPointRow = {
  question_id: string;
  position: number;
  text: string;
  marks: number;
  guidance: string;
};

/** What assessment_paper() returns for a student. */
export type Paper = {
  title: string;
  instructions: string;
  board: BoardKey;
  time_limit_minutes: number;
  total_marks: number;
  started_at: string;
  deadline: string;
  submitted_at: string | null;
  server_now: string;
  questions: {
    position: number;
    question_id: string;
    marks: number;
    answer_format: "text" | "code";
    question: string;
    answer: string;
  }[];
};

/** What my_assessment_result() returns. */
export type Result =
  | { available: false }
  | {
      available: true;
      total_marks: number;
      marks_awarded: number;
      questions: {
        position: number;
        question: string;
        marks: number;
        answer: string;
        marks_awarded: number;
        comment: string;
      }[];
    };

const PAGE = 1000;

/**
 * Every question in the bank for a board, without the wording - enough to
 * build a paper from. Paged, because a big pool passes PostgREST's
 * 1000-row default and a silently short list would quietly shrink papers.
 */
export async function fetchBankMeta(board: BoardKey): Promise<BankQuestionMeta[]> {
  const out: BankQuestionMeta[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await sb
      .from("assessment_questions")
      .select("id, topic, ability, marks")
      .eq("track", "gcse")
      .eq("board", board)
      .order("id")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    for (const r of data ?? []) {
      out.push({ id: r.id, topic: r.topic, ability: r.ability as Ability, marks: r.marks });
    }
    if ((data ?? []).length < PAGE) return out;
  }
}

/** The full wording of specific questions (teachers only). */
export async function fetchQuestions(ids: string[]): Promise<BankQuestion[]> {
  if (ids.length === 0) return [];
  const { data, error } = await sb
    .from("assessment_questions")
    .select("id, topic, ability, marks, answer_format, question")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return (data ?? []) as BankQuestion[];
}
