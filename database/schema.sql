-- Mentor Session application schema for Supabase (PostgreSQL).
-- Run this once in Supabase Dashboard → SQL Editor.

create type public.session_status as enum ('draft', 'registration', 'allocation', 'published', 'closed');
create type public.allocation_method as enum ('preference', 'fallback', 'manual');
create type public.participant_type as enum ('mentor', 'mentee');
create type public.mentor_approval_status as enum ('pending', 'approved', 'rejected');

create table public.mentor_sessions (
  id uuid primary key default gen_random_uuid(),
  year integer not null unique,
  title text not null,
  status public.session_status not null default 'draft',
  registration_open boolean not null default false,
  mentor_reg_open   boolean not null default false,
  mentee_reg_open   boolean not null default false,
  prefs_open        boolean not null default false,
  event_starts_at timestamptz,
  venue text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mentors (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  student_id text,
  email text not null,
  phone text,
  batch text,
  communication_method text not null check (communication_method in ('WhatsApp', 'Email', 'Phone Call', 'In-Person')),
  profile_photo_url text,
  capacity smallint not null default 2 check (capacity between 1 and 10),
  approval_status public.mentor_approval_status not null default 'approved',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id),
  unique (session_id, email)
);

create table public.mentees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  student_id text not null,
  email text not null,
  phone text not null,
  batch text not null,
  preference_submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, student_id),
  unique (session_id, email)
);

create table public.mentor_preferences (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.mentees(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete restrict,
  priority smallint not null check (priority between 1 and 3),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (mentee_id, priority),
  unique (mentee_id, mentor_id)
);

create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions(id) on delete cascade,
  mentee_id uuid not null references public.mentees(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete restrict,
  method public.allocation_method not null,
  matched_priority smallint check (matched_priority between 1 and 3),
  allocated_at timestamptz not null default now(),
  unique (mentee_id)
);

create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.mentor_sessions(id) on delete cascade,
  participant_type public.participant_type not null,
  participant_id uuid not null,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (session_id, participant_type, participant_id)
);

create table public.allocation_logs (
  id bigint generated always as identity primary key,
  session_id uuid not null references public.mentor_sessions(id) on delete cascade,
  action text not null,
  detail text,
  created_at timestamptz not null default now()
);

create index mentee_session_submitted_idx on public.mentees(session_id, preference_submitted_at);
create index preferences_mentee_idx on public.mentor_preferences(mentee_id, priority);
create index allocations_session_mentor_idx on public.allocations(session_id, mentor_id);

-- Keeps updated_at current without relying on application code.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger mentor_sessions_set_updated_at before update on public.mentor_sessions for each row execute function public.set_updated_at();
create trigger mentors_set_updated_at before update on public.mentors for each row execute function public.set_updated_at();
create trigger mentees_set_updated_at before update on public.mentees for each row execute function public.set_updated_at();

-- Preferences can only connect participants from the same session.
create or replace function public.validate_preference_session()
returns trigger language plpgsql as $$
declare
  mentee_session uuid;
  mentor_session uuid;
begin
  select session_id into mentee_session from public.mentees where id = new.mentee_id;
  select session_id into mentor_session from public.mentors where id = new.mentor_id;
  if mentee_session is null or mentor_session is null or mentee_session <> mentor_session then
    raise exception 'A preference must reference a mentor and mentee from the same session';
  end if;
  return new;
end;
$$;

create trigger preferences_validate_session before insert or update on public.mentor_preferences
for each row execute function public.validate_preference_session();

-- Application routes use the server-only service-role key. RLS prevents direct browser access.
alter table public.mentor_sessions enable row level security;
alter table public.mentors enable row level security;
alter table public.mentees enable row level security;
alter table public.mentor_preferences enable row level security;
alter table public.allocations enable row level security;
alter table public.feedback enable row level security;
alter table public.allocation_logs enable row level security;

-- Create the session that the API selects. Change dates/venue as needed.
insert into public.mentor_sessions (year, title, status, registration_open, mentor_reg_open, mentee_reg_open, prefs_open, event_starts_at, venue)
values (2026, 'Mentor Session 2026', 'registration', true, true, true, true, '2026-09-05 03:30:00+00', 'Main Auditorium, Faculty of Technology')
on conflict (year) do update set
  title = excluded.title,
  status = excluded.status,
  registration_open = excluded.registration_open,
  mentor_reg_open   = excluded.mentor_reg_open,
  mentee_reg_open   = excluded.mentee_reg_open,
  prefs_open        = excluded.prefs_open,
  event_starts_at   = excluded.event_starts_at,
  venue             = excluded.venue;
