-- IvritSuite accounts & cloud saves — migration 2: original-size photos in Font Maker cloud projects.
--
-- Phase 5 keeps the photos a project was traced from at their original size (the maintainer's choice):
-- a phone photo is 3–8 MB, so the `font-sources` bucket's 2 MiB per-file cap is raised to 15 MiB, and
-- WebP joins the accepted types (the page uploads each image with the type its data URL declares).
-- Nothing else changes: no table, no policy, no row; the 20 MiB `font-projects` cap stays, because the
-- project file itself carries no rasters (they are separate objects, one per distinct photo).
--
-- How to apply: like 0001 — paste it into the SQL editor, or let Claude Code apply it through the
-- Supabase connector. Running it again is harmless (it sets the same values).

update storage.buckets
   set file_size_limit = 15728640,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'font-sources';
