/**
 * POST /api/visit - records roughly where each visitor is (city, region,
 * country), whether they look like a person or a bot, and whether they reached
 * the homepage or the sign-up form, without keeping who they are. The beacon
 * is sent by src/components/VisitBeacon.tsx once a page has loaded and been
 * interacted with; see visitor-location.ts for what counts.
 *
 * Privacy, deliberately:
 * - The IP is looked up in database files on this server (DB-IP's free
 *   "IP to City Lite" and "IP to ASN Lite", CC BY 4.0). It is never sent to a
 *   third-party lookup service and never written to the database or the logs.
 * - Each person is counted once per UK day (and once per step). To tell
 *   repeat visits apart without storing anything, a hash of IP + browser with
 *   a random salt is kept in memory for the day only; the salt is never saved,
 *   so once the day (or the process) ends, even we can't link a hash back to
 *   an IP. Students on identical school machines behind one connection can
 *   count as one, so the numbers are a floor, not a ceiling.
 * - Only (day, place, person-or-bot, count) and (day, step, count) reach Postgres.
 *
 * Settings (environment variables):
 * - VISITOR_LOCATIONS=off        turns the whole thing off.
 * - GEOIP_DB_PATH=/path.mmdb     a city .mmdb you supply (DB-IP or MaxMind
 *                                GeoLite2-City format) instead of downloading one.
 * - GEOIP_ASN_DB_PATH=/path.mmdb likewise for the ASN file (GeoLite2-ASN format).
 * Otherwise the latest DB-IP files are downloaded to the temp directory on
 * first use (about 60 MB and 4 MB, ~140 MB in memory) and refreshed every 30 days.
 */
