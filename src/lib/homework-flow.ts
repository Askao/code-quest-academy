/**
 * How a student moves through a homework: in the order their list gives, not
 * the order the database happens to return the tasks in. Pure, so it can be
 * tested; homework-order.ts does the fetching.
 */
export type HomeworkItem = { id: string; slug: string };

/** Puts rows in the same order as `ids` (a query with `.in("id", ids)` returns them in any order). */
export function inListOrder<T extends { id: string }>(ids: string[], rows: T[]): T[] {
  const position = new Map(ids.map((id, i) => [id, i]));
  return rows
    .filter((r) => position.has(r.id))
    .sort((a, b) => position.get(a.id)! - position.get(b.id)!);
}

/** True once every task on the list has been passed (and there is at least one). */
export function homeworkComplete(items: HomeworkItem[], passed: Set<string>): boolean {
  return items.length > 0 && items.every((i) => passed.has(i.id));
}

/**
 * The task to show after `currentSlug`: the next one down the list that isn't
 * passed yet, wrapping round to earlier ones the student skipped. The task
 * they're on counts as done (they only ask for "next" after passing it).
 * Null when nothing is left, i.e. the homework is finished.
 */
export function nextHomeworkTask(
  items: HomeworkItem[],
  currentSlug: string,
  passed: Set<string>,
): HomeworkItem | null {
  const at = items.findIndex((i) => i.slug === currentSlug);
  const isDone = (i: HomeworkItem) => passed.has(i.id) || i.slug === currentSlug;
  for (let step = 1; step <= items.length; step++) {
    const candidate = items[(at + step + items.length) % items.length]!;
    if (!isDone(candidate)) return candidate;
  }
  return null;
}
