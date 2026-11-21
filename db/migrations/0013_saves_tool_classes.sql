-- IvritSuite accounts & cloud saves — migration 13: an eleventh tool id in saves.tool (the shared class roster).
--
-- Why: the class roster every roster-using page shares (ivritSuite_classes: one Classes/class row per class —
-- each student's Hebrew name, English name, an optional typed transliteration and extra line, and a
-- reading-assignments username once linked — plus one small Classes/retired row naming the classes a teacher
-- deleted) syncs under its own tool id, so a sign-out removes it from the device like any other tool's saves.
-- saves.tool is a CHECK that lists the tool ids, mirroring `var TOOLS` in js/ivrit-saves.js; until it names
-- Classes the server refuses every class upload with 23514 (and a page's status line can only say "limit of
-- saved items"). Design: docs/reference/class-roster.md.
--
-- What it does: exactly what 0004, 0005 and 0007 did. Postgres cannot widen a CHECK in place, so the one
-- constraint is dropped and re-created with the eleventh id, inside the single transaction a migration runs as.
-- Nothing that holds data is touched: no table, row, policy or function is dropped, every existing row already
-- satisfies the new list, and RLS on public.saves is unchanged. This is the house rule "no drop" read the same
-- narrow way those three read it — a CHECK has no other way to change — and db/README.md names all four.
--
-- Apply it BEFORE the roster code reaches main: it only widens a list, so applying it early changes nothing for
-- the pages that are live, and applying it late leaves every class upload refused until it runs.
--
-- Read the constraint back first, and again afterwards (eleven ids):
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.saves'::regclass and contype = 'c';
--
-- How to apply: like 0007 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (the same constraint is dropped and re-created with the same list).

alter table public.saves drop constraint if exists saves_tool_check;

alter table public.saves add constraint saves_tool_check
  check (tool in ('Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard', 'LetterLearner', 'EmojiTorah', 'NameTags', 'Classes'));
