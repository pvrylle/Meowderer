-- Community: feed, chat, rescue alerts (Phase 4)

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  image_url text,
  category text not null default 'sighting',
  lat double precision,
  lng double precision,
  likes_count int not null default 0,
  comments_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

alter table public.posts enable row level security;

drop policy if exists "Posts readable by authenticated" on public.posts;
create policy "Posts readable by authenticated"
  on public.posts for select to authenticated using (true);

drop policy if exists "Users insert own posts" on public.posts;
create policy "Users insert own posts"
  on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "Users update own posts" on public.posts;
create policy "Users update own posts"
  on public.posts for update using (auth.uid() = user_id);

drop policy if exists "Users delete own posts" on public.posts;
create policy "Users delete own posts"
  on public.posts for delete using (auth.uid() = user_id);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_likes enable row level security;

drop policy if exists "Likes readable" on public.post_likes;
create policy "Likes readable" on public.post_likes for select to authenticated using (true);

drop policy if exists "Users insert own likes" on public.post_likes;
create policy "Users insert own likes"
  on public.post_likes for insert with check (auth.uid() = user_id);

drop policy if exists "Users delete own likes" on public.post_likes;
create policy "Users delete own likes"
  on public.post_likes for delete using (auth.uid() = user_id);

create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

drop policy if exists "Comments readable" on public.post_comments;
create policy "Comments readable" on public.post_comments for select to authenticated using (true);

drop policy if exists "Users insert own comments" on public.post_comments;
create policy "Users insert own comments"
  on public.post_comments for insert with check (auth.uid() = user_id);

create table if not exists public.rescue_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  body text,
  lat double precision,
  lng double precision,
  urgent boolean not null default false,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.rescue_alerts enable row level security;

drop policy if exists "Alerts readable" on public.rescue_alerts;
create policy "Alerts readable" on public.rescue_alerts for select to authenticated using (true);

drop policy if exists "Users insert alerts" on public.rescue_alerts;
create policy "Users insert alerts"
  on public.rescue_alerts for insert with check (auth.uid() = user_id);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel text not null default 'general',
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_channel_created_idx
  on public.chat_messages (channel, created_at desc);

alter table public.chat_messages enable row level security;

drop policy if exists "Chat readable" on public.chat_messages;
create policy "Chat readable" on public.chat_messages for select to authenticated using (true);

drop policy if exists "Users insert chat" on public.chat_messages;
create policy "Users insert chat"
  on public.chat_messages for insert with check (auth.uid() = user_id);

-- Realtime for chat (enable in Supabase dashboard if needed)
-- alter publication supabase_realtime add table public.chat_messages;

-- demo seed alerts (optional, idempotent via fixed uuids not used — skip inserts)
