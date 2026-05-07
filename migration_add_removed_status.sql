-- Run this in the Supabase SQL Editor to add 'removed' status for queue entries
-- This enables soft-delete functionality: students who fail to show up on time
-- are marked as 'removed' instead of being hard-deleted, so they can be 
-- notified via Find Queue.

-- 1. Drop the old CHECK constraint
ALTER TABLE queue_entries DROP CONSTRAINT IF EXISTS queue_entries_status_check;

-- 2. Add the new CHECK constraint with 'removed' included
ALTER TABLE queue_entries ADD CONSTRAINT queue_entries_status_check 
  CHECK (status IN ('waiting', 'serving', 'completed', 'skipped', 'removed'));
