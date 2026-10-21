-- IvritSuite accounts & cloud saves — migration 7: a tenth tool id in saves.tool (the Name Tags page).
--
-- Why: name_tags.html keeps its class lists (one NameTags/list row per list: each student's Hebrew name, English
-- name, an optional typed transliteration and extra line) and its design options (one NameTags/settings row).
-- saves.tool is a CHECK that lists the tool ids, mirroring `var TOOLS` in js/ivrit-saves.js; until it names
-- NameTags the server refuses every upload from that page with 23514 (and the page's status line can only say
-- "limit of saved items").
--
-- What it does: exactly what 0004 and 0005 did. Postgres cannot widen a CHECK in place, so the one constraint is
-- dropped and re-created with the tenth id, inside the single transaction a migration runs as. Nothing that holds
-- data is touched: no table, row, policy or function is dropped, every existing row already satisfies the new
-- list, and RLS on public.saves is unchanged. This is the house rule "no drop" read the same narrow way 0004 and
-- 0005 read it — a CHECK has no other way to change — and db/README.md names all three.
--
-- Read the constraint back first, and again afterwards (ten ids):
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.saves'::regclass and contype = 'c';
--
-- How to apply: like 0005 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (the same constraint is dropped and re-created with the same list).

alter table public.saves drop constraint if exists saves_tool_check;

alter table public.saves add constraint saves_tool_check
  check (tool in ('Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard', 'LetterLearner', 'EmojiTorah', 'NameTags'));
