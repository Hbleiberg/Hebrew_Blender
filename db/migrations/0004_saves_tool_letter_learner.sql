-- IvritSuite accounts & cloud saves — migration 4: an eighth tool id in saves.tool (the Letter Learner).
--
-- Why: letter_learner.html keeps its options (which vowels show, the Fonts tab, the dagesh-pair layout, word
-- audio) as one LetterLearner/settings row. saves.tool is a CHECK that lists the tool ids, mirroring
-- `var TOOLS` in js/ivrit-saves.js; until it names LetterLearner the server refuses every upload from that
-- page with 23514 (and the page's status line can only say "limit of saved items").
--
-- What it does: Postgres cannot widen a CHECK in place, so the one constraint is dropped and re-created with
-- the eighth id, inside the single transaction a migration runs as. Nothing that holds data is touched: no
-- table, row, policy or function is dropped, every existing row already satisfies the new list, and RLS on
-- public.saves is unchanged. This is the one place the house rule "no drop" is read narrowly — a CHECK has no
-- other way to change — and db/README.md names it.
--
-- Read the constraint back first (its name is the one 0001's inline `check (...)` was given by Postgres):
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.saves'::regclass and contype = 'c';
--
-- How to apply: like 0001 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (the same constraint is dropped and re-created with the same list).

alter table public.saves drop constraint if exists saves_tool_check;

alter table public.saves add constraint saves_tool_check
  check (tool in ('Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard', 'LetterLearner'));
