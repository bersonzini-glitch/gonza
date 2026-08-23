-- Surgeon profile photo storage.
--
-- The bucket is PRIVATE. Photos are only ever served to the public through
-- a server route (src/app/api/surgeon-photo/[surgeonId]/route.ts) that
-- checks surgeon_profiles.status = 'approved' server-side and then mints a
-- short-lived signed URL with the service role. This is what makes "no
-- unapproved photo is ever publicly reachable" actually true, rather than
-- relying on visitors not guessing a public bucket path.
--
-- Upload objects are stored at `${auth.uid()}/${filename}` so ownership can
-- be checked with storage.foldername(name).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'surgeon-photos',
  'surgeon-photos',
  false,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "surgeon_photos_insert_own_folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'surgeon-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "surgeon_photos_select_own_or_admin"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'surgeon-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_is_admin()
    )
  );

create policy "surgeon_photos_update_own_or_admin"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'surgeon-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_is_admin()
    )
  )
  with check (
    bucket_id = 'surgeon-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_is_admin()
    )
  );

create policy "surgeon_photos_delete_own_or_admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'surgeon-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.current_user_is_admin()
    )
  );

-- No anon/public policy exists on this bucket: unauthenticated visitors can
-- never list or read objects directly, only via the signed-URL server route.
