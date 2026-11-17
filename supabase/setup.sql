-- Wall: run this once in Supabase → SQL Editor → New query → Run.
-- Creates the posts table, lets anyone read and add posts (no login, as the brief asks),
-- turns on Realtime for it, and makes a public bucket for photos.

-- 1. Posts table: id, author name, message, timestamp (+ optional photo URL)
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Edrian Reyes'
              check (char_length(name) between 1 and 60),
  body        text not null
              check (char_length(btrim(body)) between 1 and 280),
  image_url   text
              check (image_url is null or char_length(image_url) <= 500),
  created_at  timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 2. Row Level Security: visitors can read and insert, but never edit or delete.
alter table public.posts enable row level security;

drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts"
  on public.posts for select
  to anon, authenticated
  using (true);

drop policy if exists "Anyone can add a post" on public.posts;
create policy "Anyone can add a post"
  on public.posts for insert
  to anon, authenticated
  with check (true);

-- 3. Realtime: broadcast new rows so the feed updates without a refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'posts'
  ) then
    alter publication supabase_realtime add table public.posts;
  end if;
end $$;

-- 4. Photo uploads (bonus): public bucket, images only, 5 MB max.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880,
        array['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can upload a post photo" on storage.objects;
create policy "Anyone can upload a post photo"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'post-images');

-- No select policy is needed: the bucket is public, so photo URLs work without one,
-- and leaving it out stops visitors from listing every file in the bucket.
