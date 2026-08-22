-- ============================================================
-- StreetVision AI — Fix recursive RLS policy on reports
-- ============================================================
-- Root cause: the "reports_update_own" policy (001_schema.sql)
-- had a WITH CHECK clause that queried public.reports while
-- evaluating a policy on public.reports, causing infinite
-- recursion.
--
-- Fix:
-- 1. Drop the recursive policy.
-- 2. Replace it with a non-recursive version (auth.uid() = user_id).
-- 3. Add a SECURITY DEFINER trigger to prevent citizens from
--    changing status, priority_score, assigned_to, or category.
--
-- This migration is idempotent and safe to run multiple times.

-- ============================================================
-- 1. Drop the recursive policy
-- ============================================================
drop policy if exists "reports_update_own" on public.reports;

-- ============================================================
-- 2. Recreate non-recursive citizen update policy
-- ============================================================
-- Citizens can update their own reports' mutable fields
-- (description, address, image_url, latitude/longitude, etc.)
-- Restricted-field changes are enforced by the trigger below.
create policy "reports_update_own"
  on public.reports
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 3. Trigger function: prevent citizens from changing
--    restricted report fields (status, priority_score,
--    assigned_to, category).
--    SECURITY DEFINER bypasses RLS on the profiles table
--    so the role check does not recurse.
-- ============================================================
create or replace function public.prevent_citizen_report_field_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Admins bypass all restrictions
  if exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) then
    return new;
  end if;

  -- Citizens: block restricted field changes
  if old.status is distinct from new.status then
    raise exception 'Citizens cannot change report status';
  end if;

  if old.priority_score is distinct from new.priority_score then
    raise exception 'Citizens cannot change report priority score';
  end if;

  if old.assigned_to is distinct from new.assigned_to then
    raise exception 'Citizens cannot change report assignment';
  end if;

  if old.category is distinct from new.category then
    raise exception 'Citizens cannot change report category';
  end if;

  return new;
end;
$$;

-- ============================================================
-- 4. Attach trigger (idempotent: drop then create)
-- ============================================================
drop trigger if exists prevent_citizen_report_field_changes_trigger on public.reports;

create trigger prevent_citizen_report_field_changes_trigger
  before update on public.reports
  for each row execute function public.prevent_citizen_report_field_changes();
