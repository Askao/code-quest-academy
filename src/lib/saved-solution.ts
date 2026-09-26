/**
 * When a student reopens a lesson task they've already passed, the editor
 * should show the code they passed with, not the starter code. This is the
 * one decision in that: given what the editor currently holds, should the
 * saved solution replace it?
 *
 * Only when the editor is still untouched. The saved code arrives a moment
 * after the page opens, and if the student has already started typing
 * (a fresh attempt at a task they want to redo) their typing must win.
 */
export function shouldRestoreSolution(opts: {
  current: string;
  starter: string;
  saved: string | null | undefined;
}): boolean {
  const { current, starter, saved } = opts;
  if (saved == null || saved.trim() === "") return false;
  if (saved === current) return false;
  return current === starter || current.trim() === "";
}
