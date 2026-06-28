-- Wireframe polish: name polls, place labels, vote mission

alter table public.captures
  add column if not exists place_label text;

create table if not exists public.name_polls (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.captures (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  option_a text not null,
  option_b text not null,
  created_at timestamptz not null default now(),
  unique (capture_id)
);

alter table public.name_polls enable row level security;

drop policy if exists "Polls readable" on public.name_polls;
create policy "Polls readable"
  on public.name_polls for select to authenticated using (true);

drop policy if exists "Users insert own polls" on public.name_polls;
create policy "Users insert own polls"
  on public.name_polls for insert with check (auth.uid() = user_id);

create table if not exists public.name_poll_votes (
  poll_id uuid not null references public.name_polls (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  choice text not null check (choice in ('a', 'b')),
  created_at timestamptz not null default now(),
  primary key (poll_id, user_id)
);

alter table public.name_poll_votes enable row level security;

drop policy if exists "Votes readable" on public.name_poll_votes;
create policy "Votes readable"
  on public.name_poll_votes for select to authenticated using (true);

drop policy if exists "Users insert own votes" on public.name_poll_votes;
create policy "Users insert own votes"
  on public.name_poll_votes for insert with check (auth.uid() = user_id);

insert into public.missions (id, title, description, icon, xp_reward, target_count, metric_type) values
  ('vote_names', 'Vote on cat names', 'Help the community pick names for strays.', '🗳️', 60, 1, 'name_votes')
on conflict (id) do nothing;
