import { test } from "node:test";
import assert from "node:assert/strict";
import { clientIp, isPageVisit, isPrivateIp, placeLabel, ukDay } from "./visitor-location.ts";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const page = (extra: Record<string, string> = {}) =>
  new Headers({
    "user-agent": CHROME,
    "sec-fetch-dest": "document",
    accept: "text/html",
    ...extra,
  });

test("a browser loading a page counts", () => {
  assert.equal(isPageVisit("GET", "/dashboard", page()), true);
  assert.equal(isPageVisit("GET", "/", page()), true);
  // Older browsers without Sec-Fetch-* fall back to the Accept header.
  assert.equal(
    isPageVisit("GET", "/learn", new Headers({ "user-agent": CHROME, accept: "text/html,*/*" })),
    true,
  );
});

test("assets, API calls, server functions and non-GETs don't count", () => {
  assert.equal(isPageVisit("POST", "/dashboard", page()), false);
  assert.equal(isPageVisit("GET", "/api/reports/send-weekly", page()), false);
  assert.equal(isPageVisit("GET", "/_serverFn/abc", page()), false);
  assert.equal(isPageVisit("GET", "/assets/index-abc.js", page()), false);
  assert.equal(isPageVisit("GET", "/favicon.ico", page()), false);
  assert.equal(isPageVisit("GET", "/dashboard", page({ "sec-fetch-dest": "script" })), false);
  assert.equal(
    isPageVisit("GET", "/dashboard", new Headers({ "user-agent": CHROME, accept: "*/*" })),
    false,
  );
});

test("prefetches and bots don't count", () => {
  assert.equal(isPageVisit("GET", "/", page({ "sec-purpose": "prefetch" })), false);
  assert.equal(
    isPageVisit("GET", "/", page({ "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" })),
    false,
  );
  assert.equal(isPageVisit("GET", "/", page({ "user-agent": "curl/8.4.0" })), false);
  assert.equal(isPageVisit("GET", "/", page({ "user-agent": "" })), false);
});

test("reads the client IP from the edge proxy's headers", () => {
  assert.equal(clientIp(new Headers({ "x-real-ip": "81.2.69.160" })), "81.2.69.160");
  assert.equal(
    clientIp(new Headers({ "x-forwarded-for": " 81.2.69.160 , 100.64.0.2" })),
    "81.2.69.160",
  );
  assert.equal(
    clientIp(new Headers({ "cf-connecting-ip": "2a02:c7c::1", "x-real-ip": "1.1.1.1" })),
    "2a02:c7c::1",
  );
  assert.equal(clientIp(new Headers({ "x-real-ip": "::ffff:81.2.69.160" })), "81.2.69.160");
  assert.equal(clientIp(new Headers()), null);
});

test("private and internal addresses are skipped", () => {
  for (const ip of [
    "10.0.0.1",
    "127.0.0.1",
    "192.168.1.5",
    "172.20.0.1",
    "100.64.3.2",
    "::1",
    "fd00::1",
    "nonsense",
  ]) {
    assert.equal(isPrivateIp(ip), true, ip);
  }
  for (const ip of ["81.2.69.160", "172.32.0.1", "8.8.8.8", "2a02:c7c::1"]) {
    assert.equal(isPrivateIp(ip), false, ip);
  }
});

test("days are UK dates", () => {
  // 23:30 UTC in summer is already the next day in the UK.
  assert.equal(ukDay(new Date("2026-07-01T23:30:00Z")), "2026-07-02");
  assert.equal(ukDay(new Date("2026-12-01T23:30:00Z")), "2026-12-01");
});

test("place labels skip blanks and repeats", () => {
  assert.equal(
    placeLabel({ city: "Leeds", region: "England", country: "United Kingdom" }),
    "Leeds, England, United Kingdom",
  );
  assert.equal(
    placeLabel({ city: "Singapore", region: "Singapore", country: "Singapore" }),
    "Singapore",
  );
  assert.equal(placeLabel({ city: "", region: "", country: "France" }), "France");
  assert.equal(placeLabel({ city: "", region: "", country: "" }), "Unknown location");
});
