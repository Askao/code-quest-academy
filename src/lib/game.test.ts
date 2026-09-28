import test from "node:test";
import assert from "node:assert/strict";
import { AVATARS, BANNERS, cosmeticUnlockedClientSide, levelFromXp } from "./game.ts";

test("levelFromXp lands on the same boundaries cosmeticUnlockedClientSide's level gates assume", () => {
  assert.equal(levelFromXp(0).level, 1);
  assert.equal(levelFromXp(99).level, 1);
  assert.equal(levelFromXp(100).level, 2);
  assert.equal(levelFromXp(4500).level, 10);
});

test("every AVATARS/BANNERS key has a branch in cosmeticUnlockedClientSide", () => {
  // Catches the easy mistake of adding a cosmetic to the catalog without
  // adding its matching case - it would otherwise silently always read as
  // locked (the switch's default), never regressing loudly.
  const ctx = { level: 999, duelWins: 999, passedCount: 999, bestStreak: 999 };
  for (const { key } of [...AVATARS, ...BANNERS]) {
    assert.equal(cosmeticUnlockedClientSide(key, ctx), true, `${key} never unlocks`);
  }
});

test("level-gated cosmetics unlock at the same level named in their requirement text", () => {
  for (const { key, requirement } of [...AVATARS, ...BANNERS]) {
    const match = /Reach level (\d+)/.exec(requirement);
    if (!match) continue;
    const level = Number(match[1]);
    const below = { level: level - 1, duelWins: 0, passedCount: 0, bestStreak: 0 };
    const at = { level, duelWins: 0, passedCount: 0, bestStreak: 0 };
    assert.equal(cosmeticUnlockedClientSide(key, below), false, `${key} unlocked a level early`);
    assert.equal(cosmeticUnlockedClientSide(key, at), true, `${key} didn't unlock at its level`);
  }
});

test("comet, century, duellist_crest and streak_flame gate on their own stat, not level", () => {
  const base = { level: 1, duelWins: 0, passedCount: 0, bestStreak: 0 };
  assert.equal(cosmeticUnlockedClientSide("comet", base), false);
  assert.equal(cosmeticUnlockedClientSide("comet", { ...base, duelWins: 1 }), true);
  assert.equal(cosmeticUnlockedClientSide("century", { ...base, passedCount: 99 }), false);
  assert.equal(cosmeticUnlockedClientSide("century", { ...base, passedCount: 100 }), true);
  assert.equal(cosmeticUnlockedClientSide("duellist_crest", { ...base, duelWins: 4 }), false);
  assert.equal(cosmeticUnlockedClientSide("duellist_crest", { ...base, duelWins: 5 }), true);
  assert.equal(cosmeticUnlockedClientSide("streak_flame", { ...base, bestStreak: 13 }), false);
  assert.equal(cosmeticUnlockedClientSide("streak_flame", { ...base, bestStreak: 14 }), true);
});
