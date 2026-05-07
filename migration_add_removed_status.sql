-- ============================================
-- Migration: Add 'removed' status to queue_entries
-- ============================================
-- Run this in the Supabase SQL Editor BEFORE migration_year_level_queues.sql
-- This adds the 'removed' status for soft-deleting no-show students.

-- Drop the existing CHECK constraint and recreate it with the new status
ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_status_check;
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check 
  CHECK (status IN ('waiting', 'serving', 'completed', 'skipped', 'removed'));
