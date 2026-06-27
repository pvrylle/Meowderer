-- Post images, avatars storage + Realtime chat (Phase 5)

insert into storage.buckets (id, name, public)
values ('post-images', 'post-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- post-images: public read, owner-only write/delete
drop policy if exists "Anyone can read post images" on storage.objects;
create policy "Anyone can read post images"
  on storage.objects for select
  using (bucket_id = 'post-images');

drop policy if exists "Owner can write post images" on storage.objects;
create policy "Owner can write post images"
  on storage.objects for insert
  with check (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owner can delete post images" on storage.objects;
create policy "Owner can delete post images"
  on storage.objects for delete
  using (
    bucket_id = 'post-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars: public read, owner-only write/delete
drop policy if exists "Anyone can read avatars" on storage.objects;
create policy "Anyone can read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Owner can write avatars" on storage.objects;
create policy "Owner can write avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owner can update avatars" on storage.objects;
create policy "Owner can update avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Owner can delete avatars" on storage.objects;
create policy "Owner can delete avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable Realtime for live chat
alter publication supabase_realtime add table public.chat_messages;
