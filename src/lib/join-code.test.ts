import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJoinCode } from "./join-code.ts";

test("accepts a plain code in any case, with stray spaces", () => {
  for (const input of ["K7M2XQ", "k7m2xq", "  K7M2XQ ", "K7M 2XQ", "k7m-2xq"]) {
    assert.deepEqual(parseJoinCode(input), { ok: true, code: "K7M2XQ" }, input);
  }
});

test("accepts a pasted invite link", () => {
  for (const input of [
    "https://www.hcodeacademy.co.uk/join/K7M2XQ",
    "www.hcodeacademy.co.uk/join/k7m2xq/",
    "hcodeacademy.co.uk/join/K7M2XQ?utm=x",
    "http://localhost:3000/join/K7M2XQ#top",
  ]) {
    assert.deepEqual(parseJoinCode(input), { ok: true, code: "K7M2XQ" }, input);
  }
});

test("rejects things that can't be a code", () => {
  for (const input of ["", "   ", "K7M2X", "K7M2XQZ", "K7M2X0", "K7M2XI", "hello!", "https://example.com/"]) {
    const r = parseJoinCode(input);
    assert.equal(r.ok, false, input);
  }
});

test("an empty box gets the 'type the code' message", () => {
  const r = parseJoinCode("  ");
  assert.equal(r.ok === false && /Type the join code/.test(r.error), true);
});
