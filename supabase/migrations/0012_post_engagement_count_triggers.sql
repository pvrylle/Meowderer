-- Keep post likes_count / comments_count in sync via triggers (bypasses RLS on posts updates).

create or replace function public.sync_post_likes_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set likes_count = likes_count + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts
    set likes_count = greatest(0, likes_count - 1)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_likes_count_sync on public.post_likes;
create trigger post_likes_count_sync
  after insert or delete on public.post_likes
  for each row execute function public.sync_post_likes_count();

create or replace function public.sync_post_comments_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set comments_count = comments_count + 1
    where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts
    set comments_count = greatest(0, comments_count - 1)
    where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists post_comments_count_sync on public.post_comments;
create trigger post_comments_count_sync
  after insert or delete on public.post_comments
  for each row execute function public.sync_post_comments_count();

-- Backfill counters from junction tables.
update public.posts p
set likes_count = coalesce(
  (select count(*)::int from public.post_likes pl where pl.post_id = p.id),
  0
);

update public.posts p
set comments_count = coalesce(
  (select count(*)::int from public.post_comments pc where pc.post_id = p.id),
  0
);
