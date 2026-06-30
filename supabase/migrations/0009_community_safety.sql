-- Community safety: reports, blocks, rate limits, soft-hide, tighter alert RLS

alter table public.profiles
  add column if not exists community_guidelines_at timestamptz,
  add column if not exists community_banned_until timestamptz;

alter table public.posts
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_reason text;

alter table public.post_comments
  add column if not exists hidden_at timestamptz;

alter table public.chat_messages
  add column if not exists hidden_at timestamptz;

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  content_type text not null check (
    content_type in ('post', 'comment', 'chat_message', 'rescue_alert', 'user')
  ),
  content_id text not null,
  reported_user_id uuid references auth.users (id) on delete set null,
  reason text not null check (
    reason in ('harassment', 'spam', 'inappropriate', 'false_alert', 'other')
  ),
  details text,
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);

create index if not exists content_reports_status_created_idx
  on public.content_reports (status, created_at desc);

alter table public.content_reports enable row level security;

drop policy if exists "Users insert own reports" on public.content_reports;
create policy "Users insert own reports"
  on public.content_reports for insert
  with check (auth.uid() = reporter_id);

drop policy if exists "Users read own reports" on public.content_reports;
create policy "Users read own reports"
  on public.content_reports for select
  using (auth.uid() = reporter_id);

create table if not exists public.user_blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

drop policy if exists "Users manage own blocks" on public.user_blocks;
create policy "Users manage own blocks"
  on public.user_blocks for all
  using (auth.uid() = blocker_id)
  with check (auth.uid() = blocker_id);

create table if not exists public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_user_action_created_idx
  on public.rate_limit_events (user_id, action, created_at desc);

alter table public.rate_limit_events enable row level security;

drop policy if exists "Users insert own rate events" on public.rate_limit_events;
create policy "Users insert own rate events"
  on public.rate_limit_events for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users read own rate events" on public.rate_limit_events;
create policy "Users read own rate events"
  on public.rate_limit_events for select
  using (auth.uid() = user_id);

-- Authors can delete own comments
drop policy if exists "Users delete own comments" on public.post_comments;
create policy "Users delete own comments"
  on public.post_comments for delete
  using (auth.uid() = user_id);

-- Tighten rescue alert updates: only resolve fields, not rewrite content
drop policy if exists "Users resolve alerts" on public.rescue_alerts;
drop policy if exists "Users resolve alerts only" on public.rescue_alerts;
create policy "Users resolve alerts only"
  on public.rescue_alerts for update
  to authenticated
  using (resolved = false and user_id <> auth.uid())
  with check (
    resolved = true
    and resolved_by = auth.uid()
    and resolved_at is not null
  );
