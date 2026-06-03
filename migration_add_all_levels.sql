-- ============================================
-- Migration: Add "All Levels" Queue Support (year_level = 0)
-- ============================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--
-- This migration relaxes the year_level CHECK constraints on 3 tables
-- to allow year_level = 0, which represents "All Levels" — a single
-- unified queue that students of any year can join.
--
-- WHAT IT DOES:
--   - Drops the existing CHECK constraints (year_level BETWEEN 1 AND 4)
--   - Recreates them as (year_level BETWEEN 0 AND 4)
--   - No structural changes, no new columns, no data migration needed.
-- ============================================

-- 1. enrollment_schedules
ALTER TABLE enrollment_schedules DROP CONSTRAINT enrollment_schedules_year_level_check;
ALTER TABLE enrollment_schedules ADD CONSTRAINT enrollment_schedules_year_level_check CHECK (year_level BETWEEN 0 AND 4);

-- 2. queue_entries
ALTER TABLE queue_entries DROP CONSTRAINT queue_entries_year_level_check;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_year_level_check CHECK (year_level BETWEEN 0 AND 4);

-- 3. queue_configs
ALTER TABLE queue_configs DROP CONSTRAINT queue_configs_year_level_check;
ALTER TABLE queue_configs ADD CONSTRAINT queue_configs_year_level_check CHECK (year_level BETWEEN 0 AND 4);
