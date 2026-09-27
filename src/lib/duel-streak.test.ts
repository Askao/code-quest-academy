import test from "node:test";
import assert from "node:assert/strict";
import { currentLosingStreak, DUEL_STREAK_THRESHOLD } from "./duel-streak.ts";

const ME = "me";
const THEM = "them";
const OTHER = "other";

const duel = (over: Partial<Parameters<typeof currentLosingStreak>[0][number]> = {}) => ({
  status: "complete",
  challenger_id: ME,
  opponent_id: THEM,
  winner_id: THEM,
  created_at: "2026-09-20T00:00:00Z",
  ...over,
});

test("threshold matches the Struggling rule, so the two features read the same way", () => {
  assert.equal(DUEL_STREAK_THRESHOLD, 3);
});

test("counts consecutive losses, most recent first, stopping at the first win", () => {
  const duels = [
    duel({ created_at: "2026-09-20T00:00:00Z", winner_id: THEM }), // most recent loss
    duel({ created_at: "2026-09-19T00:00:00Z", winner_id: THEM }),
    duel({ created_at: "2026-09-18T00:00:00Z", winner_id: ME }), // the streak-breaking win
    duel({ created_at: "2026-09-17T00:00:00Z", winner_id: THEM }),
  ];
  assert.equal(currentLosingStreak(duels, ME), 2);
});

test("a win as the most recent duel means no streak at all", () => {
  const duels = [duel({ winner_id: ME }), duel({ created_at: "2026-09-19T00:00:00Z", winner_id: THEM })];
  assert.equal(currentLosingStreak(duels, ME), 0);
});

test("open or in-progress duels are skipped, not counted as breaking or extending the streak", () => {
  const duels = [
    duel({ created_at: "2026-09-20T00:00:00Z", status: "open", winner_id: null }),
    duel({ created_at: "2026-09-19T00:00:00Z", status: "in_progress", winner_id: null }),
    duel({ created_at: "2026-09-18T00:00:00Z", winner_id: THEM }),
    duel({ created_at: "2026-09-17T00:00:00Z", winner_id: THEM }),
    duel({ created_at: "2026-09-16T00:00:00Z", winner_id: THEM }),
  ];
  assert.equal(currentLosingStreak(duels, ME), 3);
});

test("duels the student wasn't part of don't count", () => {
  const duels = [duel({ challenger_id: OTHER, opponent_id: THEM, winner_id: THEM })];
  assert.equal(currentLosingStreak(duels, ME), 0);
});

test("no completed duels at all is a streak of zero", () => {
  assert.equal(currentLosingStreak([], ME), 0);
});

test("counts every loss when the student has never won", () => {
  const duels = [
    duel({ created_at: "2026-09-20T00:00:00Z", winner_id: THEM }),
    duel({ created_at: "2026-09-19T00:00:00Z", winner_id: THEM }),
    duel({ created_at: "2026-09-18T00:00:00Z", winner_id: THEM }),
  ];
  assert.equal(currentLosingStreak(duels, ME), 3);
});
