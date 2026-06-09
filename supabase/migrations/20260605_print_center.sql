-- Instant Print Center — Prillaga & Co. Wedding POV
-- Run after schema.sql

-- Event category for filtering (also stored in wedding_events.settings JSON)
alter table wedding_events
  add column if not exists event_category text not null default 'wedding'
  check (event_category in ('wedding', 'birthday', 'graduation', 'corporate', 'other'));

-- AI highlight placeholders (future automation)
alter table wedding_uploads
  add column if not exists ai_score numeric,
  add column if not exists ai_highlight_type text
    check (ai_highlight_type is null or ai_highlight_type in (
      'best_smile', 'best_group', 'best_couple', 'most_popular'
    ));

create index if not exists wedding_uploads_created_at_idx on wedding_uploads(created_at desc);
create index if not exists wedding_events_category_idx on wedding_events(event_category);

-- Print queue: Website → Print Queue → Android Tablet → Xiaomi Printer
create table if not exists print_queue (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references wedding_uploads(id) on delete cascade,
  event_id text not null references wedding_events(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'printed', 'cancelled')),
  printed_by text,
  printed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists print_queue_status_idx on print_queue(status);
create index if not exists print_queue_event_id_idx on print_queue(event_id);
create index if not exists print_queue_created_at_idx on print_queue(created_at desc);

-- Admin favorites
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references wedding_uploads(id) on delete cascade,
  user_id text not null default 'admin',
  created_at timestamptz not null default now(),
  unique (photo_id, user_id)
);

create index if not exists favorites_user_id_idx on favorites(user_id);
