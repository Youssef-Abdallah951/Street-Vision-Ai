-- ============================================================
-- StreetVision AI — Complete Database Schema
-- Run this in your Supabase SQL Editor (or use supabase CLI)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  email        text not null,
  avatar_url   text,
  role         text not null default 'citizen' check (role in ('citizen', 'admin')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public user profile data. Role is assigned by trigger, not user input.';

-- ============================================================
-- REPORTS
-- ============================================================
create table if not exists public.reports (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text,
  description    text,
  category       text not null check (category in (
    'pothole','road-crack','garbage','street-light','sidewalk',
    'flooding','fallen-tree','traffic-sign','road-obstacle','other'
  )),
  severity       text not null check (severity in ('critical','high','medium','low')),
  priority_score integer not null default 0 check (priority_score >= 0 and priority_score <= 100),
  confidence     integer check (confidence >= 0 and confidence <= 100),
  latitude       double precision,
  longitude      double precision,
  address        text,
  image_url      text,
  status         text not null default 'reported' check (status in (
    'reported','ai_verified','under_review','assigned','in_progress','resolved','rejected'
  )),
  ai_classified  boolean not null default false,
  assigned_to    uuid references public.profiles(id) on delete set null,
  resolved_image_url text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  resolved_at    timestamptz
);

comment on table public.reports is 'Street problem reports submitted by citizens.';
comment on column public.reports.ai_classified is 'True if AI classified; false if manually classified by citizen.';

create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_status_idx on public.reports(status);
create index if not exists reports_category_idx on public.reports(category);
create index if not exists reports_created_at_idx on public.reports(created_at desc);

-- ============================================================
-- DETECTIONS
-- ============================================================
create table if not exists public.detections (
  id             uuid primary key default uuid_generate_v4(),
  report_id      uuid not null references public.reports(id) on delete cascade,
  category       text not null,
  confidence     integer check (confidence >= 0 and confidence <= 100),
  severity       text check (severity in ('critical','high','medium','low')),
  bounding_box   jsonb,
  estimated_size text,
  created_at     timestamptz not null default now()
);

create index if not exists detections_report_id_idx on public.detections(report_id);

-- ============================================================
-- CONFIRMATIONS
-- ============================================================
create table if not exists public.confirmations (
  id          uuid primary key default uuid_generate_v4(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint  confirmations_unique unique (report_id, user_id)
);

create index if not exists confirmations_report_id_idx on public.confirmations(report_id);
create index if not exists confirmations_user_id_idx on public.confirmations(user_id);

-- ============================================================
-- STATUS HISTORY
-- ============================================================
create table if not exists public.status_history (
  id          uuid primary key default uuid_generate_v4(),
  report_id   uuid not null references public.reports(id) on delete cascade,
  status      text not null,
  changed_by  uuid references public.profiles(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now()
);

create index if not exists status_history_report_id_idx on public.status_history(report_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
create table if not exists public.notifications (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  report_id   uuid references public.reports(id) on delete set null,
  title       text not null,
  message     text not null,
  type        text not null check (type in (
    'report_submitted','ai_verified','status_change','resolved','confirmed','system'
  )),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications(user_id);
create index if not exists notifications_is_read_idx on public.notifications(is_read);

-- ============================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================

-- Auto-update updated_at on profiles
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create or replace trigger reports_updated_at
  before update on public.reports
  for each row execute function public.handle_updated_at();

-- Create profile on new user registration
-- IMPORTANT: role is assigned by trusted backend logic, not user input.
-- Normal registrations default to citizen.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  user_role text;
begin
  user_role := 'citizen';

  insert into public.profiles (id, email, full_name, role, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    user_role,
    now(),
    now()
  )
  on conflict (id) do update
    set
      email = excluded.email,
      full_name = coalesce(excluded.full_name, profiles.full_name),
      updated_at = now();

  return new;
end;
$$;

-- Fire trigger when a new auth user is created
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- HELPER FUNCTION: recalculate priority score
-- Called by application code after confirmations change
-- ============================================================
create or replace function public.recalculate_priority(p_report_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_severity    text;
  v_confidence  integer;
  v_confs       integer;
  v_age_days    float;
  v_score       float := 0;
  v_final       integer;
begin
  select severity, coalesce(confidence, 50), extract(epoch from (now() - created_at)) / 86400
  into v_severity, v_confidence, v_age_days
  from public.reports where id = p_report_id;

  select count(*) into v_confs from public.confirmations where report_id = p_report_id;

  -- Severity weight (0-40)
  v_score := v_score + case v_severity
    when 'critical' then 40
    when 'high'     then 30
    when 'medium'   then 20
    when 'low'      then 10
    else 15
  end;

  -- Confidence weight (0-25)
  v_score := v_score + (v_confidence::float / 100.0) * 25;

  -- Community confirmations (0-20, capped)
  v_score := v_score + least(v_confs * 2.5, 20);

  -- Age factor: older unresolved issues get +5 boost up to 15 days
  v_score := v_score + least(v_age_days * 0.33, 5);

  v_final := least(100, greatest(0, round(v_score)));

  update public.reports set priority_score = v_final, updated_at = now()
  where id = p_report_id;

  return v_final;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.detections enable row level security;
alter table public.confirmations enable row level security;
alter table public.status_history enable row level security;
alter table public.notifications enable row level security;

-- ---------- PROFILES ----------
-- Anyone authenticated can read any profile (needed to show reporter names)
create policy "profiles_read_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can read their own profile (also covers unauthenticated sessions)
create policy "profiles_read_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but NOT role)
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Prevent self-promotion: the role column can only be changed by admins
    and role = (select role from public.profiles where id = auth.uid())
  );

-- Admins can update any profile (needed for role management if required later)
create policy "profiles_admin_update"
  on public.profiles for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---------- REPORTS ----------
-- Authenticated users can read their own reports
create policy "reports_read_own"
  on public.reports for select
  to authenticated
  using (auth.uid() = user_id);

-- Admins can read any report
create policy "reports_read_admin"
  on public.reports for select
  to authenticated
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Authenticated users can insert their own reports
create policy "reports_insert_own"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Admins can update any report
create policy "reports_update_admin"
  on public.reports for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Citizens can only update their own reports (e.g., add description)
create policy "reports_update_own"
  on public.reports for update
  using (
    auth.uid() = user_id
    and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  )
  with check (
    -- Citizens cannot change status, assigned_to, or priority_score
    status = (select status from public.reports where id = reports.id)
    and priority_score = (select priority_score from public.reports where id = reports.id)
  );

-- ---------- DETECTIONS ----------
create policy "detections_read_all"
  on public.detections for select using (true);

create policy "detections_insert_own"
  on public.detections for insert
  to authenticated
  with check (
    exists (select 1 from public.reports where id = report_id and user_id = auth.uid())
  );

-- ---------- CONFIRMATIONS ----------
create policy "confirmations_read_all"
  on public.confirmations for select using (true);

create policy "confirmations_insert_own"
  on public.confirmations for insert
  to authenticated
  with check (
    auth.uid() = user_id
    -- Cannot confirm your own report
    and not exists (select 1 from public.reports where id = report_id and user_id = auth.uid())
  );

-- ---------- STATUS HISTORY ----------
create policy "status_history_read_all"
  on public.status_history for select using (true);

-- Admins can insert status history entries
create policy "status_history_insert_admin"
  on public.status_history for insert
  to authenticated
  with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- System inserts (via security definer functions) also allowed
create policy "status_history_insert_service"
  on public.status_history for insert
  with check (true);

-- ---------- NOTIFICATIONS ----------
create policy "notifications_read_own"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "notifications_update_own"
  on public.notifications for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service/trigger inserts (via security definer)
create policy "notifications_insert_service"
  on public.notifications for insert
  with check (true);

-- ============================================================
-- STORAGE BUCKET
-- Create the street-reports bucket as PRIVATE (run this once)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'street-reports',
  'street-reports',
  false,
  10485760,  -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Storage policies are defined in migration 003_fix_storage_rls_path_index.sql
