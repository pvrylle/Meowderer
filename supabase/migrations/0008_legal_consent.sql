-- Legal consent, onboarding flag, and public profile read for community author names

alter table public.profiles
  add column if not exists accepted_terms_at timestamptz,
  add column if not exists onboarding_complete boolean not null default false;

-- Authenticated users can read public profile fields (username, avatar) for community display
drop policy if exists "Public profile fields readable" on public.profiles;
create policy "Public profile fields readable"
  on public.profiles for select
  to authenticated
  using (true);
