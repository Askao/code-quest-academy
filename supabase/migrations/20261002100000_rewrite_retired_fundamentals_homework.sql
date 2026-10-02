-- gcse-fundamentals-hw-09/14/24 were retired from the content files on
-- 13 Sept (they needed %, >= and == before Selection is taught), but their
-- rows stayed in the homework pool with only the placeholder brief, so
-- students were being set tasks with no wording, starter code or tests.
-- They now have real tasks in src/content/gcse-fundamentals.json that use
-- only casting, arithmetic and f-strings. Slugs, difficulty and XP are
-- unchanged, so existing attempts and personal homework lists stay valid;
-- only the stored titles need to match the new wording.
update public.challenges set title = 'Change from a £20 note' where slug = 'gcse-fundamentals-hw-09';
update public.challenges set title = 'Years until you are 18' where slug = 'gcse-fundamentals-hw-14';
update public.challenges set title = 'Bake sale total' where slug = 'gcse-fundamentals-hw-24';
