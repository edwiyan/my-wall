-- Wall: run this once in Supabase → SQL Editor → New query → Run.
-- Safe to run again: every step checks whether it already exists.
--
-- Creates the posts table, lets anyone read and add posts (no login, as the brief asks),
-- turns on Realtime, makes a public bucket for post photos, and a profile row + bucket
-- for the wall owner's profile picture (only the server can change those).

-- 1. Posts table: id, author name, message, timestamp (+ optional photo URL)
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Guest'
              check (char_length(btrim(name)) between 1 and 40),
  body        text not null
              check (char_length(btrim(body)) between 1 and 280),
  image_url   text
              check (image_url is null or char_length(image_url) <= 500),
  created_at  timestamptz not null default now()
);

-- Keep the name rule current if the table came from an earlier version of this script.
alter table public.posts alter column name set default 'Guest';
alter table public.posts drop constraint if exists posts_name_check;
alter table public.posts add constraint posts_name_check
  check (char_length(btrim(name)) between 1 and 40);

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

-- 3. Profile: a single row holding the wall owner's profile picture.
--    Visitors can read it. There are no insert/update policies, so only the server
--    (using the secret key, after checking OWNER_PASSCODE) can change it.
create table if not exists public.profile (
  id          int primary key default 1 check (id = 1),
  photo_url   text check (photo_url is null or char_length(photo_url) <= 500),
  updated_at  timestamptz not null default now()
);

insert into public.profile (id) values (1) on conflict (id) do nothing;

alter table public.profile enable row level security;

drop policy if exists "Anyone can read the profile" on public.profile;
create policy "Anyone can read the profile"
  on public.profile for select
  to anon, authenticated
  using (true);

-- Table permissions, spelled out so the script works even when "Automatically expose
-- new tables" was turned off when the project was created. Row Level Security above
-- still decides which rows each action can touch.
grant usage on schema public to anon, authenticated, service_role;
revoke all on public.posts, public.profile from anon, authenticated;
grant select, insert on public.posts to anon, authenticated;
grant select on public.profile to anon, authenticated;
grant all on public.posts, public.profile to service_role;

-- 4. Realtime: broadcast new posts and profile picture changes to every open browser.
do $$
declare t text;
begin
  foreach t in array array['posts', 'profile'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- 5. Post photos (bonus): public bucket, images only, 5 MB max. Visitors may upload.
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

-- 6. Profile pictures: public bucket, 1 MB max. No visitor policies, so only the
--    server can upload here.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No select policies on storage are needed: both buckets are public, so photo URLs
-- work without one, and leaving them out stops visitors from listing every file.
