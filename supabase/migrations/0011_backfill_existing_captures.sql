-- Re-link existing captures that were missed by the initial 0010 backfill
-- (migration not run yet, captures added before 0010, or stray_cat_id still null).

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
      1, r.sticker_url, coalesce(r.caught_at, now())
    );
    update public.captures set stray_cat_id = new_id where id = r.capture_id;
  end loop;
end $$;

update public.stray_cats sc
set sighting_count = sub.cnt
from (
  select stray_cat_id, count(*)::integer as cnt
  from public.captures
  where stray_cat_id is not null
  group by stray_cat_id
) sub
where sc.id = sub.stray_cat_id;
