import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { placeLabel } from "@/lib/visitor-location";

type PlaceRow = {
  country_code: string;
  country: string;
  region: string;
  city: string;
  visitors: number;
  last_seen: string;
};
type DayRow = { day: string; visitors: number };

const RANGES = [
  [1, "Today"],
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
] as const;

/** Admin-only: where visitors come from, as counts per place. No names, no IPs. */
export function VisitorLocations() {
  const [days, setDays] = useState<number>(7);
  const [showAll, setShowAll] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-visitor-locations", days],
    queryFn: async () => {
      // Not in the generated types yet (added by 20261025120000_visitor_locations.sql).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc("admin_visitor_locations", {
        _days: days,
      });
      if (error) throw error;
      return data as { places: PlaceRow[]; days: DayRow[] };
    },
  });

  const places = data?.places ?? [];
  const total = (data?.days ?? []).reduce((sum, d) => sum + d.visitors, 0);
  const countries = new Set(places.map((p) => p.country_code || p.country)).size;
  const shown = showAll ? places : places.slice(0, 25);
  const busiest = places[0]?.visitors ?? 0;

  return (
    <section className="panel space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Visitor locations</h2>
          <p className="text-sm text-muted-foreground">
            Roughly where people open the site from. Each person counts once a day. Only the place
            is kept: no names, accounts or IP addresses.
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
          Couldn't load visitor locations: {(error as Error).message}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : places.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No visits recorded in this period yet. Counting starts once the server has loaded its
          location database, a minute or so after each deploy.
        </p>
      ) : (
        <>
          <p className="text-sm">
            <span className="font-semibold">{total}</span> visits from{" "}
            <span className="font-semibold">{places.length}</span>{" "}
            {places.length === 1 ? "place" : "places"} in{" "}
            <span className="font-semibold">{countries}</span>{" "}
            {countries === 1 ? "country" : "countries"}.
          </p>
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
                    <td className="whitespace-nowrap p-2 text-right text-muted-foreground">
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

      <p className="text-xs text-muted-foreground">
        Locations come from the visitor's internet connection, so they're approximate: a school or
        mobile network can show up as a nearby city. IP geolocation by{" "}
        <a className="underline" href="https://db-ip.com" target="_blank" rel="noreferrer">
          DB-IP
        </a>
        .
      </p>
    </section>
  );
}
