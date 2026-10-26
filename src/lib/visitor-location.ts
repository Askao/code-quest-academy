/**
 * Which visits count, where the visitor's IP is read from, and whether it
 * belongs to a data centre. Pure logic only (no network, no database) so it
 * can be tested; the lookup and recording live in visitor-location.server.ts.
 *
 * A visit is counted only when the page has loaded in a browser AND someone
 * has scrolled, tapped, typed or moved the mouse: the browser then posts a
 * small "beacon" (src/components/VisitBeacon.tsx). Most bots never run the
 * page's code, and the few that do rarely act like a person, so this alone
 * removes most of them. Connections from cloud data centres (where bots and
 * AI crawlers run) are counted separately as "probably bots".
 *
 * What gets stored is a daily count per place and per step (homepage, sign-up
 * page), never the IP address, the browser or anything tying a visit to an
 * account. See 20261025120000_visitor_locations.sql and
 * 20261026120000_visitor_bot_filter.sql.
 */

export const VISIT_PATH = "/api/visit";

// Crawlers and link-preview fetchers that say what they are.
const BOT_UA =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|embedly|headless|lighthouse|curl|wget|python-requests|httpclient|go-http-client|okhttp|monitor|uptime/i;

/** The steps towards an account that are counted, beyond the visit itself. */
export type VisitStep = "home" | "signup" | "other";

/** Which step a page is: the homepage, the sign-up form, or anything else. */
export function visitStep(pathname: string, search: Record<string, unknown>): VisitStep {
  if (pathname === "/") return "home";
  if (pathname === "/auth" && search["mode"] === "signup") return "signup";
  return "other";
}

/** Reads the step a beacon claims, defaulting to "other" for anything unexpected. */
export function parseStep(body: unknown): VisitStep {
  const page = (body as { page?: unknown } | null)?.page;
  return page === "home" || page === "signup" ? page : "other";
}

/** True for a beacon posted by this site's own pages from a browser that isn't a declared bot. */
export function isBeacon(method: string, headers: Headers, siteHost: string): boolean {
  if (method !== "POST") return false;
  const origin = headers.get("origin");
  let originHost = "";
  try {
    originHost = origin ? new URL(origin).host : "";
  } catch {
    originHost = "";
  }
  if (!originHost || (originHost !== siteHost && originHost !== headers.get("host"))) return false;
  const ua = headers.get("user-agent") ?? "";
  return ua !== "" && !BOT_UA.test(ua);
}

// Networks of the cloud and hosting companies bots and AI crawlers run on.
// Deliberately NOT listed: Cloudflare, Akamai and Fastly, because iPhone users
// with iCloud Private Relay (and Cloudflare WARP) browse through them, and
// mobile and home broadband providers, obviously.
const DATACENTRE_ASNS = new Set([
  16509,
  14618,
  8987, // Amazon / AWS
  15169,
  396982,
  19527, // Google, Google Cloud
  8075,
  8068,
  8069, // Microsoft / Azure
  14061, // DigitalOcean
  16276, // OVH
  24940,
  213230, // Hetzner
  63949, // Linode (Akamai Connected Cloud)
  20473, // Vultr (Choopa)
  31898, // Oracle Cloud
  45102,
  37963, // Alibaba
  132203,
  45090, // Tencent
  51167, // Contabo
  12876, // Scaleway
  60781,
  28753,
  59253,
  7203,
  30633, // Leaseweb
  36352, // ColoCrossing
  62567,
  8100, // Digital Ocean / QuadraNet
  136907,
  55990, // Huawei Cloud
  398324,
  398101, // Censys, GoDaddy hosting
  32934, // Meta (facebookexternalhit fetchers)
]);

const DATACENTRE_NAMES =
  /amazon|\baws\b|google cloud|google llc|microsoft|azure|digitalocean|ovh|hetzner|linode|vultr|choopa|oracle|alibaba|tencent|contabo|scaleway|leaseweb|colocrossing|hosting|datacenter|data center|server|vps|cloud computing/i;

/** True when the connection comes from a cloud or hosting network rather than a home, school or phone. */
export function isDatacentre(asn: number | undefined, org: string | undefined): boolean {
  if (asn !== undefined && DATACENTRE_ASNS.has(asn)) return true;
  return org !== undefined && DATACENTRE_NAMES.test(org);
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
