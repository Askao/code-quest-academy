import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { placeLabel } from "@/lib/visitor-location";

type Source = "person" | "datacentre" | "unfiltered";
type PlaceRow = {
  country_code: string;
  country: string;
  region: string;
  city: string;
  source: Source;
  visitors: number;
  last_seen: string;
};
type Report = {
  places: PlaceRow[];
  totals: Record<Source, number>;
  funnel: { home: number; signup: number; accounts: number };
};

const RANGES = [
  [1, "Today"],
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
] as const;

const SOURCES: { key: Source; label: string; help: string }[] = [
  {
    key: "person",
    label: "Probably people",
    help: "A browser that ran the page and was scrolled, tapped or typed in, on a home, school or phone connection.",
  },
  {
    key: "datacentre",
    label: "Probably bots",
    help: "Came from a cloud data centre (Amazon, Google, Microsoft and the like), where bots and AI crawlers run.",
  },
  {
    key: "unfiltered",
    label: "Before filtering",
    help: "Counted before 26 October 2026, when bots weren't filtered out. May be mostly bots.",
  },
];

/** Admin-only: where visitors come from and how far they get, as counts. No names, no IPs. */
export function VisitorLocations() {
  const [days, setDays] = useState<number>(7);
  const [source, setSource] = useState<Source>("person");
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-visitor-locations", days],
    queryFn: async () => {
      // Not in the generated types (see 20261026120000_visitor_bot_filter.sql).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("admin_visitor_locations", {
        _days: days,
      });
      if (error) throw error;
      return data as Report;
    },
  });

  const places = (data?.places ?? []).filter((p) => p.source === source);
  const shown = showAll ? places : places.slice(0, 25);
  const busiest = places[0]?.visitors ?? 0;
  const funnel = data?.funnel;

  return (
    <section className="panel space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Visitors</h2>
          <p className="text-sm text-muted-foreground">
            Roughly where people open the site from, and how far they get. Each person counts once a
            day. Only counts are kept: no names, accounts or IP addresses.
          </p>
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Time range">
          {RANGES.map(([value, label]) => (
            <Button
              key={value}
              size="sm"
              variant={days === value ? "default" : "outline"}
              aria-pressed={days === value}
              onClick={() => {
                setDays(value);
                setShowAll(false);
              }}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          Couldn't load visitors: {(error as Error).message}
        </p>
      ) : isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Who to show">
            {SOURCES.filter((s) => s.key !== "unfiltered" || data.totals.unfiltered > 0).map(
              (s) => (
                <button
                  key={s.key}
                  type="button"
                  aria-pressed={source === s.key}
                  onClick={() => {
                    setSource(s.key);
                    setShowAll(false);
                  }}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    source === s.key
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <span className="block font-mono text-xs text-muted-foreground">{s.label}</span>
                  <span className="mt-1 block text-2xl font-bold">{data.totals[s.key]}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{s.help}</span>
                </button>
              ),
            )}
          </div>

          {funnel ? (
            <div>
              <p className="text-sm font-medium">Towards an account (people only)</p>
              <ol className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                {[
                  ["Visited the homepage", funnel.home],
                  ["Opened the sign-up form", funnel.signup],
                  ["Created an account", funnel.accounts],
                ].map(([label, n], i) => (
                  <li key={label as string} className="flex items-center gap-2">
                    {i > 0 ? (
                      <span aria-hidden="true" className="text-muted-foreground">
                        →
                      </span>
                    ) : null}
                    <span className="rounded-md border border-border px-3 py-1.5">
                      <span className="font-semibold">{n}</span>{" "}
                      <span className="text-muted-foreground">{label}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Accounts include any made by people you sent a link to directly, who may never have
                seen the homepage.
              </p>
            </div>
          ) : null}

          {places.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No visits of this kind in this period yet. Counting starts once the server has loaded
              its location files, a minute or so after each deploy.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border text-left font-mono text-xs text-muted-foreground">
                    <tr>
                      <th className="p-2">Place</th>
                      <th className="p-2 text-right">Visits</th>
                      <th className="hidden p-2 sm:table-cell" aria-hidden="true"></th>
                      <th className="p-2 text-right">Last seen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((p) => (
                      <tr
                        key={`${p.country_code}|${p.region}|${p.city}`}
                        className="border-b border-border/60"
                      >
                        <td className="p-2">{placeLabel(p)}</td>
                        <td className="p-2 text-right font-mono">{p.visitors}</td>
                        <td className="hidden w-1/3 p-2 sm:table-cell" aria-hidden="true">
                          <div className="h-2 rounded bg-muted">
                            <div
                              className="h-2 rounded bg-primary"
                              style={{ width: `${Math.max(2, (p.visitors / busiest) * 100)}%` }}
                            />
                          </div>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap text-muted-foreground">
                          {new Date(p.last_seen).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {places.length > 25 && (
                <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
                  {showAll ? "Show top 25" : `Show all ${places.length} places`}
                </Button>
              )}
            </>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Approximate: a school or mobile network can show up as a nearby city, and students on
        identical school computers sharing one connection may count as one person. IP geolocation by{" "}
        <a className="underline" href="https://db-ip.com" target="_blank" rel="noreferrer">
          DB-IP
        </a>
        .
      </p>
    </section>
  );
}
