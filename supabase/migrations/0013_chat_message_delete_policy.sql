-- Allow users to delete their own channel messages.

drop policy if exists "Users delete own chat messages" on public.chat_messages;
create policy "Users delete own chat messages"
  on public.chat_messages for delete
  using (auth.uid() = user_id);
