-- Run this once in Supabase SQL Editor for databases created before Google mentor sign-in.

alter table public.mentors
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

alter table public.mentors
  alter column student_id drop not null,
  alter column phone drop not null,
  alter column batch drop not null;

create unique index if not exists mentors_auth_user_id_unique
  on public.mentors (auth_user_id)
  where auth_user_id is not null;
