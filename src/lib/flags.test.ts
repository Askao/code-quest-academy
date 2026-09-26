import { test } from "node:test";
import assert from "node:assert/strict";
import {
  FLAG_EXPLANATIONS,
  STRUGGLING_THRESHOLD,
  strugglingTooltip,
  strugglingTopics,
} from "./flags.ts";

test("a topic counts once it reaches the threshold, not before", () => {
  const skills = [
    { topic: "iteration", consecutive_fails: STRUGGLING_THRESHOLD },
    { topic: "lists", consecutive_fails: STRUGGLING_THRESHOLD - 1 },
    { topic: "strings", consecutive_fails: STRUGGLING_THRESHOLD + 4 },
    { topic: "files", consecutive_fails: 0 },
    { topic: "selection", consecutive_fails: null },
    { topic: "functions" },
  ];
  assert.deepEqual(strugglingTopics(skills), ["iteration", "strings"]);
});

test("nobody is struggling when nothing has been failed", () => {
  assert.deepEqual(strugglingTopics([]), []);
});

test("the explanation quotes the same number the rule uses", () => {
  const struggling = FLAG_EXPLANATIONS.find((f) => f.name === "Struggling")!;
  assert.ok(struggling.what.includes(String(STRUGGLING_THRESHOLD)));
});

test("the badge tooltip names the topics", () => {
  const label = (t: string) => t.toUpperCase();
  assert.equal(
    strugglingTooltip(["iteration", "lists"], label),
    "Failed Test 3 or more times in a row in ITERATION, LISTS. A pass in that topic clears it.",
  );
  assert.equal(
    strugglingTooltip([], label),
    "Failed Test 3 or more times in a row. A pass in that topic clears it.",
  );
});
