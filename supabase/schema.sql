-- Wedding POV Supabase schema
-- Run in Supabase SQL editor, then create a public storage bucket: wedding-uploads

create extension if not exists "pgcrypto";

create table if not exists wedding_events (
  id text primary key,
  couple_name text not null,
  wedding_date date not null,
  venue text not null,
  hashtag text,
  welcome_message text,
  status text not null default 'active',
  settings jsonb not null default '{}'::jsonb,
  photo_limits jsonb not null default '{}'::jsonb,
  video_limits jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  slideshow jsonb not null default '{}'::jsonb,
  moderation jsonb not null default '{}'::jsonb,
  photo_management jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists wedding_guests (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references wedding_events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  joined_at timestamptz not null default now(),
  unique (event_id, first_name, last_name)
);

create table if not exists wedding_uploads (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references wedding_events(id) on delete cascade,
  guest_id uuid not null references wedding_guests(id) on delete cascade,
  guest_name text not null,
  storage_path text not null,
  caption text,
  segment text not null default 'other',
  filter text not null default 'none',
  is_video boolean not null default false,
  status text not null default 'pending',
  is_extra boolean not null default false,
  slot_locked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wedding_uploads_event_id_idx on wedding_uploads(event_id);
create index if not exists wedding_guests_event_id_idx on wedding_guests(event_id);

-- Storage bucket policy (adjust for production RLS):
-- 1. Create bucket `wedding-uploads` (public read or signed URLs)
-- 2. Service role uploads from API routes; guests upload via signed URLs
