-- Visitor locations, now telling people from bots. Visits are only counted
-- once a page has run in a browser and been interacted with, and visits from
-- cloud data centres (where bots and AI crawlers run) are counted separately.
-- See src/lib/visitor-location.ts.
--
-- Rows counted before this change could not tell the two apart, so they are
-- kept but labelled 'unfiltered'.
alter table public.visitor_locations
  add column if not exists source text not null default 'unfiltered';
alter table public.visitor_locations alter column source set default 'person';
alter table public.visitor_locations drop constraint if exists visitor_locations_source_check;
alter table public.visitor_locations
  add constraint visitor_locations_source_check
  check (source in ('person', 'datacentre', 'unfiltered'));
alter table public.visitor_locations drop constraint if exists visitor_locations_pkey;
alter table public.visitor_locations
  add primary key (day, country_code, region, city, source);

drop function if exists public.record_visitor_location(text, text, text, text);
create or replace function public.record_visitor_location(
  _country_code text, _country text, _region text, _city text, _source text
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visitor_locations as v (day, country_code, country, region, city, source, visitors)
  values (
    (now() at time zone 'Europe/London')::date,
    left(coalesce(_country_code, ''), 2),
    left(coalesce(_country, ''), 100),
    left(coalesce(_region, ''), 100),
    left(coalesce(_city, ''), 100),
    case when _source = 'datacentre' then 'datacentre' else 'person' end,
    1
  )
  on conflict (day, country_code, region, city, source)
  do update set visitors = v.visitors + 1, country = excluded.country;
$$;
revoke all on function public.record_visitor_location(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.record_visitor_location(text, text, text, text, text) to service_role;

-- How far visitors get towards an account: the homepage, then the sign-up
-- form. Counts per UK day only. Accounts created come from profiles.
create table if not exists public.visit_steps (
  day date not null,
  step text not null check (step in ('home', 'signup')),
  source text not null check (source in ('person', 'datacentre')),
  visitors integer not null default 0,
  primary key (day, step, source)
);
alter table public.visit_steps enable row level security;
revoke all on public.visit_steps from public, anon, authenticated;
grant all on public.visit_steps to service_role;

create or replace function public.record_visit_step(_step text, _source text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.visit_steps as v (day, step, source, visitors)
  select (now() at time zone 'Europe/London')::date, _step,
         case when _source = 'datacentre' then 'datacentre' else 'person' end, 1
  where _step in ('home', 'signup')
  on conflict (day, step, source) do update set visitors = v.visitors + 1;
$$;
revoke all on function public.record_visit_step(text, text) from public, anon, authenticated;
grant execute on function public.record_visit_step(text, text) to service_role;

-- The admin page's view over the last _days UK days (today included):
-- places with their source, totals per source, and the sign-up funnel for
-- people (homepage -> sign-up form -> accounts created). One jsonb value, so
-- PostgREST's 1,000-row cut-off can't trim it.
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
        select country_code, max(country) as country, region, city, source,
               sum(visitors)::int as visitors, max(day) as last_seen
        from public.visitor_locations
        where day >= _from
        group by country_code, region, city, source
      ) p
    ), '[]'::jsonb),
    'totals', jsonb_build_object(
      'person', coalesce((select sum(visitors) from public.visitor_locations where day >= _from and source = 'person'), 0),
      'datacentre', coalesce((select sum(visitors) from public.visitor_locations where day >= _from and source = 'datacentre'), 0),
      'unfiltered', coalesce((select sum(visitors) from public.visitor_locations where day >= _from and source = 'unfiltered'), 0)
    ),
    'funnel', jsonb_build_object(
      'home', coalesce((select sum(visitors) from public.visit_steps where day >= _from and step = 'home' and source = 'person'), 0),
      'signup', coalesce((select sum(visitors) from public.visit_steps where day >= _from and step = 'signup' and source = 'person'), 0),
      'accounts', (select count(*) from public.profiles
                   where (created_at at time zone 'Europe/London')::date >= _from)
    )
  );
end;
$$;
revoke all on function public.admin_visitor_locations(integer) from public, anon;
grant execute on function public.admin_visitor_locations(integer) to authenticated;
