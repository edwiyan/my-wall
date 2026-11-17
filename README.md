# Wall

A 2008-style "wall": type a message (up to 280 characters), press **Share**, and it's saved in Supabase and shows at the top of the feed. It stays there after a refresh, and new posts appear live in every open browser without reloading.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Supabase (Postgres, Realtime, Storage) · Vercel

## Features

- Post a message of up to 280 characters, with a live character counter
- Feed shows every post, newest first, and survives a page refresh
- Live feed through Supabase Realtime: posts from other visitors appear without reloading
- Optional photo on a post, stored in Supabase Storage (images only, 5 MB max)
- No login; every post uses the wall owner's fixed name
- Ctrl+Enter shares; empty or too-long messages can't be sent
- Works on phones (the sidebar stacks above the wall)

## How it works

- `src/components/Wall.tsx` loads the newest 50 posts, subscribes to `INSERT` events on `posts`, and handles sharing (photo upload, then insert).
- `src/components/Composer.tsx` is the message box, counter, photo picker and Share button.
- `src/lib/wall.ts` holds the validation, feed merging (no duplicates when your own post also arrives over Realtime) and "5 minutes ago" formatting, with unit tests in `wall.test.ts`.
- `supabase/setup.sql` creates the table, the Row Level Security policies, Realtime and the photo bucket.

The database is protected by Row Level Security: visitors can **read** and **add** posts, but can't edit or delete them. The table also checks lengths (message 1–280 characters), so the limit holds even if someone skips the UI.

### Database table

| column | type | notes |
|---|---|---|
| `id` | uuid | primary key, generated |
| `name` | text | author name |
| `body` | text | the message, 1–280 characters |
| `image_url` | text | public photo URL, optional |
| `created_at` | timestamptz | defaults to `now()` |

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/setup.sql`, and click **Run**. This creates the `posts` table, turns on Realtime for it, and makes the `post-images` bucket.
3. Open **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the **anon public** key (newer projects call it the **Publishable** key, `sb_publishable_...`; either works).

### 2. Run locally

```bash
npm install
cp .env.example .env.local   # then paste your URL and anon key into .env.local
npm run dev                   # http://localhost:3000
```

### 3. Deploy to Vercel

1. Push this repo to GitHub (public).
2. On [vercel.com](https://vercel.com): **Add New → Project**, import the repo.
3. Under **Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Click **Deploy**. Use the production URL (`https://<project>.vercel.app`), not a preview URL.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm test        # unit tests (Vitest)
npm run lint    # ESLint
```

## Personalising

Change the name and sidebar details in `src/lib/profile.ts`. To use your own photo, put it in `public/` (for example `public/profile.jpg`) and set `photo: "/profile.jpg"`.
