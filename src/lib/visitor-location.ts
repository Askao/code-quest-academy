/**
 * Which requests count as a visit, and where the visitor's IP is read from.
 * Pure logic only (no network, no database) so it can be tested; the lookup
 * and recording live in visitor-location.server.ts.
 *
 * What gets stored is a daily count per place (country, region, city), never
 * the IP address, the browser, the page or anything tying a visit to an
 * account. See the migration 20261025120000_visitor_locations.sql.
 */

// Crawlers and link-preview fetchers would otherwise swamp the numbers (and
// put Mountain View at the top of the list).
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python-requests|httpclient|go-http-client|okhttp|monitor|uptime/i;

/** True only for a real browser loading a page: not assets, API calls, bots or prefetches. */
export function isPageVisit(method: string, pathname: string, headers: Headers): boolean {
  if (method !== "GET") return false;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_")) return false;
  // Files with an extension (/assets/x.js, /favicon.ico, /robots.txt) are never pages.
  if (/\.[a-z0-9]+$/i.test(pathname)) return false;
  const dest = headers.get("sec-fetch-dest");
  if (dest !== null && dest !== "document") return false;
  if (dest === null && !(headers.get("accept") ?? "").includes("text/html")) return false;
  const purpose = headers.get("sec-purpose") ?? headers.get("purpose") ?? "";
  if (purpose.includes("prefetch")) return false;
  const ua = headers.get("user-agent") ?? "";
  if (!ua || BOT_UA.test(ua)) return false;
  return true;
}

/**
 * The visitor's IP as forwarded by the host's edge proxy (Railway sets
 * X-Real-IP; Cloudflare, if ever put in front, sets CF-Connecting-IP).
 * These headers can be faked by a visitor, which at worst adds a wrong place
 * to the counts - nothing else trusts them.
 */
export function clientIp(headers: Headers): string | null {
  const raw =
    headers.get("cf-connecting-ip") ??
    headers.get("x-real-ip") ??
    headers.get("x-forwarded-for")?.split(",")[0] ??
    null;
  const ip = raw?.trim().replace(/^::ffff:/i, "");
  return ip ? ip : null;
}

/** Loopback, private-network and link-local addresses have no location to look up. */
export function isPrivateIp(ip: string): boolean {
  if (ip.includes(":")) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80")
    );
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // not an IP at all - treat as unlookupable
  }
  const [a, b] = parts as [number, number, number, number];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 100 && b >= 64 && b <= 127) || // carrier-grade NAT, also Railway's internal range
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/** The UK calendar date, so "today" in the admin view matches the teacher's day. */
export function ukDay(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
}

export type Place = { countryCode: string; country: string; region: string; city: string };

/** Formats a stored place for display: "Leeds, England, United Kingdom". */
export function placeLabel(p: { country: string; region: string; city: string }): string {
  const parts = [p.city, p.region, p.country].filter((s) => s && s.trim() !== "");
  // DB-IP sometimes gives a city the same name as its region (e.g. "London, England" is fine,
  // but "Singapore, Singapore, Singapore" isn't), so drop repeats.
  const unique = parts.filter((s, i) => parts.indexOf(s) === i);
  return unique.length ? unique.join(", ") : "Unknown location";
}
