import { test } from "node:test";
import assert from "node:assert/strict";
import { canonicalNumbers, normaliseOutput, outputsMatch } from "./output-compare.ts";

test("trailing spaces and blank lines at the end do not matter", () => {
  assert.ok(outputsMatch("Hello  \nWorld\n\n", "Hello\nWorld"));
  assert.ok(outputsMatch("a\r\nb", "a\nb"));
});

test("a different word or line is still wrong", () => {
  assert.equal(outputsMatch("Hello", "hello"), false);
  assert.equal(outputsMatch("a\nb", "a b"), false);
  assert.equal(outputsMatch("12", "13"), false);
});

test("decimals with different trailing zeros are the same number", () => {
  assert.ok(outputsMatch("3.00", "3.0"));
  assert.ok(outputsMatch("3.5", "3.50"));
  assert.ok(outputsMatch("Total: £15.00", "Total: £15.0"));
  assert.ok(outputsMatch("Area: 20", "Area: 20.0"), "a whole number for a whole-number answer");
  assert.ok(outputsMatch("Wait: 450s\nMinutes: 9.50", "Wait: 450.0s\nMinutes: 9.5"));
  assert.ok(outputsMatch("-2.50", "-2.5"));
});

test("a genuinely different decimal is still wrong", () => {
  assert.equal(outputsMatch("33.3333", "33.33"), false, "not rounded");
  assert.equal(outputsMatch("1.41", "1.42"), false);
  assert.equal(outputsMatch("Total: £14.1", "Total: £14.0"), false);
  assert.equal(outputsMatch("0.1", "0.10000001"), false);
});

test("numbers inside words and tables are handled one by one", () => {
  assert.ok(outputsMatch("a1.0 b2.50", "a1 b2.5"));
  assert.equal(outputsMatch("10.5.1", "10.5.2"), false);
});

test("canonical form and normalising", () => {
  assert.equal(canonicalNumbers("3.0 and 4.250"), "3 and 4.25");
  assert.equal(normaliseOutput("  x \n\n"), "x");
});
