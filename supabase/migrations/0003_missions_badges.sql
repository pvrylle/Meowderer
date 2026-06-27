-- Missions, badges, and XP (Phase 3)

alter table public.profiles
  add column if not exists total_xp int not null default 0,
  add column if not exists level int not null default 1;

-- missions catalog
create table if not exists public.missions (
  id text primary key,
  title text not null,
  description text,
  icon text,
  xp_reward int not null default 50,
  target_count int not null default 1,
  metric_type text not null
);

alter table public.missions enable row level security;

drop policy if exists "Missions readable by everyone" on public.missions;
create policy "Missions readable by everyone"
  on public.missions for select using (true);

-- per-user mission progress
create table if not exists public.user_missions (
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_id text not null references public.missions (id) on delete cascade,
  progress int not null default 0,
  completed_at timestamptz,
  claimed_at timestamptz,
  primary key (user_id, mission_id)
);

alter table public.user_missions enable row level security;

drop policy if exists "Users read own missions" on public.user_missions;
create policy "Users read own missions"
  on public.user_missions for select using (auth.uid() = user_id);

drop policy if exists "Users insert own missions" on public.user_missions;
create policy "Users insert own missions"
  on public.user_missions for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own missions" on public.user_missions;
create policy "Users update own missions"
  on public.user_missions for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- badges catalog
create table if not exists public.badges (
  id text primary key,
  title text not null,
  icon text,
  color text,
  max_level int not null default 5,
  metric_type text not null
);

alter table public.badges enable row level security;

drop policy if exists "Badges readable by everyone" on public.badges;
create policy "Badges readable by everyone"
  on public.badges for select using (true);

-- per-user badge progress
create table if not exists public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null references public.badges (id) on delete cascade,
  level int not null default 0,
  xp int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists "Users read own badges" on public.user_badges;
create policy "Users read own badges"
  on public.user_badges for select using (auth.uid() = user_id);

drop policy if exists "Users insert own badges" on public.user_badges;
create policy "Users insert own badges"
  on public.user_badges for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own badges" on public.user_badges;
create policy "Users update own badges"
  on public.user_badges for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- seed missions (wireframe-adapted, solo play)
insert into public.missions (id, title, description, icon, xp_reward, target_count, metric_type) values
  ('report_sightings', 'Report 3 sightings', 'Spot and report cats around your city.', '📸', 50, 3, 'capture_count'),
  ('photograph_five', 'Photograph 5 cats', 'Add photos to your CatDex.', '🖼️', 75, 5, 'capture_count'),
  ('visit_locations', 'Visit 3 cat locations', 'Walk to 3 marked cat hotspots.', '📍', 60, 3, 'geotagged_visits'),
  ('two_cities', 'Catch in 2 cities', 'Find strays in two different cities.', '🏙️', 80, 2, 'unique_cities'),
  ('rare_hunter', 'Catch a rare cat', 'Photograph a rare or epic coat.', '✨', 100, 1, 'rare_catches')
on conflict (id) do nothing;

-- seed badges
insert into public.badges (id, title, icon, color, max_level, metric_type) values
  ('explorer', 'Explorer', '🧭', '#8fd6a6', 5, 'unique_cities'),
  ('photographer', 'Photographer', '📷', '#7fb4e8', 5, 'capture_count'),
  ('rescuer', 'Rescuer', '💚', '#f6a96b', 5, 'geotagged_visits'),
  ('cat_lover', 'Cat Lover', '🐱', '#9b7ede', 5, 'capture_count'),
  ('historian', 'Cat Historian', '📖', '#efe4cf', 5, 'unique_countries'),
  ('shelter_hero', 'Shelter Hero', '🏠', '#d9ccf6', 5, 'geotagged_visits'),
  ('community_helper', 'Community Helper', '🤝', '#c9d3e3', 5, 'capture_count')
on conflict (id) do nothing;
