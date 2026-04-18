-- ============================================================
-- Migration 002: Add discharge_generated / anesthesia_generated
--                flags to dose_logs so the admin can tell which
--                type of instructions were produced per session.
--
-- Existing rows are back-filled as discharge-only.
-- ============================================================

ALTER TABLE dose_logs
  ADD COLUMN IF NOT EXISTS discharge_generated  BOOLEAN,
  ADD COLUMN IF NOT EXISTS anesthesia_generated BOOLEAN;

-- Back-fill: all historical logs were discharge sessions
UPDATE dose_logs
  SET discharge_generated  = TRUE,
      anesthesia_generated = FALSE
  WHERE discharge_generated IS NULL;

ALTER TABLE dose_logs
  ALTER COLUMN discharge_generated  SET DEFAULT TRUE,
  ALTER COLUMN anesthesia_generated SET DEFAULT FALSE;

ALTER TABLE dose_logs
  ALTER COLUMN discharge_generated  SET NOT NULL,
  ALTER COLUMN anesthesia_generated SET NOT NULL;
