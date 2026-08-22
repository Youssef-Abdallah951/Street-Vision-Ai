-- ============================================================
-- StreetVision AI — Fix Storage RLS path index for street-reports
-- ============================================================
-- The upload path is: reports/{user_id}/{filename}
-- storage.foldername(name) returns: {reports, user_id, filename}
-- This migration drops existing policies and recreates them with the
-- correct path segments so citizen SELECT/INSERT/UPDATE/DELETE work.
-- It is idempotent and safe to run multiple times.

-- Drop existing policies idempotently
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
