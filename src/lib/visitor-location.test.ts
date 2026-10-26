import { test } from "node:test";
import assert from "node:assert/strict";
import {
  clientIp,
  isBeacon,
  isDatacentre,
  isPrivateIp,
  parseStep,
  placeLabel,
  ukDay,
  visitStep,
} from "./visitor-location.ts";

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

const SITE = "www.hcodeacademy.co.uk";
const beacon = (extra: Record<string, string> = {}) =>
  new Headers({ "user-agent": CHROME, origin: "https://www.hcodeacademy.co.uk", ...extra });

test("a beacon from the site's own pages in a real browser counts", () => {
  assert.equal(isBeacon("POST", beacon(), SITE), true);
  // Railway's preview domain, or a local run, where the Host header matches the origin.
  assert.equal(
    isBeacon("POST", beacon({ origin: "http://localhost:3000", host: "localhost:3000" }), SITE),
    true,
  );
});

test("other sites, GETs, missing origins and declared bots don't count", () => {
  assert.equal(isBeacon("GET", beacon(), SITE), false);
  assert.equal(isBeacon("POST", beacon({ origin: "https://evil.example" }), SITE), false);
  assert.equal(isBeacon("POST", new Headers({ "user-agent": CHROME }), SITE), false);
  assert.equal(
    isBeacon("POST", beacon({ "user-agent": "Mozilla/5.0 (compatible; Googlebot/2.1)" }), SITE),
    false,
  );
  assert.equal(isBeacon("POST", beacon({ "user-agent": "HeadlessChrome/130" }), SITE), false);
  assert.equal(isBeacon("POST", beacon({ "user-agent": "" }), SITE), false);
});

test("pages map to steps: homepage, sign-up form, anything else", () => {
  assert.equal(visitStep("/", {}), "home");
  assert.equal(visitStep("/auth", { mode: "signup" }), "signup");
  assert.equal(visitStep("/auth", {}), "other");
  assert.equal(visitStep("/dashboard", {}), "other");
  assert.equal(parseStep({ page: "signup" }), "signup");
  assert.equal(parseStep({ page: "admin" }), "other");
  assert.equal(parseStep(null), "other");
});

test("cloud and hosting networks are data centres; broadband, mobile and Private Relay aren't", () => {
  assert.equal(isDatacentre(16509, "AMAZON-02"), true);
  assert.equal(isDatacentre(15169, "GOOGLE"), true);
  assert.equal(isDatacentre(8075, "MICROSOFT-CORP-MSN-AS-BLOCK"), true);
  assert.equal(isDatacentre(99999, "Some Hosting Ltd"), true);
  assert.equal(isDatacentre(2856, "British Telecommunications PLC"), false);
  assert.equal(isDatacentre(5089, "Virgin Media Limited"), false);
  assert.equal(isDatacentre(25135, "Vodafone Limited"), false);
  assert.equal(isDatacentre(786, "Jisc Services Limited"), false); // UK schools and universities
  assert.equal(isDatacentre(13335, "Cloudflare, Inc."), false); // iCloud Private Relay / WARP
  assert.equal(isDatacentre(undefined, undefined), false);
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
