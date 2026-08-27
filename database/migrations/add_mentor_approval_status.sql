-- Migration: add is_approved to mentors table
-- Run in Supabase Dashboard → SQL Editor

-- Drop old enum-based column if it exists (safe re-run)
alter table public.mentors
  drop column if exists approval_status,
  drop column if exists notes;

-- Drop the enum type if it exists from a previous migration attempt
drop type if exists public.mentor_approval_status;

-- Add boolean approval column
--   false = pending review (default for self-registered mentors)
--   true  = approved by admin
alter table public.mentors
  add column if not exists is_approved boolean not null default false;

-- Admin-created mentors are approved immediately
-- (only affects rows inserted before this migration; new ones set it explicitly)
-- Uncomment the line below if you want to auto-approve all existing rows:
-- update public.mentors set is_approved = true;

-- Index for the admin approval queue
create index if not exists mentors_is_approved_idx on public.mentors(session_id, is_approved);
