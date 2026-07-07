-- Automatically keep stray_cats.sighting_count in sync with captures,
-- and delete orphaned stray_cats rows when their last capture is removed.

create or replace function public.sync_stray_sighting_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- A new capture was linked to a stray — bump the count.
    if new.stray_cat_id is not null then
      update public.stray_cats
      set sighting_count = sighting_count + 1
      where id = new.stray_cat_id;
    end if;

  elsif tg_op = 'DELETE' then
    -- A capture was removed — decrement and clean up if the stray is now orphaned.
    if old.stray_cat_id is not null then
      update public.stray_cats
      set sighting_count = greatest(0, sighting_count - 1)
      where id = old.stray_cat_id;

      delete from public.stray_cats
      where id = old.stray_cat_id
        and sighting_count = 0;
    end if;

  elsif tg_op = 'UPDATE' then
    -- stray_cat_id was changed on an existing capture (e.g. re-linked).
    if old.stray_cat_id is distinct from new.stray_cat_id then
      -- Decrement old stray and clean up if orphaned.
      if old.stray_cat_id is not null then
        update public.stray_cats
        set sighting_count = greatest(0, sighting_count - 1)
        where id = old.stray_cat_id;

        delete from public.stray_cats
        where id = old.stray_cat_id
          and sighting_count = 0;
      end if;

      -- Increment new stray.
      if new.stray_cat_id is not null then
        update public.stray_cats
        set sighting_count = sighting_count + 1
        where id = new.stray_cat_id;
      end if;
    end if;
  end if;

  return null;
end;
$$;

drop trigger if exists stray_sighting_count_sync on public.captures;
create trigger stray_sighting_count_sync
  after insert or update or delete on public.captures
  for each row execute function public.sync_stray_sighting_count();

-- Backfill: sync sighting_count from the real capture count, then delete orphans.
update public.stray_cats sc
set sighting_count = (
  select count(*)::int
  from public.captures c
  where c.stray_cat_id = sc.id
);

delete from public.stray_cats
where sighting_count = 0;
