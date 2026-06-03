-- ============================================
-- Enrollment Queuing System — Full Database Setup
-- ============================================
-- This is the ONLY SQL file you need for a fresh deployment.
-- Run this entire file in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).
-- It creates all tables, indexes, RLS policies, the RPC function, and seed data.
--
-- For existing deployments, do NOT run this file. Use the individual migration files instead.

-- ============================================
-- 1. Tables
-- ============================================

-- Courses table (used as student metadata — not for queue grouping)
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enrollment schedules table (grouped by year-level + enrollment type)
CREATE TABLE enrollment_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_type TEXT NOT NULL CHECK (enrollment_type IN ('block_section', 'irregular')),
  year_level INT NOT NULL CHECK (year_level BETWEEN 0 AND 4),
  schedule_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (enrollment_type, year_level, schedule_date, start_time)
);

-- Queue entries table (course_id is stored as metadata only)
CREATE TABLE queue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES enrollment_schedules(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  year_level INT NOT NULL CHECK (year_level BETWEEN 0 AND 4),
  enrollment_type TEXT NOT NULL CHECK (enrollment_type IN ('block_section', 'irregular')),
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  queue_number INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'skipped', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Queue configs table (per year-level per schedule — NO course_id)
CREATE TABLE queue_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID NOT NULL REFERENCES enrollment_schedules(id) ON DELETE CASCADE,
  year_level INT NOT NULL CHECK (year_level BETWEEN 0 AND 4),
  enrollment_type TEXT NOT NULL CHECK (enrollment_type IN ('block_section', 'irregular')),
  current_serving INT DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (schedule_id, year_level, enrollment_type)
);

-- ============================================
-- 2. Indexes for Performance
-- ============================================
CREATE INDEX idx_queue_entries_lookup ON queue_entries (schedule_id, year_level, enrollment_type, status);
CREATE INDEX idx_queue_entries_status ON queue_entries (status);
CREATE INDEX idx_queue_configs_lookup ON queue_configs (schedule_id, year_level, enrollment_type);
CREATE INDEX idx_schedules_date ON enrollment_schedules (schedule_date, enrollment_type);

-- ============================================
-- 3. Enable Realtime for Live Queue Updates
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE queue_configs;

-- ============================================
-- 4. Row Level Security (RLS)
-- ============================================

-- Courses: public read, admin write
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read courses" ON courses FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage courses" ON courses FOR ALL USING (auth.role() = 'authenticated');

-- Schedules: public read, admin write
ALTER TABLE enrollment_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read schedules" ON enrollment_schedules FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage schedules" ON enrollment_schedules FOR ALL USING (auth.role() = 'authenticated');

-- Queue entries: public read ONLY (no public insert — all inserts go through the secured API + Service Role key)
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read queue entries" ON queue_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage queue entries" ON queue_entries FOR ALL USING (auth.role() = 'authenticated');

-- Queue configs: public read, admin write
ALTER TABLE queue_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read queue configs" ON queue_configs FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage queue configs" ON queue_configs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 5. RPC Function: Atomic Queue Join
-- ============================================
-- This function prevents two students from getting the same queue number during traffic spikes.
-- It also prevents duplicate registrations (same student_id in the same year-level queue).
-- course_id is accepted as a parameter and stored as metadata but NOT used for queue grouping.

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

  -- 3. Insert the new queue entry (course_id is stored as metadata)
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

-- ============================================
-- 6. Seed Data: Sample Courses (School of Computing)
-- ============================================
INSERT INTO courses (code, name) VALUES
  ('BSCS', 'BS Computer Science'),
  ('BSIT', 'BS Information Technology'),
  ('BSIS', 'BS Information Systems');
