-- Migration: add granular control flags to mentor_sessions
-- Run in Supabase Dashboard → SQL Editor

alter table public.mentor_sessions
  add column if not exists mentor_reg_open   boolean not null default false,
  add column if not exists mentee_reg_open   boolean not null default false,
  add column if not exists prefs_open        boolean not null default false;

-- Back-fill: if registration_open was true, turn on all three
update public.mentor_sessions
  set mentor_reg_open = registration_open,
      mentee_reg_open = registration_open,
      prefs_open      = registration_open;
