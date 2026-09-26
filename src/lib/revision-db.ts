import { sb } from "@/lib/assessments-db";
import type { OpenedPaper, RevisionFocus, TopicSummary } from "@/lib/revision";

/** A row of revision_papers, with the marks from its answers, for the history list. */
export type PaperListRow = {
  id: string;
  title: string;
  board: "ocr" | "aqa";
  topics: string[];
  focus: RevisionFocus;
  time_limit_minutes: number | null;
  question_count: number;
  total_marks: number;
  weak_count: number;
  created_at: string;
  submitted_at: string | null;
  marked_at: string | null;
  revision_answers: { marked: boolean; marks_awarded: number }[];
};

export async function fetchMyPapers(): Promise<PaperListRow[]> {
  const { data, error } = await sb
    .from("revision_papers")
    .select("*, revision_answers(marked, marks_awarded)")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as PaperListRow[];
}

export async function fetchTopicSummary(board: "ocr" | "aqa"): Promise<TopicSummary[]> {
  const { data, error } = await sb.rpc("revision_topics", { _board: board });
  if (error) throw new Error(error.message);
  return (data ?? []) as TopicSummary[];
}

export async function createPaper(args: {
  board: "ocr" | "aqa";
  topics: string[];
  count: number;
  focus: RevisionFocus;
  title: string;
  minutes: number | null;
}): Promise<{ paper_id: string; questions: number; weak: number; marks: number }> {
  const { data, error } = await sb.rpc("create_revision_paper", {
    _board: args.board,
    _topics: args.topics,
    _count: args.count,
    _focus: args.focus,
    _title: args.title,
    _minutes: args.minutes,
  });
  if (error) throw new Error(error.message);
  return data as { paper_id: string; questions: number; weak: number; marks: number };
}

export async function openPaper(id: string): Promise<{ paper: OpenedPaper; offset: number }> {
  const { data, error } = await sb.rpc("open_revision_paper", { _paper_id: id });
  if (error) throw new Error(error.message);
  const paper = data as OpenedPaper;
  // Follow the server's clock for the optional timer, not the device's.
  return { paper, offset: Date.parse(paper.server_now) - Date.now() };
}
