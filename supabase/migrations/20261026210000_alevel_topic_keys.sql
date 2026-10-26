-- A level topics get proper lesson paths (see ALEVEL_TOPICS in game.ts).
-- The old "data structures" topic key had a space in it, which can't sit in a
-- lesson address (/learn/alevel-data structures-1), so it becomes
-- "data-structures" everywhere it is stored. Safe to run more than once.
update public.challenges set topic = 'data-structures' where topic = 'data structures';
update public.skills set topic = 'data-structures' where topic = 'data structures';
update public.lessons set topic = 'data-structures' where topic = 'data structures';
update public.content_drafts set topic = 'data-structures' where topic = 'data structures';
update public.homework
  set topics = array_replace(topics, 'data structures', 'data-structures')
  where 'data structures' = any(topics);
