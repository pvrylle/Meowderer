-- CatDex initial schema (PRD section 10)
-- Safe to run in the Supabase SQL editor. All tables have RLS enabled with
-- owner-only access. Storage buckets + policies are created at the bottom.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are readable by owner" on public.profiles;
create policy "Profiles are readable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- captures (one row per photographed cat)
-- ---------------------------------------------------------------------------
create table if not exists public.captures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  photo_url text not null,      -- original (private bucket path)
  sticker_url text not null,    -- transparent PNG (stickers bucket path)
  lat double precision,         -- null if GPS off
  lng double precision,
  city text,
  country text,
  coat_type text,               -- classifier output (P2)
  rarity text,                  -- common|uncommon|rare|epic (P2)
  nickname text,
  caught_at timestamptz not null default now()
);

create index if not exists captures_user_id_caught_at_idx
  on public.captures (user_id, caught_at desc);

alter table public.captures enable row level security;

drop policy if exists "Users can read their own captures" on public.captures;
create policy "Users can read their own captures"
  on public.captures for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own captures" on public.captures;
create policy "Users can insert their own captures"
  on public.captures for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own captures" on public.captures;
create policy "Users can update their own captures"
  on public.captures for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own captures" on public.captures;
create policy "Users can delete their own captures"
  on public.captures for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- achievements (static catalog) + user_achievements (unlocks) -- P2
-- ---------------------------------------------------------------------------
create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text,
  icon text
);

alter table public.achievements enable row level security;

drop policy if exists "Achievements are readable by everyone" on public.achievements;
create policy "Achievements are readable by everyone"
  on public.achievements for select
  using (true);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id text not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.user_achievements enable row level security;

drop policy if exists "Users can read their own achievements" on public.user_achievements;
create policy "Users can read their own achievements"
  on public.user_achievements for select
  using (auth.uid() = user_id);

drop policy if exists "Users can unlock their own achievements" on public.user_achievements;
create policy "Users can unlock their own achievements"
  on public.user_achievements for insert
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage buckets
--   captures  -> private originals (signed URLs only)
--   stickers  -> public transparent PNGs
-- Files are stored under a top-level folder named after the owner's user id,
-- e.g. "<uid>/<capture-id>.png", which the policies below enforce.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('captures', 'captures', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('stickers', 'stickers', true)
on conflict (id) do nothing;

-- captures bucket: owner-only read/write
drop policy if exists "Owner can read captures" on storage.objects;
create policy "Owner can read captures"
  on storage.objects for select
  using (
    bucket_id = 'captures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owner can write captures" on storage.objects;
create policy "Owner can write captures"
  on storage.objects for insert
  with check (
    bucket_id = 'captures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owner can delete captures" on storage.objects;
create policy "Owner can delete captures"
  on storage.objects for delete
  using (
    bucket_id = 'captures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- stickers bucket: public read, owner-only write
drop policy if exists "Anyone can read stickers" on storage.objects;
create policy "Anyone can read stickers"
  on storage.objects for select
  using (bucket_id = 'stickers');

drop policy if exists "Owner can write stickers" on storage.objects;
create policy "Owner can write stickers"
  on storage.objects for insert
  with check (
    bucket_id = 'stickers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owner can delete stickers" on storage.objects;
create policy "Owner can delete stickers"
  on storage.objects for delete
  using (
    bucket_id = 'stickers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
