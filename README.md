# Wall

A 2008-style profile "wall" rebuilt with today's stack. Type a message (up to 280 characters), press **Share**, and it's saved in Supabase and appears at the top of the feed. Posts survive a refresh, and new ones appear live in every open browser without reloading.

**Stack:** Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · Supabase (Postgres, Realtime, Storage) · Vercel

## Features

**The brief**
- Write a message (max 280 characters) and press **Share**
- Messages are saved in Supabase; the feed shows them newest first and they stay after a refresh
- Live feed over Supabase Realtime: posts from other visitors appear without reloading
- Photo upload to Supabase Storage

**Extras**
- **Profile picture you can change from the page**: "Change picture" → choose a photo → enter your owner passcode. It's cropped to a square, resized to 400×400 in the browser, and saved by a Server Action that checks the passcode on the server. Every open browser sees the new picture instantly.
- **"People here now"** counter using Realtime Presence
- **Visitor names**: "Posting as" field (remembered on that device), with a coloured initials avatar; empty means "Guest"
- **Wall / Info / Photos tabs**: Info shows the owner's details and skills; Photos is a grid of every shared photo
- **Photo lightbox** with arrow-key navigation; photos can be added by picker, drag-and-drop or paste
- Photos are resized in the browser (max 1600 px) before upload, so posting is quick on mobile data
- Circular character counter, Ctrl+Enter to share, loading skeletons, "Older posts" paging
- New posts slide in with the classic yellow-fade highlight
- Works on phones; respects reduced-motion settings

## How it works

| File | What it does |
|---|---|
| `src/lib/useWall.ts` | Loads posts, photos and the profile; one Realtime channel for new posts, profile changes and presence; paging; sharing |
| `src/app/actions.ts` | Server Action that checks `OWNER_PASSCODE` and saves the profile picture with the secret key |
| `src/components/` | `WallApp` (layout and tabs), `Composer`, `PostItem`, `Sidebar`, `ProfilePhotoDialog`, `Lightbox`, `Avatar` |
| `src/lib/wall.ts` | Validation, feed merging (your own post isn't duplicated when its Realtime copy arrives), avatars, time labels; tested in `wall.test.ts` |
| `src/lib/image.ts` | Browser-side crop and resize |
| `supabase/setup.sql` | Tables, Row Level Security, Realtime and storage buckets |

### Security

- **Posts:** visitors can read and add posts but can't edit or delete them (Row Level Security). The database also enforces lengths: message 1–280 characters, name 1–40.
- **Profile picture:** visitors can only read it. There are no write policies on the `profile` table or the `avatars` bucket, so only the server (secret key) can change them, and it does so only after the passcode check. The secret key and passcode live in server-only environment variables and never reach the browser.
- **Buckets:** both are public for reading photos, with file-type and size limits; visitors can't list their contents.

### Database

`posts`: `id` uuid · `name` text · `body` text · `image_url` text (optional) · `created_at` timestamptz
`profile`: a single row (`id = 1`) with `photo_url` and `updated_at`

## Setup

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste all of `supabase/setup.sql`, and click **Run**. It's safe to run again later.
3. Open **Project Settings → API Keys** and copy:
   - the **Project URL**
   - the **Publishable** key (`sb_publishable_…`; older projects call it **anon public**)
   - the **Secret** key (`sb_secret_…`; older projects call it **service_role**). This one is only for the server: never put it in a `NEXT_PUBLIC_` variable.

### 2. Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the four values
npm run dev                   # http://localhost:3000
```

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key |
| `SUPABASE_SECRET_KEY` | Secret / service_role key (server only) |
| `OWNER_PASSCODE` | A passcode you choose, 6+ characters |

The last two are only needed to change the profile picture; the wall works without them.

### 3. Deploy to Vercel

1. Push this repo to GitHub (public).
2. On [vercel.com](https://vercel.com): **Add New → Project**, import the repo.
3. Under **Environment Variables**, add the four variables above.
4. Click **Deploy**. Use the production URL (`https://<project>.vercel.app`), not a preview URL.
5. Open the site, click **Change picture**, and upload your photo with your passcode.

### Optional: run Supabase on your own machine

With Docker running: `npx supabase start`, then run `supabase/setup.sql` against the local database, and use the local URL and keys that `npx supabase status` prints.

## Scripts

```bash
npm run dev     # development server
npm run build   # production build
npm test        # unit tests (Vitest)
npm run lint    # ESLint
```

## Personalising

The name, headline, about text, skills, education and links are in `src/lib/profile.ts`.
