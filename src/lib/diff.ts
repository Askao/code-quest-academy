export type DiffPart = { text: string; type: "same" | "removed" | "added" };

/**
 * Character-level diff between `expected` and `actual`, via a classic LCS
 * alignment. Returns two aligned part lists: `expectedParts` marks
 * characters missing from `actual` ("removed"), `actualParts` marks
 * characters wrong or extra in `actual` ("added"). A one-sided diff isn't
 * enough here - a forgotten space (e.g. "GoodMorning" for "Good Morning")
 * is a strict subsequence of the expected output, so nothing in `actual`
 * is technically "wrong" per character; it only shows up as a gap on the
 * expected side. Used to point a student straight at exactly what's off
 * (a wrong-case letter, a missing space) instead of two lines to eyeball.
 */
export function diffStrings(
  expected: string,
  actual: string,
): { expectedParts: DiffPart[]; actualParts: DiffPart[] } {
  const m = expected.length;
  const n = actual.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i]![j] =
        expected[i] === actual[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }

  const expectedParts: DiffPart[] = [];
  const actualParts: DiffPart[] = [];
  const push = (parts: DiffPart[], text: string, type: DiffPart["type"]) => {
    if (!text) return;
    const last = parts[parts.length - 1];
    if (last && last.type === type) last.text += text;
    else parts.push({ text, type });
  };

  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (expected[i] === actual[j]) {
      push(expectedParts, expected[i]!, "same");
      push(actualParts, actual[j]!, "same");
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      push(expectedParts, expected[i]!, "removed");
      i++;
    } else {
      push(actualParts, actual[j]!, "added");
      j++;
    }
  }
  while (i < m) {
    push(expectedParts, expected[i]!, "removed");
    i++;
  }
  while (j < n) {
    push(actualParts, actual[j]!, "added");
    j++;
  }
  return { expectedParts, actualParts };
}
