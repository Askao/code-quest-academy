/**
 * How a program's output is compared with what a test expects. Pure, so it is
 * tested (output-compare.test.ts); the Python runner just calls it.
 *
 * Whitespace at the ends of lines and blank lines at the ends are ignored, and
 * a decimal number counts as the same however many trailing zeros it has: a
 * task that says "round to 2 decimal places" accepts both 3.5 and 3.50, because
 * what is being marked is the arithmetic, not how the zero is written. A
 * decimal that is actually different (3.33 against 3.333333) is still wrong.
 */

export function normaliseOutput(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

const DECIMAL = /-?\d+\.\d+/g;

/** Writes every decimal number in its shortest form, so 3.0, 3.00 and 3 all read "3". */
export function canonicalNumbers(text: string): string {
  return text.replace(DECIMAL, (m) => String(parseFloat(m)));
}

export function outputsMatch(actual: string, expected: string): boolean {
  const a = normaliseOutput(actual);
  const e = normaliseOutput(expected);
  return a === e || canonicalNumbers(a) === canonicalNumbers(e);
}
