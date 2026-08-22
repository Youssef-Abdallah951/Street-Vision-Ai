-- ============================================================
-- StreetVision AI — Fix recursive and broken RLS policies on reports
-- ============================================================
-- Root cause: the "reports_update_own" policy (001_schema.sql)
-- had a WITH CHECK clause that queried public.reports while
-- evaluating a policy on public.reports, causing infinite
-- recursion and 500 Internal Server Error.
--
-- A prior fix (migration 005) removed the recursion but
-- replaced it with WITH CHECK (auth.uid() = user_id), which
-- incorrectly blocks admins from updating reports they do not
-- own, also causing 500 errors.
--
-- This migration:
-- 1. Drops the recursive/broken citizen update policy.
-- 2. Drops the overly permissive public read policy.
-- 3. Recreates reports_update_own without self-referential
--    subqueries and without a WITH CHECK clause that would
--    block admins.
-- 4. Adds a SECURITY DEFINER trigger to prevent citizens
--    from changing restricted report fields.
--
-- It is idempotent and safe to run multiple times.

-- 1. Drop the recursive/broken citizen update policy
drop policy if exists "reports_update_own" on public.reports;

-- 2. Drop the overly permissive public read policy
drop policy if exists "reports_read_public" on public.reports;

-- 3. Recreate citizen update policy without recursion
-- Citizens can update their own reports' mutable fields.
-- Restricted-field changes are enforced by the trigger below.
create policy "reports_update_own"
  on public.reports
  for update
  to authenticated
  using (auth.uid() = user_id);

-- 4. Drop the old restriction trigger (from migration 005) if present
drop trigger if exists prevent_citizen_report_field_changes_trigger on public.reports;

-- 5. Recreate the restriction trigger function
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

  -- Citizens: ensure they only modify their own report
  if auth.uid() != old.user_id then
    raise exception 'Citizens can only update their own reports';
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

  if old.user_id is distinct from new.user_id then
    raise exception 'Citizens cannot transfer report ownership';
  end if;

  return new;
end;
$$;

-- 6. Attach the trigger
create trigger prevent_citizen_report_field_changes_trigger
  before update on public.reports
  for each row execute function public.prevent_citizen_report_field_changes();
