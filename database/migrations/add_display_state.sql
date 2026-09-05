-- Migration: display state table for realtime presentation control
-- Run in Supabase Dashboard → SQL Editor

create table if not exists public.display_state (
  id         integer primary key default 1,         -- single-row table
  scene      jsonb   not null default '{"type":"idle"}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint display_state_single_row check (id = 1)
);

-- Insert the one row if it doesn't exist
insert into public.display_state (id, scene)
values (1, '{"type":"idle"}')
on conflict (id) do nothing;

-- RLS: readable by everyone (display screen is public), writable only via service-role
alter table public.display_state enable row level security;

create policy "display_state_read" on public.display_state
  for select using (true);
