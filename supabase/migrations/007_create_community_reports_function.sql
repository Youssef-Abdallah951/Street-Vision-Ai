-- ============================================================
-- StreetVision AI — Ensure get_community_reports() exists
-- ============================================================
-- Root cause: the Street Map page calls
--   supabase.rpc('get_community_reports')
-- with zero parameters, but the function was missing from the
-- schema cache. Migration 004 originally defined it, but the
-- database did not have it at runtime.
--
-- This migration is idempotent and safe to run multiple times.
-- It re-creates the zero-parameter community-reports RPC that
-- returns only non-sensitive fields suitable for public map
-- visualization.
--
-- Security:
-- - SECURITY DEFINER so it is callable by anon/authenticated users
--   without requiring direct table access.
-- - Excludes private fields (user_id, email, description, etc.).
-- - Excludes rejected reports.
-- - Does not expose service_role in frontend code.
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
language sql
security definer
as $$
  select
    id,
    category,
    severity,
    priority_score,
    confidence,
    latitude,
    longitude,
    address,
    image_url,
    status,
    ai_classified,
    created_at,
    updated_at
  from public.reports
  where status != 'rejected'
  order by created_at desc;
$$;
