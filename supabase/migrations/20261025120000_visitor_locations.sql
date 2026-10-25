-- Where the site is being used from, for the admin page - with no way back to
-- who. The server (src/lib/visitor-location.server.ts) looks each visitor's
-- IP up in a location database file on its own disk and sends only the
-- place here; the IP itself is never stored. One row per UK day and place,
-- counting people once per day each.
--
-- Nothing here mentions a user, an IP, a browser or a page, so a row can't
-- be joined to an account: a visitor who is signed in and one who isn't
-- look the same.
create table if not exists public.visitor_locations (
  day date not null,
  country_code text not null default '',
  country text not null default '',
  region text not null default '',
  city text not null default '',
  visitors integer not null default 0,
  primary key (day, country_code, region, city)
);
alter table public.visitor_locations enable row level security;
revoke all on public.visitor_locations from public, anon, authenticated;
grant all on public.visitor_locations to service_role;

-- Called by the server (service role) once per new visitor per day.
create or replace function public.record_visitor_location(
  _country_code text, _country text, _region text, _city text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visitor_locations as v (day, country_code, country, region, city, visitors)
  values (
    (now() at time zone 'Europe/London')::date,
    left(coalesce(_country_code, ''), 2),
    left(coalesce(_country, ''), 100),
    left(coalesce(_region, ''), 100),
    left(coalesce(_city, ''), 100),
    1
  )
  on conflict (day, country_code, region, city)
  do update set visitors = v.visitors + 1, country = excluded.country;
$$;
revoke all on function public.record_visitor_location(text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_visitor_location(text, text, text, text) to service_role;

-- The admin page's view: totals per place over the last _days UK days
-- (today included), busiest first, plus a per-day total for the same window.
-- One jsonb value, so PostgREST's 1,000-row cut-off can't trim it.
create or replace function public.admin_visitor_locations(_days integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _from date := (now() at time zone 'Europe/London')::date - greatest(1, least(coalesce(_days, 7), 366)) + 1;
begin
  if not exists (
    select 1 from public.user_roles where user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Admins only';
  end if;

  return jsonb_build_object(
    'places', coalesce((
      select jsonb_agg(p order by p.visitors desc, p.country, p.region, p.city)
      from (
        select country_code, max(country) as country, region, city,
               sum(visitors)::int as visitors, max(day) as last_seen
        from public.visitor_locations
        where day >= _from
        group by country_code, region, city
      ) p
    ), '[]'::jsonb),
    'days', coalesce((
      select jsonb_agg(d order by d.day)
      from (
        select day, sum(visitors)::int as visitors
        from public.visitor_locations
        where day >= _from
        group by day
      ) d
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.admin_visitor_locations(integer) from public, anon;
grant execute on function public.admin_visitor_locations(integer) to authenticated;
