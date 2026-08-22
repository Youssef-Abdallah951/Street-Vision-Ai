-- ============================================================
-- StreetVision AI — Fix RLS policies and add community RPC
-- ============================================================
-- This migration:
-- 1. Removes the overly permissive public read on reports
-- 2. Adds proper own-read and admin-read policies
-- 3. Adds an RPC for community/public report browsing
-- It is idempotent and safe to run multiple times.

-- Drop existing permissive policy
drop policy if exists "reports_read_public" on public.reports;

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

-- ============================================================
-- RPC: get_community_reports
-- Returns non-sensitive report fields for the public community map.
-- Security definer so it bypasses RLS and is callable by anon users.
-- ============================================================
create or replace function public.get_community_reports()
returns table (
  id uuid,
  category text,
  severity text,
  priority_score integer,
  confidence integer,
  latitude double precision,
  longitude double precision,
  address text,
  image_url text,
  status text,
  ai_classified boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language sql security definer
as $$
  select
    id, category, severity, priority_score, confidence,
    latitude, longitude, address, image_url, status,
    ai_classified, created_at, updated_at
  from public.reports
  where status != 'rejected'
  order by created_at desc;
$$;

-- ============================================================
-- Ensure storage policies use the correct path segments
-- (reports/{user_id}/{filename})
-- ============================================================
drop policy if exists "storage_read_own"    on storage.objects;
drop policy if exists "storage_insert_own"  on storage.objects;
drop policy if exists "storage_update_own"  on storage.objects;
drop policy if exists "storage_delete_own"  on storage.objects;
drop policy if exists "storage_admin_all"   on storage.objects;

-- Citizens can read only their own objects
create policy "storage_read_own"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'street-reports'
    and (storage.foldername(name))[1] = 'reports'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Citizens can upload only to their own user folder
create policy "storage_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'street-reports'
    and (storage.foldername(name))[1] = 'reports'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Citizens can update only their own objects
create policy "storage_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'street-reports'
    and (storage.foldername(name))[1] = 'reports'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Citizens can delete only their own objects
create policy "storage_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'street-reports'
    and (storage.foldername(name))[1] = 'reports'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Admins have full access to the bucket
create policy "storage_admin_all"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'street-reports'
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
