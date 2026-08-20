-- gcse-fundamentals-t2-01 was replaced (no longer asks students to call
-- type(), per teacher feedback that it's a Python debugging curiosity, not
-- an OCR-examined skill - the new task tests type selection through
-- behaviour instead). Most display fields are overlaid from
-- src/content/gcse-fundamentals.json at render time by withContent(), but
-- homework.$homeworkId.tsx reads challenges.title directly without that
-- overlay, so the DB row's title needs updating too or the homework list
-- would still show the old "Name that type" title.
update public.challenges set title = 'Keep the decimal place' where slug = 'gcse-fundamentals-t2-01';
