-- Five challenges got their starter_code seeded with a literal backslash-n
-- (two characters: \ and n) instead of an actual newline - the seed
-- migration used a plain '...' string literal, which Postgres does not
-- escape, rather than E'...'. This breaks every "Run" and "Test" click on
-- these tasks with "SyntaxError: unexpected character after line
-- continuation character", since a bare backslash not at the true end of
-- a physical line is invalid Python.
update public.challenges
set starter_code = replace(starter_code, '\n', E'\n')
where slug in (
  'gcse-seq-greeting',
  'gcse-func-square',
  'gcse-func-isprime',
  'alevel-rec-factorial',
  'alevel-oop-class'
);
