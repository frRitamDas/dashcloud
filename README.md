# Dash — free cloud gaming in your browser

**Play anything. Anywhere. Instantly.** Dash is a full-stack cloud-gaming web platform: a premium, low-effect UI over a
Next.js 15 App Router app, Supabase Postgres + Auth + Realtime for data, and a password-gated operator control plane that
can change the live status of every region while players watch it update in real time.

Made by **Ritam Das from India**.

---

## What is in the box

| Area | What you get |
| --- | --- |
| **Home** | Hero with a parallax stream-preview panel, live marquee, featured auto-advancing rail, genre/trending/leaderboard collections, stats band, tech & regions sections, pricing teaser, realtime announcement ticker |
| **Library** `/games` | 32-title catalogue with client-side search, genre/mode/status filters and sorting synced to the URL |
| **Game pages** `/games/[slug]` | Artwork, overview, requirements, live leaderboard preview, launch CTA, share/favourite actions |
| **Play** `/play/[slug]` | Region picker → queue → GPU provisioning → handshake boot sequence, then a real playable game: 7 original browser engines (voxel sandbox, city driver, snake, breakout, space shooter, 2048, sky hop) built on canvas/WebGL/three.js, with HUD, pause, quality, mute, fullscreen and telemetry |
| **Cloud titles** | AAA catalogue rows (GTA V, Minecraft, …) carry a licensed `stream_url`; without one the launcher honestly shows *stream unavailable* instead of faking playback |
| **Leaderboards** `/leaderboard` | Per-game boards + global hall of fame, updated live over Supabase realtime |
| **Status** `/status` | 90-day uptime strip, per-region GPU load/latency and platform services — pushed instantly when an operator edits them |
| **Accounts** `/login` `/signup` `/profile` | Supabase auth with auto-created profiles, XP/level/coins economy, favourites, run history, editable profile |
| **Support** `/support` | Rate-limited ticket form (Postgres-backed), live incident banner, FAQ |
| **Marketing/legal** | `/pricing`, `/about`, `/privacy`, `/terms` — all server-rendered from settings |
| **Control plane** `/admin` | Signed-in operator console: overview KPIs + sparkline, **live region/status editor**, games CRUD, players (ban/Plus/coins/XP), sessions, score moderation, tickets, audit log, settings/announcements/maintenance mode, password rotation |
| **Ops** | `robots.ts`, `sitemap.ts`, `not-found`, `error`, `loading`, CSP + hardening headers, rate limiting, audit logging |

## Stack

- **Framework** — Next.js 15 (App Router, React 19, TypeScript), Tailwind CSS, framer-motion 14, three.js
- **Data** — Supabase Postgres (RLS on every table), Supabase Auth, Supabase Realtime (Postgres change feed)
- **Hosting** — Vercel
- **Art** — 100% procedural: SVG/canvas shaders per game, SDF-rendered `public/logo.png` (see `scripts/gen-logo.py`)

## Security model

- Strict **Content-Security-Policy**, `nosniff`, `SAMEORIGIN` framing, referrer policy, HSTS in production.
- Admin credentials are **salted SHA-256 hashes** in `admins`; 5 failures lock the account for 15 minutes; sessions are
  signed, `httpOnly`, `SameSite=Lax` cookies with an 8-hour TTL; every privileged write lands in `activity_log`.
- Public writes (scores, tickets, sessions) are zod-validated and rate-limited per IP; authenticated writes go through
  Supabase **row-level security** with the user's own session — never the service role.
- The service-role key only exists server-side (`SUPABASE_SERVICE_ROLE_KEY`) inside `withAdmin(...)` handlers.

## Local development

```bash
npm install
cp .env.example .env.local      # fill in the four values below
npm run dev                     # http://localhost:3000
```

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public JWT (or publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only, bypasses RLS for admin routes |
| `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` — signs admin cookies |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used for metadata/sitemap |

The database structure lives in [`supabase/schema.sql`](supabase/schema.sql); the connected Supabase project already
contains the seeded catalogue, regions, settings and admin account.

### Operator sign-in

The seeded operator is `admin` with the password from your deployment notes — **change it immediately** from
*Console → Settings → Operator security*. The password is stored only as a salted hash; it can be rotated, never read.

### Your logo

Drop any square PNG at `public/logo.png` (512×512 or 1024×1024) and it is used everywhere: navbar mark fallback,
favicon, Open Graph and apple-touch icons. The committed file is generated procedurally by `python3 scripts/gen-logo.py`,
so the repo builds even before you add artwork.

## Deploying to Vercel

1. Push the branch, then create a Vercel project pointing at the repo (framework preset: **Next.js**).
2. Add the five environment variables above (production + preview).
3. Deploy. Set `NEXT_PUBLIC_SITE_URL` to the assigned `*.vercel.app` URL (or your domain) and redeploy so metadata and
   the sitemap use the real origin.
4. In Supabase → Authentication → URL configuration, set the site URL and redirect allow-list to the same origin.

## Project layout

```
src/
  app/            routes: (site) public pages, (admin) console, api/ handlers
  components/
    admin/        control-plane panels + typed api client
    art/          procedural GameArt / GameBanner
    auth/ games/ home/ layout/ leaderboard/ legal/ play/ profile/ status/ support/ ui/
  hooks/          useUser, useGameCanvas
  lib/
    supabase/     typed clients (browser, server, anon, admin)
    admin-*.ts    session signing, zod schemas
    api.ts        json/fail/withAdmin/logActivity helpers
    queries.ts    public read model
    rate-limit.ts password.ts utils.ts sfx.ts
  middleware.ts   session refresh + /admin gate
supabase/schema.sql
scripts/gen-logo.py
```

## Notes on third-party titles

Published games (GTA V, Minecraft, …) are catalogue entries. Dash streams them only when a **licensed** stream endpoint
is configured in `games.stream_url`; otherwise the launcher says so plainly. Original Dash Studios engines are fully
playable in-browser today with no install.

---

© 2026 Dash Cloud Gaming · **Made by Ritam Das from India**
