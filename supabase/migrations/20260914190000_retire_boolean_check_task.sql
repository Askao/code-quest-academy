-- "Boolean check" (gcse-fundamentals-t2-03) required a comparison operator
-- (>) that isn't taught until the Selection topic, which comes after
-- Fundamentals in the curriculum - removed from the lesson's task list in
-- content (src/content/gcse-fundamentals.json), along with three sibling
-- homework tasks with the same problem. This challenge already has a real
-- student attempt against it, so rather than delete the row (which would
-- cascade-delete that attempt), flip it to homework_only - same containment
-- already used for its three siblings - so it no longer surfaces via the
-- lesson flow or Practice's random pool, only if a teacher deliberately
-- assigns it as homework.
update public.challenges
set homework_only = true
where slug = 'gcse-fundamentals-t2-03';
