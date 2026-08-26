-- Drop all application tables, types, triggers, and functions.
-- Run in Supabase Dashboard → SQL Editor.
-- WARNING: This permanently deletes all data.

-- Tables (leaf → root to respect foreign key constraints)
drop table if exists public.allocation_logs      cascade;
drop table if exists public.feedback             cascade;
drop table if exists public.allocations          cascade;
drop table if exists public.mentor_preferences   cascade;
drop table if exists public.mentees              cascade;
drop table if exists public.mentors              cascade;
drop table if exists public.mentor_sessions      cascade;

-- Functions (triggers are dropped automatically with their tables via CASCADE)
drop function if exists public.set_updated_at()            cascade;
drop function if exists public.validate_preference_session() cascade;

-- Enum types
drop type if exists public.allocation_method     cascade;
drop type if exists public.participant_type      cascade;
drop type if exists public.session_status        cascade;
