-- Phase 6: retention streaks + community missions support

alter table public.profiles
  add column if not exists streak_count int not null default 0,
  add column if not exists last_capture_date date,
  add column if not exists daily_goal int not null default 1;

alter table public.posts
  add column if not exists capture_id uuid references public.captures (id) on delete set null;

create index if not exists posts_capture_id_idx on public.posts (capture_id);

alter table public.rescue_alerts
  add column if not exists resolved_by uuid references auth.users (id) on delete set null,
  add column if not exists resolved_at timestamptz;

create table if not exists public.user_shelter_visits (
  user_id uuid not null references auth.users (id) on delete cascade,
  osm_id text not null,
  lat double precision not null,
  lng double precision not null,
  name text,
  visited_at timestamptz not null default now(),
  primary key (user_id, osm_id)
);

alter table public.user_shelter_visits enable row level security;

drop policy if exists "Users read own shelter visits" on public.user_shelter_visits;
create policy "Users read own shelter visits"
  on public.user_shelter_visits for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert own shelter visits" on public.user_shelter_visits;
create policy "Users insert own shelter visits"
  on public.user_shelter_visits for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users resolve alerts" on public.rescue_alerts;
create policy "Users resolve alerts"
  on public.rescue_alerts for update
  to authenticated
  using (true)
  with check (true);

insert into public.missions (id, title, description, icon, xp_reward, target_count, metric_type) values
  ('visit_shelter', 'Visit a shelter', 'Check in near an animal shelter on the map.', '🏠', 90, 1, 'shelter_visits'),
  ('verify_rescue', 'Verify a rescue report', 'Mark a community rescue alert as resolved.', '✅', 120, 1, 'verify_rescue')
on conflict (id) do nothing;
