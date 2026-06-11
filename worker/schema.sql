-- IvritSuite anonymous metrics — D1 (SQLite) schema.
-- One row per (UTC day, event, country); n is summed on conflict.
-- We store ONLY these four columns: no IP, no user-agent, no identifiers.
CREATE TABLE IF NOT EXISTS daily_counts (
  day     TEXT NOT NULL,             -- 'YYYY-MM-DD' (UTC)
  event   TEXT NOT NULL,             -- e.g. 'worksheets' (server-side allow-listed)
  country TEXT NOT NULL DEFAULT '??',-- 2-letter CF-IPCountry, or '??' when unknown
  n       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, event, country)
);

-- The primary key covers the upsert lookups; this index helps the /stats
-- country rollup (GROUP BY country across all days/events).
CREATE INDEX IF NOT EXISTS idx_event_country ON daily_counts(event, country);
