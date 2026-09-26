import { Textarea } from "@/components/ui/textarea";
import { QuestionText } from "@/components/QuestionText";
import { joinPartAnswers, splitPartAnswers, splitQuestionParts } from "@/lib/assessments";

export type SaveState = "saved" | "saving" | "error";

/** One answer box. Code answers are monospace and Tab indents instead of jumping to the next box. */
export function AnswerBox({
  label,
  value,
  code,
  rows,
  onChange,
  onBlur,
}: {
  label: string;
  value: string;
  code: boolean;
  rows: number;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <Textarea
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={(e) => {
        if (!code || e.key !== "Tab") return;
        e.preventDefault();
        const el = e.currentTarget;
        const { selectionStart: from, selectionEnd: to } = el;
        onChange(el.value.slice(0, from) + "    " + el.value.slice(to));
        requestAnimationFrame(() => el.setSelectionRange(from + 4, from + 4));
      }}
      rows={rows}
      spellCheck={!code}
      autoCapitalize="off"
      autoCorrect="off"
      className={code ? "font-mono text-sm" : ""}
      placeholder={code ? "Write your program here…" : "Write your answer here…"}
    />
  );
}

/**
 * A question with the place to write its answer: one box, or - when the
 * question has parts (a), (b), (c) - a box per part so the answers can't run
 * together. Parts are stored in the one answer field, joined under their
 * labels. Shared by teacher-set assessments and student revision papers.
 */
export function QuestionAnswer({
  index,
  question,
  answerFormat,
  marks,
  value,
  state,
  onChange,
  onSave,
}: {
  index: number;
  question: string;
  answerFormat: "text" | "code";
  marks: number;
  value: string;
  state: SaveState | undefined;
  onChange: (value: string) => void;
  onSave: () => void;
}) {
  const split = splitQuestionParts(question);
  const code = answerFormat === "code";
  const status = (
    <p
      className={`mt-1.5 h-4 font-mono text-xs ${
        state === "error" ? "text-destructive" : "text-muted-foreground"
      }`}
      aria-live="polite"
    >
      {state === "saving"
        ? "Saving…"
        : state === "saved"
          ? "✓ Saved"
          : state === "error"
            ? "Couldn't save - check your connection; it will try again"
            : ""}
    </p>
  );

  if (!split) {
    return (
      <>
        <QuestionText text={question} />
        <div>
          <AnswerBox
            label={`Answer to question ${index + 1}`}
            value={value}
            code={code}
            rows={code ? Math.max(8, marks + 4) : Math.max(3, marks + 1)}
            onChange={onChange}
            onBlur={onSave}
          />
          {status}
        </div>
      </>
    );
  }

  const labels = split.parts.map((p) => p.label);
  const values = splitPartAnswers(value, labels);
  return (
    <>
      {split.stem ? <QuestionText text={split.stem} /> : null}
      {split.parts.map((part, pi) => (
        <div key={part.label} className="space-y-2 border-t border-border pt-4">
          <QuestionText text={part.text} />
          <AnswerBox
            label={`Answer to question ${index + 1}, part (${part.label})`}
            value={values[pi] ?? ""}
            code={code}
            rows={code ? 8 : 2}
            onChange={(v) =>
              onChange(
                joinPartAnswers(
                  labels,
                  values.map((old, k) => (k === pi ? v : old)),
                ),
              )
            }
            onBlur={onSave}
          />
        </div>
      ))}
      {status}
    </>
  );
}
