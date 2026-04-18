-- ============================================================
-- Migration 001: Add section / group / route / timing / templates
--                to the drugs table.
--
-- Safe to run on production data:
--   1. All new columns added as nullable first
--   2. Existing discharge drugs back-filled
--   3. NOT NULL + DEFAULT constraints added last
--   4. Cross-constraint prevents invalid section/group combos
-- ============================================================

-- Step 1: Add new nullable columns
ALTER TABLE drugs
  ADD COLUMN IF NOT EXISTS section                    TEXT,
  ADD COLUMN IF NOT EXISTS group_key                  TEXT,
  ADD COLUMN IF NOT EXISTS route                      TEXT,
  ADD COLUMN IF NOT EXISTS default_timing             TEXT,
  ADD COLUMN IF NOT EXISTS instruction_template_plain TEXT,
  ADD COLUMN IF NOT EXISTS instruction_template_html  TEXT;

-- Step 2: Assign all existing rows to section = 'discharge'
UPDATE drugs
  SET section = 'discharge'
  WHERE section IS NULL;

-- Step 3: Map legacy category → group_key for discharge drugs
UPDATE drugs SET group_key = 'antibiotics'
  WHERE group_key IS NULL AND category = 'Antibiotics';

UPDATE drugs SET group_key = 'tranquilizers'
  WHERE group_key IS NULL AND category = 'Tranquilizers';

-- Anti-Inflammatories, Miscellaneous, Supplements → pain_medications
UPDATE drugs SET group_key = 'pain_medications'
  WHERE group_key IS NULL
    AND category IN ('Anti-Inflammatories', 'Miscellaneous', 'Supplements');

-- Catch-all: any remaining discharge drugs without a group_key
UPDATE drugs SET group_key = 'pain_medications'
  WHERE group_key IS NULL AND section = 'discharge';

-- Step 4: Set NOT NULL + DEFAULT constraints
ALTER TABLE drugs
  ALTER COLUMN section    SET DEFAULT 'discharge',
  ALTER COLUMN group_key  SET DEFAULT 'pain_medications';

ALTER TABLE drugs
  ALTER COLUMN section   SET NOT NULL,
  ALTER COLUMN group_key SET NOT NULL;

-- Step 5: Value constraints
ALTER TABLE drugs
  ADD CONSTRAINT drugs_section_check
    CHECK (section IN ('discharge', 'anesthesia'));

ALTER TABLE drugs
  ADD CONSTRAINT drugs_group_key_check
    CHECK (group_key IN (
      'antibiotics', 'pain_medications', 'tranquilizers',
      'pre_op', 'peri_op', 'post_op'
    ));

-- Step 6: Cross-constraint — group must belong to section
ALTER TABLE drugs
  ADD CONSTRAINT drugs_section_group_check
    CHECK (
      (section = 'discharge'  AND group_key IN ('antibiotics', 'pain_medications', 'tranquilizers'))
      OR
      (section = 'anesthesia' AND group_key IN ('pre_op', 'peri_op', 'post_op'))
    );
