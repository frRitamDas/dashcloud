-- ============================================================================
-- Dash Cloud Gaming — Supabase schema reference
-- Dumped from the live project (All Projecta / occcaqfthwxdajgsmkhi) so the
-- repository always carries the full data model. The authoritative copy lives
-- in Supabase migrations; this file is documentation + a rebuild blueprint.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

create table if not exists public.games (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  title text not null,
  tagline text,
  description text,
  genre text default 'action'::text not null,
  tags text[] default '{}'::text[] not null,
  publisher text,
  release_year int4,
  cover_url text,
  banner_url text,
  screenshots text[] default '{}'::text[] not null,
  accent text default '#6d5cff'::text not null,
  rating numeric default 4.50 not null,
  players_online int4 default 0 not null,
  play_mode text default 'cloud'::text not null,          -- native | cloud
  engine_key text,                                        -- key into src/components/games/registry
  stream_url text,                                        -- licensed WebRTC/HLS endpoint for cloud titles
  cloud_tier text default 'standard'::text not null,      -- standard | premium | ultra
  requirements jsonb default '{}'::jsonb not null,
  status text default 'live'::text not null,              -- live | queue | maintenance | soon
  featured bool default false not null,
  published bool default true not null,
  sort_order int4 default 100 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.profiles (
  id uuid not null,                                       -- references auth.users(id)
  username text,
  display_name text,
  avatar_url text,
  country text default 'IN'::text,
  bio text,
  xp int4 default 0 not null,
  level int4 default 1 not null,
  coins int4 default 500 not null,
  total_play_seconds int4 default 0 not null,
  games_played int4 default 0 not null,
  is_pro bool default false not null,
  is_banned bool default false not null,
  last_seen_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.scores (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  guest_name text,
  game_id uuid not null,
  score int4 default 0 not null,
  metric text default 'points'::text not null,
  payload jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

create table if not exists public.game_sessions (
  id uuid default gen_random_uuid() not null,
  user_id uuid,
  guest_id text,
  game_id uuid not null,
  region text,
  status text default 'booting'::text not null,           -- booting | streaming | ended | failed
  resolution text default '1080p60'::text,
  latency_ms int4,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  duration_seconds int4 default 0 not null
);

create table if not exists public.favorites (
  user_id uuid not null,
  game_id uuid not null,
  created_at timestamptz default now() not null
);

create table if not exists public.service_status (
  id uuid default gen_random_uuid() not null,
  region text not null,                                   -- 'Global' marks a platform service row
  region_code text not null,
  service text not null,
  status text default 'operational'::text not null,       -- operational|degraded|partial|down|maintenance
  load_percent int4 default 0 not null,
  latency_ms int4 default 0 not null,
  gpu_pool text,
  message text,
  sort_order int4 default 100 not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.announcements (
  id uuid default gen_random_uuid() not null,
  title text not null,
  body text,
  kind text default 'info'::text not null,                -- info | success | warning | danger
  active bool default true not null,
  link text,
  created_at timestamptz default now() not null
);

create table if not exists public.settings (
  key text not null,                                      -- site | stats | streaming | maintenance | admin
  value jsonb default '{}'::jsonb not null,
  is_public bool default true not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.tickets (
  id uuid default gen_random_uuid() not null,
  name text not null,
  email text not null,
  subject text not null,
  body text not null,
  category text default 'technical'::text not null,       -- technical|account|billing|report|other
  priority text default 'normal'::text not null,         -- normal|high|urgent
  reference text,                                         -- DSH-XXXXXX, set by trigger
  reply text,
  status text default 'open'::text not null,              -- open|in_progress|resolved|closed
  resolved_at timestamptz,
  created_at timestamptz default now() not null
);

create table if not exists public.admins (
  id uuid default gen_random_uuid() not null,
  username text not null,
  email text,
  password_hash text not null,                            -- sha256(salt || ':' || password)
  salt text not null,
  role text default 'admin'::text not null,               -- owner | admin | operator
  active bool default true not null,
  failed_attempts int4 default 0 not null,
  locked_until timestamptz,
  last_login_at timestamptz,
  last_login_ip text,
  created_at timestamptz default now() not null
);

create table if not exists public.activity_log (
  id bigint generated by default as identity not null,
  actor text,
  action text not null,
  entity text,
  entity_id text,
  meta jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- ----------------------------------------------------------------------------
-- Constraints
-- ----------------------------------------------------------------------------

alter table only public.games add constraint games_pkey primary key (id);
alter table only public.games add constraint games_slug_key unique (slug);
alter table only public.profiles add constraint profiles_pkey primary key (id);
alter table only public.profiles add constraint profiles_username_key unique (username);
alter table only public.scores add constraint scores_pkey primary key (id);
alter table only public.scores add constraint scores_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
alter table only public.scores add constraint scores_game_id_fkey foreign key (game_id) references public.games (id) on delete cascade;
alter table only public.game_sessions add constraint game_sessions_pkey primary key (id);
alter table only public.game_sessions add constraint game_sessions_user_id_fkey foreign key (user_id) references public.profiles (id) on delete set null;
alter table only public.game_sessions add constraint game_sessions_game_id_fkey foreign key (game_id) references public.games (id) on delete cascade;
alter table only public.favorites add constraint favorites_pkey primary key (user_id, game_id);
alter table only public.favorites add constraint favorites_user_id_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
alter table only public.favorites add constraint favorites_game_id_fkey foreign key (game_id) references public.games (id) on delete cascade;
alter table only public.service_status add constraint service_status_pkey primary key (id);
alter table only public.announcements add constraint announcements_pkey primary key (id);
alter table only public.settings add constraint settings_pkey primary key (key);
alter table only public.tickets add constraint tickets_pkey primary key (id);
alter table only public.admins add constraint admins_pkey primary key (id);
alter table only public.admins add constraint admins_username_key unique (username);
alter table only public.activity_log add constraint activity_log_pkey primary key (id);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------

create index if not exists games_genre_idx on public.games (genre);
create index if not exists games_status_idx on public.games (status);
create index if not exists scores_game_score_idx on public.scores (game_id, score desc);
create index if not exists sessions_game_idx on public.game_sessions (game_id);
create index if not exists sessions_user_idx on public.game_sessions (user_id);
create index if not exists sessions_started_idx on public.game_sessions (started_at desc);
create index if not exists tickets_status_idx on public.tickets (status, created_at desc);
create index if not exists tickets_category_idx on public.tickets (category);
create index if not exists activity_created_idx on public.activity_log (created_at desc);

-- ----------------------------------------------------------------------------
-- Functions & triggers
-- ----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.tickets_set_reference()
returns trigger language plpgsql as $$
begin
  if new.reference is null then
    new.reference := 'DSH-' || upper(substr(md5(new.id::text), 1, 6));
  end if;
  return new;
end;
$$;

-- Auto-provision a profile row for every auth user. Username is derived from
-- the email local-part and sanitised to [a-z0-9_].
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, country)
  values (
    new.id,
    lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_]', '', 'g')),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    'IN'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger games_touch before update on public.games for each row execute function touch_updated_at();
create trigger profiles_touch before update on public.profiles for each row execute function touch_updated_at();
create trigger settings_touch before update on public.settings for each row execute function touch_updated_at();
create trigger tickets_reference_trg before insert on public.tickets for each row execute function tickets_set_reference();
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- Row level security
-- ----------------------------------------------------------------------------

alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.scores enable row level security;
alter table public.game_sessions enable row level security;
alter table public.favorites enable row level security;
alter table public.service_status enable row level security;
alter table public.announcements enable row level security;
alter table public.settings enable row level security;
alter table public.tickets enable row level security;
alter table public.admins enable row level security;
alter table public.activity_log enable row level security;

create policy "public read games" on public.games for select to public using (published = true);
create policy "public read profiles" on public.profiles for select to public using (true);
create policy "own insert profile" on public.profiles for insert to public with check (auth.uid() = id);
create policy "own update profile" on public.profiles for update to public using (auth.uid() = id) with check (auth.uid() = id);
create policy "public read scores" on public.scores for select to public using (true);
create policy "own insert score" on public.scores for insert to public
  with check (auth.uid() = user_id or (auth.uid() is null and guest_name is not null));
create policy "own read sessions" on public.game_sessions for select to public using (auth.uid() = user_id);
create policy "own insert session" on public.game_sessions for insert to public with check (auth.uid() = user_id);
create policy "own update session" on public.game_sessions for update to public using (auth.uid() = user_id);
create policy "own read favorites" on public.favorites for select to public using (auth.uid() = user_id);
create policy "own write favorites" on public.favorites for insert to public with check (auth.uid() = user_id);
create policy "own delete favorites" on public.favorites for delete to public using (auth.uid() = user_id);
create policy "public read status" on public.service_status for select to public using (true);
create policy "public read announcements" on public.announcements for select to public using (active = true);
create policy "public read settings" on public.settings for select to public using (is_public = true);
create policy "public insert ticket" on public.tickets for insert to public with check (true);
-- admins + activity_log have NO public policies: only the service role (server)
-- can read or write them, which is what every /api/admin/* route uses.

-- ----------------------------------------------------------------------------
-- Realtime (browser clients subscribe with the anon key)
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.service_status;
alter publication supabase_realtime add table public.announcements;
alter publication supabase_realtime add table public.scores;
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.game_sessions;
alter publication supabase_realtime add table public.profiles;
