import { test } from "node:test";
import assert from "node:assert/strict";
import { bulkAllowed, bulkDailyLimit, freshQuota, noteResponse, utcDay } from "./email-quota.ts";

const at = (iso: string) => new Date(iso);
const MON = at("2026-10-26T09:00:00Z");

test("bulk email is allowed until the day's count reaches the limit", () => {
  let s = freshQuota(MON);
  assert.equal(bulkAllowed(s, MON, 70), true, "count unknown yet");
  s = noteResponse(s, MON, { status: 200, quotaHeader: "69" });
  assert.equal(bulkAllowed(s, MON, 70), true);
  s = noteResponse(s, MON, { status: 200, quotaHeader: "70" });
  assert.equal(bulkAllowed(s, MON, 70), false);
});

test("a daily-quota refusal stops bulk email even when the count is unknown", () => {
  const s = noteResponse(freshQuota(MON), MON, {
    status: 429,
    quotaHeader: null,
    errorName: "daily_quota_exceeded",
  });
  assert.equal(bulkAllowed(s, MON, 70), false);
});

test("a rate-limit 429 (too fast, not too many) doesn't stop the day", () => {
  const s = noteResponse(freshQuota(MON), MON, {
    status: 429,
    quotaHeader: null,
    errorName: "rate_limit_exceeded",
  });
  assert.equal(bulkAllowed(s, MON, 70), true);
});

test("held-back email goes again once the UTC day turns over", () => {
  let s = noteResponse(freshQuota(MON), MON, { status: 200, quotaHeader: "95" });
  s = noteResponse(s, MON, { status: 429, quotaHeader: "100", errorName: "daily_quota_exceeded" });
  assert.equal(bulkAllowed(s, MON, 70), false);
  const tue = at("2026-10-27T00:00:01Z");
  assert.equal(bulkAllowed(s, tue, 70), true);
  assert.equal(utcDay(tue), "2026-10-27");
});

test("paid plans send no count header, so nothing is held back", () => {
  let s = freshQuota(MON);
  for (let i = 0; i < 500; i++) s = noteResponse(s, MON, { status: 200, quotaHeader: null });
  assert.equal(bulkAllowed(s, MON, 70), true);
});

test("the limit can be changed with RESEND_BULK_DAILY_LIMIT", () => {
  assert.equal(bulkDailyLimit({}), 70);
  assert.equal(bulkDailyLimit({ RESEND_BULK_DAILY_LIMIT: "50" }), 50);
  assert.equal(bulkDailyLimit({ RESEND_BULK_DAILY_LIMIT: "nonsense" }), 70);
  assert.equal(bulkDailyLimit({ RESEND_BULK_DAILY_LIMIT: "" }), 70);
});
