-- ============================================
-- Migration: Year-Level Queues
-- ============================================
-- Run this in the Supabase SQL Editor AFTER migration_add_removed_status.sql
-- This removes course_id from queue grouping so queues are per year-level instead of per course.
-- The courses table and queue_entries.course_id stay for student metadata.

-- 1. Remove course_id from queue_configs
ALTER TABLE queue_configs DROP CONSTRAINT IF EXISTS queue_configs_course_id_fkey;
ALTER TABLE queue_configs DROP COLUMN IF EXISTS course_id;

-- 2. Drop old unique constraint and create new one (without course_id)
ALTER TABLE queue_configs 
  DROP CONSTRAINT IF EXISTS queue_configs_schedule_id_course_id_year_level_enrollment_t_key;
ALTER TABLE queue_configs 
  ADD UNIQUE (schedule_id, year_level, enrollment_type);

-- 3. Remove course_id from enrollment_schedules
ALTER TABLE enrollment_schedules DROP CONSTRAINT IF EXISTS enrollment_schedules_course_id_fkey;
ALTER TABLE enrollment_schedules DROP COLUMN IF EXISTS course_id;

-- 4. Drop old unique constraint and create new one for schedules
ALTER TABLE enrollment_schedules 
  DROP CONSTRAINT IF EXISTS enrollment_schedules_course_id_enrollment_type_year_level_s_key;
ALTER TABLE enrollment_schedules 
  ADD UNIQUE (enrollment_type, year_level, schedule_date, start_time);

-- 5. Update indexes (remove course_id from lookup indexes)
DROP INDEX IF EXISTS idx_queue_entries_lookup;
CREATE INDEX idx_queue_entries_lookup ON queue_entries (schedule_id, year_level, enrollment_type, status);

DROP INDEX IF EXISTS idx_queue_configs_lookup;
CREATE INDEX idx_queue_configs_lookup ON queue_configs (schedule_id, year_level, enrollment_type);

-- 6. Replace the RPC function (grouping no longer uses course_id)
CREATE OR REPLACE FUNCTION join_queue(
  p_schedule_id UUID,
  p_course_id UUID,
  p_year_level INT,
  p_enrollment_type TEXT,
  p_student_name TEXT,
  p_student_id TEXT
) RETURNS queue_entries AS $$
DECLARE
  v_next_num INT;
  v_entry queue_entries;
  v_existing queue_entries;
BEGIN
  -- 0. Check for duplicate registration (same student in the same year-level queue, still active)
  SELECT * INTO v_existing
  FROM queue_entries
  WHERE schedule_id = p_schedule_id
    AND year_level = p_year_level
    AND enrollment_type = p_enrollment_type
    AND student_id = p_student_id
    AND status IN ('waiting', 'serving')
  LIMIT 1;

  IF v_existing.id IS NOT NULL THEN
    RAISE EXCEPTION 'DUPLICATE_REGISTRATION:%', v_existing.id;
  END IF;

  -- 1. Lock the queue configuration row (year-level grouping, no course_id)
  PERFORM 1 FROM queue_configs 
  WHERE schedule_id = p_schedule_id 
    AND year_level = p_year_level 
    AND enrollment_type = p_enrollment_type
  FOR UPDATE;

  -- 2. Find the current highest queue number for this year-level group
  SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_next_num
  FROM queue_entries
  WHERE schedule_id = p_schedule_id 
    AND year_level = p_year_level 
    AND enrollment_type = p_enrollment_type;

  -- 3. Insert the new queue entry (course_id is still stored as metadata)
  INSERT INTO queue_entries (
    schedule_id, course_id, year_level, enrollment_type, 
    student_name, student_id, queue_number, status
  )
  VALUES (
    p_schedule_id, p_course_id, p_year_level, p_enrollment_type, 
    p_student_name, p_student_id, v_next_num, 'waiting'
  )
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$ LANGUAGE plpgsql;