import { createHash, randomBytes } from "node:crypto";
import { createWriteStream, existsSync, statSync } from "node:fs";
import { rename, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import maxmind, {
  type AsnResponse,
  type CityResponse,
  type Reader,
  type Response as MmdbResponse,
} from "maxmind";
import {
  clientIp,
  isBeacon,
  isDatacentre,
  isPrivateIp,
  parseStep,
  ukDay,
  VISIT_PATH,
  type Place,
} from "./visitor-location";

export { VISIT_PATH };

const REFRESH_MS = 30 * 24 * 60 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 60 * 60 * 1000;
// Bounds memory if something floods the site; past this, a day's extra
// visitors are still counted, just not de-duplicated.
const MAX_SEEN_PER_DAY = 200_000;

/** One DB-IP lookup file, downloaded and loaded in the background on first use. */
class LookupFile<T extends MmdbResponse> {
  private reader: Reader<T> | null = null;
  private loadedAt = 0;
  private loading: Promise<void> | null = null;
  private lastFailureAt = 0;

  constructor(
    private readonly edition: "city" | "asn",
    private readonly envPath: string,
  ) {}

  private url(monthsAgo: number): string {
    const d = new Date();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() - monthsAgo);
    const ym = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    return `https://download.db-ip.com/free/dbip-${this.edition}-lite-${ym}.mmdb.gz`;
  }

  private async download(target: string): Promise<void> {
    // The new month's file appears a day or so into the month, so fall back to last month's.
    let lastError: unknown;
    for (const monthsAgo of [0, 1]) {
      const url = this.url(monthsAgo);
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

  private async load(): Promise<void> {
    const supplied = process.env[this.envPath];
    if (supplied) {
      this.reader = await maxmind.open<T>(supplied);
      this.loadedAt = Date.now();
      return;
    }
    const file = join(tmpdir(), `hcode-dbip-${this.edition}-lite.mmdb`);
    const fresh = existsSync(file) && Date.now() - statSync(file).mtimeMs < REFRESH_MS;
    if (!fresh) await this.download(file);
    // The library's own file watcher isn't needed: we re-open after a refresh.
    this.reader = await maxmind.open<T>(file, { watchForUpdates: false });
    this.loadedAt = Date.now();
  }

  /** The loaded file, starting a (re)load in the background when needed. Null until ready. */
  get(): Reader<T> | null {
    const stale = !process.env[this.envPath] && Date.now() - this.loadedAt > REFRESH_MS;
    const mayTry = Date.now() - this.lastFailureAt > RETRY_AFTER_FAILURE_MS;
    if ((!this.reader || stale) && !this.loading && mayTry) {
      this.loading = this.load()
        .catch((error) => {
          this.lastFailureAt = Date.now();
          console.error(`[visitor-location] couldn't load the ${this.edition} database:`, error);
        })
        .finally(() => {
          this.loading = null;
        });
    }
    return this.reader;
  }
}

const cityFile = new LookupFile<CityResponse>("city", "GEOIP_DB_PATH");
const asnFile = new LookupFile<AsnResponse>("asn", "GEOIP_ASN_DB_PATH");

let seenDay = "";
let seenSalt = randomBytes(32);
let seen = new Set<string>();

function enabled(): boolean {
  return (process.env["VISITOR_LOCATIONS"] ?? "").toLowerCase() !== "off";
}

function lookupPlace(db: Reader<CityResponse>, ip: string): Place {
  const hit = db.get(ip);
  return {
    countryCode: hit?.country?.iso_code ?? "",
    country: hit?.country?.names?.en ?? "",
    region: hit?.subdivisions?.[0]?.names?.en ?? "",
    city: hit?.city?.names?.en ?? "",
  };
}

/** True the first time this key (a person, or a person at a step) is seen today. */
function firstToday(day: string, parts: string[]): boolean {
  if (day !== seenDay) {
    seenDay = day;
    seenSalt = randomBytes(32);
    seen = new Set();
  }
  const hash = createHash("sha256").update(seenSalt);
  for (const p of parts) hash.update(p).update("\n");
  const key = hash.digest("base64");
  if (seen.has(key)) return false;
  if (seen.size < MAX_SEEN_PER_DAY) seen.add(key);
  return true;
}

const noContent = () => new Response(null, { status: 204 });

/** Handles a visit beacon. Always answers 204: nothing about the outcome is worth telling a browser. */
export async function handleVisit(request: Request): Promise<Response> {
  try {
    if (!enabled()) return noContent();
    const siteHost = new URL(process.env["SITE_URL"] ?? "https://www.hcodeacademy.co.uk").host;
    if (!isBeacon(request.method, request.headers, siteHost)) return noContent();
    const step = parseStep(await request.json().catch(() => null));
    const ip = clientIp(request.headers);
    if (!ip || isPrivateIp(ip) || !maxmind.validate(ip)) return noContent();
    const city = cityFile.get();
    const asnDb = asnFile.get();
    // Until both files have loaded (a minute or so after a deploy) visits go
    // uncounted rather than being recorded as unknown or unclassified.
    if (!city || !asnDb) return noContent();

    const ua = request.headers.get("user-agent") ?? "";
    const day = ukDay(new Date());
    const asn = asnDb.get(ip);
    const source = isDatacentre(asn?.autonomous_system_number, asn?.autonomous_system_organization)
      ? "datacentre"
      : "person";

    if (firstToday(day, [ip, ua])) await recordPlace(lookupPlace(city, ip), source);
    if (step !== "other" && firstToday(day, [ip, ua, step])) await recordStep(step, source);
  } catch (error) {
    console.error("[visitor-location]", error);
  }
  return noContent();
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseAdmin as any).rpc(fn, args);
    if (error) console.error(`[visitor-location] ${fn}:`, error.message);
  } catch (error) {
    console.error(`[visitor-location] ${fn}:`, error);
  }
}

function recordPlace(place: Place, source: string): Promise<void> {
  return rpc("record_visitor_location", {
    _country_code: place.countryCode,
    _country: place.country,
    _region: place.region,
    _city: place.city,
    _source: source,
  });
}

function recordStep(step: string, source: string): Promise<void> {
  return rpc("record_visit_step", { _step: step, _source: source });
}
