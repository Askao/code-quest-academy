/**
 * Records roughly where each visitor is (city, region, country) without
 * keeping who they are. Called from src/server.ts for every request; does
 * nothing unless the request is a real page load (see visitor-location.ts).
 *
 * Privacy, deliberately:
 * - The IP is looked up in a database file on this server (DB-IP's free
 *   "IP to City Lite", CC BY 4.0). It is never sent to a third-party lookup
 *   service and never written to the database or the logs.
 * - Each person is counted once per UK day. To tell repeat page loads apart
 *   without storing anything, a hash of IP + browser with a random salt is kept
 *   in memory for the day only; the salt is never saved, so once the day (or
 *   the process) ends, even we can't link a hash back to an IP.
 * - Only (day, country, region, city, count) reaches Postgres.
 *
 * Settings (environment variables):
 * - VISITOR_LOCATIONS=off    turns the whole thing off.
 * - GEOIP_DB_PATH=/path.mmdb use an .mmdb file you supply (DB-IP or MaxMind
 *                            GeoLite2-City format) instead of downloading one.
 * Otherwise the latest DB-IP file is downloaded to the temp directory on first
 * use (about 60 MB, ~130 MB in memory) and refreshed every 30 days.
 */
import { createHash, randomBytes } from "node:crypto";
import { createWriteStream, existsSync, statSync } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import maxmind, { type CityResponse, type Reader } from "maxmind";
import { clientIp, isPageVisit, isPrivateIp, ukDay, type Place } from "./visitor-location";

const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 60 * 60 * 1000;
// Bounds memory if something floods the site; past this, a day's extra
// visitors are still counted, just not de-duplicated.
const MAX_SEEN_PER_DAY = 200_000;

let reader: Reader<CityResponse> | null = null;
let loadedAt = 0;
let loading: Promise<void> | null = null;
let lastFailureAt = 0;

let seenDay = "";
let seenSalt = randomBytes(32);
let seen = new Set<string>();

function enabled(): boolean {
  return (process.env["VISITOR_LOCATIONS"] ?? "").toLowerCase() !== "off";
}

function dbipUrl(monthsAgo: number): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - monthsAgo);
  const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return `https://download.db-ip.com/free/dbip-city-lite-${ym}.mmdb.gz`;
}

async function download(target: string): Promise<void> {
  // The new month's file appears a day or so into the month, so fall back to last month's.
  let lastError: unknown;
  for (const monthsAgo of [0, 1]) {
    const url = dbipUrl(monthsAgo);
    try {
      const res = await fetch(url);
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status} for ${url}`);
      const partial = `${target}.partial`;
      await pipeline(
        Readable.fromWeb(res.body as import("node:stream/web").ReadableStream),
        createGunzip(),
        createWriteStream(partial),
      );
      await rename(partial, target);
      return;
    } catch (error) {
      lastError = error;
      await unlink(`${target}.partial`).catch(() => {});
    }
  }
  throw lastError;
}

async function loadReader(): Promise<void> {
  const supplied = process.env["GEOIP_DB_PATH"];
  if (supplied) {
    reader = await maxmind.open<CityResponse>(supplied);
    loadedAt = Date.now();
    return;
  }
  const file = join(tmpdir(), "hcode-dbip-city-lite.mmdb");
  const fresh = existsSync(file) && Date.now() - statSync(file).mtimeMs < REFRESH_MS;
  if (!fresh) await download(file);
  // The library's own file watcher isn't needed: we re-open after a refresh.
  reader = await maxmind.open<CityResponse>(file, { watchForUpdates: false });
  loadedAt = Date.now();
}

/** The lookup database, loading it in the background the first time. Null until it's ready. */
function getReader(): Reader<CityResponse> | null {
  const stale = !process.env["GEOIP_DB_PATH"] && Date.now() - loadedAt > REFRESH_MS;
  const mayTry = Date.now() - lastFailureAt > RETRY_AFTER_FAILURE_MS;
  if ((!reader || stale) && !loading && mayTry) {
    loading = loadReader()
      .catch((error) => {
        lastFailureAt = Date.now();
        console.error("[visitor-location] couldn't load the location database:", error);
      })
      .finally(() => {
        loading = null;
      });
  }
  return reader;
}

function lookup(db: Reader<CityResponse>, ip: string): Place {
  const hit = db.get(ip);
  return {
    countryCode: hit?.country?.iso_code ?? "",
    country: hit?.country?.names?.en ?? "",
    region: hit?.subdivisions?.[0]?.names?.en ?? "",
    city: hit?.city?.names?.en ?? "",
  };
}

/** True the first time this person is seen today. */
function firstVisitToday(day: string, ip: string, ua: string): boolean {
  if (day !== seenDay) {
    seenDay = day;
    seenSalt = randomBytes(32);
    seen = new Set();
  }
  const key = createHash("sha256")
    .update(seenSalt)
    .update(ip)
    .update("\n")
    .update(ua)
    .digest("base64");
  if (seen.has(key)) return false;
  if (seen.size < MAX_SEEN_PER_DAY) seen.add(key);
  return true;
}

/** Notes where a page visit came from. Never throws and never delays the response. */
export function noteVisit(request: Request): void {
  try {
    if (!enabled()) return;
    const { pathname } = new URL(request.url);
    if (!isPageVisit(request.method, pathname, request.headers)) return;
    const ip = clientIp(request.headers);
    if (!ip || isPrivateIp(ip) || !maxmind.validate(ip)) return;
    const db = getReader();
    // Until the database has loaded (a minute or so after a deploy) visits go uncounted
    // rather than being recorded as "unknown".
    if (!db) return;
    if (!firstVisitToday(ukDay(new Date()), ip, request.headers.get("user-agent") ?? "")) return;
    const place = lookup(db, ip);
    void record(place);
  } catch (error) {
    console.error("[visitor-location]", error);
  }
}

async function record(place: Place): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).rpc("record_visitor_location", {
      _country_code: place.countryCode,
      _country: place.country,
      _region: place.region,
      _city: place.city,
    });
    if (error) console.error("[visitor-location] record:", error.message);
  } catch (error) {
    console.error("[visitor-location] record:", error);
  }
}
