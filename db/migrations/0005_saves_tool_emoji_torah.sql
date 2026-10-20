-- IvritSuite accounts & cloud saves — migration 5: a ninth tool id in saves.tool (the Parsha Emojis page).
--
-- Why: emoji_torah.html keeps the options of its coloring-sheet printer (paper, orientation, which parts print,
-- their sizes, the text language, copies and order) as one EmojiTorah/settings row. saves.tool is a CHECK that
-- lists the tool ids, mirroring `var TOOLS` in js/ivrit-saves.js; until it names EmojiTorah the server refuses
-- every upload from that page with 23514 (and the page's status line can only say "limit of saved items").
--
-- What it does: exactly what 0004 did for the Letter Learner. Postgres cannot widen a CHECK in place, so the one
-- constraint is dropped and re-created with the ninth id, inside the single transaction a migration runs as.
-- Nothing that holds data is touched: no table, row, policy or function is dropped, every existing row already
-- satisfies the new list, and RLS on public.saves is unchanged. This is the house rule "no drop" read the same
-- narrow way 0004 read it — a CHECK has no other way to change — and db/README.md names both.
--
-- Read the constraint back first, and again afterwards (nine ids):
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.saves'::regclass and contype = 'c';
--
-- How to apply: like 0004 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (the same constraint is dropped and re-created with the same list).

alter table public.saves drop constraint if exists saves_tool_check;

alter table public.saves add constraint saves_tool_check
  check (tool in ('Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard', 'LetterLearner', 'EmojiTorah'));
