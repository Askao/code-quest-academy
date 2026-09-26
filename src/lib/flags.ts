/**
 * The teacher-facing flags ("Struggling", "Ready for more") in one place: the
 * rule behind Struggling, and the plain-English explanation shown next to it,
 * so the two can't drift apart. Pure - no Supabase or React.
 */

/** Failed Test clicks in a row, in one topic, before a student is flagged. */
export const STRUGGLING_THRESHOLD = 3;

type SkillRow = { topic: string; consecutive_fails?: number | null };

/** Topics where the student has failed Test STRUGGLING_THRESHOLD or more times in a row. */
export function strugglingTopics(skills: SkillRow[], threshold = STRUGGLING_THRESHOLD): string[] {
  return skills.filter((k) => (k.consecutive_fails ?? 0) >= threshold).map((k) => k.topic);
}

export type FlagExplanation = { icon: string; name: string; what: string; detail: string[] };

export const FLAG_EXPLANATIONS: FlagExplanation[] = [
  {
    icon: "🔴",
    name: "Struggling",
    what: `Failed the Test button ${STRUGGLING_THRESHOLD} times in a row in the same topic.`,
    detail: [
      "It counts every Test click in that topic - in lessons, practice and homework - and only Test. The free Run button never counts.",
      "One pass in that topic clears the count. There's no time limit, so a student who tried a hard task three times and then stopped stays flagged until they pass something in that topic.",
      "The three fails can be the same task tried three times, not just three different tasks.",
      "Hover over a badge (or open the student in the report) to see which topics.",
    ],
  },
  {
    icon: "🟡",
    name: "Ready for more",
    what: "Has passed every core practice task in every topic.",
    detail: ["Stretch tasks aren't needed for this - they're the extra, so the flag means there's nothing core left for them."],
  },
];

/** Other reasons the class report's "needs a conversation" list can name a student. */
export const WATCH_LIST_REASONS = [
  "Struggling, as above",
  "Assessments under 50% overall",
  "Under half done on a homework that is overdue",
  "Missed an assessment that has closed",
];

/** The tooltip on a Struggling badge. */
export function strugglingTooltip(
  topics: string[] | undefined,
  label: (topic: string) => string,
): string {
  const where = topics && topics.length > 0 ? ` in ${topics.map(label).join(", ")}` : "";
  return `Failed Test ${STRUGGLING_THRESHOLD} or more times in a row${where}. A pass in that topic clears it.`;
}
