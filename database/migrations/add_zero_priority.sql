-- Migration: zero-priority pre-assignments
-- Run in Supabase Dashboard → SQL Editor
-- This table is intentionally invisible to the regular admin dashboard.

create table if not exists public.zero_priority_assignments (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.mentor_sessions(id) on delete cascade,
  -- student_id of the mentee (matched at allocation time when they register)
  mentee_student_id  text not null,
  mentor_id     uuid not null references public.mentors(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (session_id, mentee_student_id)
);

-- Only accessible via service-role key (RLS blocks all other access)
alter table public.zero_priority_assignments enable row level security;

create index if not exists zp_session_idx on public.zero_priority_assignments(session_id);
