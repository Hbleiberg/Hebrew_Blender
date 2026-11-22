-- IvritSuite accounts & cloud saves — migration 14: a twelfth tool id in saves.tool (the Tefillah Trainer).
--
-- Why: tefillah_trainer.html keeps its settings, its favorite prayers and their folder tree in the account the way
-- the Torah Trainer keeps its own (three rows of IVRIT_SYNC_REGISTRY in js/ivrit-saves.js: TefillahTrainer/settings,
-- one TefillahTrainer/favorite row per favorite, TefillahTrainer/favoriteFolders). A favorite is a pointer to a prayer
-- of the page's catalog ({ kind, prayer, nusach }) with a name, a colour and, optionally, display settings: no new
-- kind of data. saves.tool is a CHECK that lists the tool ids, mirroring `var TOOLS`; until it names TefillahTrainer
-- the server refuses every upload from that page with 23514 (and its status line can only say "limit of saved items").
--
-- What it does: exactly what 0004, 0005, 0007 and 0013 did. Postgres cannot widen a CHECK in place, so the one
-- constraint is dropped and re-created with the twelfth id, inside the single transaction a migration runs as.
-- Nothing that holds data is touched: no table, row, policy or function is dropped, every existing row already
-- satisfies the new list, and RLS on public.saves is unchanged. This is the house rule "no drop" read the same
-- narrow way those four read it — a CHECK has no other way to change — and db/README.md names all five.
--
-- Apply it BEFORE the Tefillah Trainer reaches main: it only widens a list, so applying it early changes nothing for
-- the pages that are live, and applying it late leaves every signed-in save from the new page refused until it runs.
--
-- Read the constraint back first, and again afterwards (twelve ids):
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.saves'::regclass and contype = 'c';
--
-- How to apply: like 0013 — paste it into the SQL editor, or let Claude Code apply it through the Supabase
-- connector. Running it again is harmless (the same constraint is dropped and re-created with the same list).

alter table public.saves drop constraint if exists saves_tool_check;

alter table public.saves add constraint saves_tool_check
  check (tool in ('Suite', 'Worksheet', 'FlashCards', 'Dictionary', 'TorahTrainer', 'TropeTutor', 'Dashboard', 'LetterLearner', 'EmojiTorah', 'NameTags', 'Classes', 'TefillahTrainer'));
