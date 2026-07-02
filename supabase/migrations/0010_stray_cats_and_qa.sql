-- Stray cat identities, capture traits/privacy, AI embeddings, super admin

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- stray_cats (canonical cat identity)
-- ---------------------------------------------------------------------------
create table if not exists public.stray_cats (
  id uuid primary key default gen_random_uuid(),
  canonical_name text,
  name_locked_at timestamptz,
  primary_lat double precision,
  primary_lng double precision,
  place_label text,
  sighting_count integer not null default 1,
  cover_sticker_url text,
  image_embedding vector(512),
  created_at timestamptz not null default now()
);

create index if not exists stray_cats_sighting_count_idx
  on public.stray_cats (sighting_count desc);

create index if not exists stray_cats_location_idx
  on public.stray_cats (primary_lat, primary_lng);

alter table public.stray_cats enable row level security;

drop policy if exists "Stray cats readable by authenticated" on public.stray_cats;
create policy "Stray cats readable by authenticated"
  on public.stray_cats for select
  to authenticated
  using (true);

drop policy if exists "Stray cats insertable by authenticated" on public.stray_cats;
create policy "Stray cats insertable by authenticated"
  on public.stray_cats for insert
  to authenticated
  with check (true);

drop policy if exists "Stray cats updatable by authenticated" on public.stray_cats;
create policy "Stray cats updatable by authenticated"
  on public.stray_cats for update
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- captures additions
-- ---------------------------------------------------------------------------
alter table public.captures
  add column if not exists stray_cat_id uuid references public.stray_cats (id) on delete set null,
  add column if not exists share_photo boolean not null default false,
  add column if not exists share_location boolean not null default false,
  add column if not exists short_description text,
  add column if not exists traits jsonb,
  add column if not exists image_embedding vector(512),
  add column if not exists name_locked_at timestamptz;

create index if not exists captures_stray_cat_id_idx
  on public.captures (stray_cat_id);

create index if not exists captures_share_photo_idx
  on public.captures (share_photo)
  where share_photo = true;

-- Public shared sightings (no original photo_url exposure)
drop policy if exists "Shared captures readable" on public.captures;
create policy "Shared captures readable"
  on public.captures for select
  to authenticated
  using (share_photo = true);

-- ---------------------------------------------------------------------------
-- profiles: super admin
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

-- ---------------------------------------------------------------------------
-- name_polls: close tracking
-- ---------------------------------------------------------------------------
alter table public.name_polls
  add column if not exists closed_at timestamptz;

-- ---------------------------------------------------------------------------
-- Backfill: one stray_cat per existing capture
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  new_id uuid;
begin
  for r in
    select c.id as capture_id, c.nickname, c.lat, c.lng, c.place_label, c.sticker_url, c.caught_at
    from public.captures c
    where c.stray_cat_id is null
      and c.lat is not null
      and c.lng is not null
  loop
    new_id := gen_random_uuid();
    insert into public.stray_cats (
      id, canonical_name, primary_lat, primary_lng, place_label,
      sighting_count, cover_sticker_url, created_at
    ) values (
      new_id, r.nickname, r.lat, r.lng, r.place_label,
      1, r.sticker_url, r.caught_at
    );
    update public.captures set stray_cat_id = new_id where id = r.capture_id;
  end loop;
end $$;

-- Recount sighting_count per stray cat
update public.stray_cats sc
set sighting_count = sub.cnt
from (
  select stray_cat_id, count(*)::integer as cnt
  from public.captures
  where stray_cat_id is not null
  group by stray_cat_id
) sub
where sc.id = sub.stray_cat_id;
