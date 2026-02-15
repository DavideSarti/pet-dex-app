-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query)

create table pet_dex_data (
  pin text primary key,
  animals jsonb not null default '[]'::jsonb,
  counters jsonb not null default '{"nextId": 2, "nextDexNumber": 2}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Allow anyone with the anon key to read/write (secured by PIN knowledge)
alter table pet_dex_data enable row level security;

create policy "Anyone can read with pin"
  on pet_dex_data for select
  using (true);

create policy "Anyone can insert"
  on pet_dex_data for insert
  with check (true);

create policy "Anyone can update"
  on pet_dex_data for update
  using (true);
