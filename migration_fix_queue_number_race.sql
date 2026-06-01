-- ============================================
-- Migration: Fix Queue Number Assignment Race Condition
-- ============================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
--
-- PROBLEM:
--   The original join_queue() function uses FOR UPDATE on queue_configs to
--   serialize concurrent queue joins. However, when the first student registers
--   for a new group, the queue_configs row does not exist yet. FOR UPDATE on
--   zero rows acquires NO lock, so concurrent transactions race through and
--   can read the same MAX(queue_number), producing duplicate or out-of-order
--   queue numbers.
--
-- FIX:
--   Insert the queue_configs row (if missing) BEFORE acquiring the FOR UPDATE
--   lock. This guarantees the lock row always exists, properly serializing
--   all concurrent registrations.
-- ============================================

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

  -- 1. Ensure the queue_configs row exists BEFORE locking.
  --    Without this, FOR UPDATE finds zero rows and acquires NO lock,
  --    allowing concurrent transactions to race and assign duplicate/out-of-order numbers.
  INSERT INTO queue_configs (schedule_id, year_level, enrollment_type)
  VALUES (p_schedule_id, p_year_level, p_enrollment_type)
  ON CONFLICT (schedule_id, year_level, enrollment_type) DO NOTHING;

  -- 2. Lock the queue configuration row (year-level grouping, no course_id)
  PERFORM 1 FROM queue_configs 
  WHERE schedule_id = p_schedule_id 
    AND year_level = p_year_level 
    AND enrollment_type = p_enrollment_type
  FOR UPDATE;

  -- 3. Find the current highest queue number for this year-level group
  SELECT COALESCE(MAX(queue_number), 0) + 1 INTO v_next_num
  FROM queue_entries
  WHERE schedule_id = p_schedule_id 
    AND year_level = p_year_level 
    AND enrollment_type = p_enrollment_type;

  -- 4. Insert the new queue entry (course_id is stored as metadata)
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
