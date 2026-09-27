-- Drafts for the new browser-based task editor (/admin/task-drafts).
--
-- Deliberately NOT where live task content comes from: lesson, homework,
-- project and practice task text all still live in src/content/*.json,
-- reviewed through git before anything reaches a student (see content.ts's
-- own comment on why). This table is a queue a teacher can fill in from the
-- browser - title, brief, hints, and test cases proven against a real
-- solution in the same in-browser Pyodide students use - which Claude Code
-- (or the teacher, editing the JSON by hand) then turns into the real
-- content and a migration. A draft never becomes visible to a student on
-- its own; "applied" just means someone has since done that by hand.
create table public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  track text not null default 'gcse' check (track in ('gcse', 'alevel')),
  topic text not null,
  title text not null default '',
  tier int not null default 1 check (tier between 1 and 4),
  difficulty int not null default 1 check (difficulty between 1 and 5),
  xp int not null default 10 check (xp > 0),
  stretch boolean not null default false,
  brief text not null default '',
  starter text not null default '',
  hints jsonb not null default '[]'::jsonb,
  tests jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'ready', 'applied')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_drafts_status on public.content_drafts (status, topic);

grant select, insert, update, delete on public.content_drafts to authenticated;
grant all on public.content_drafts to service_role;
alter table public.content_drafts enable row level security;

-- A shared queue: any teacher or admin can see, edit or remove any draft
-- (this is a small-school authoring tool, not a personal scratchpad), but
-- only a teacher or admin can create one, and only as themselves.
create policy "teachers read drafts" on public.content_drafts for select to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teachers create drafts" on public.content_drafts for insert to authenticated
  with check (
    created_by = auth.uid()
    and (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'))
  );
create policy "teachers update drafts" on public.content_drafts for update to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));
create policy "teachers delete drafts" on public.content_drafts for delete to authenticated
  using (public.has_role(auth.uid(), 'teacher') or public.has_role(auth.uid(), 'admin'));

create or replace function public.set_content_draft_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger content_drafts_touch
  before update on public.content_drafts
  for each row execute function public.set_content_draft_updated_at();

notify pgrst, 'reload schema';
