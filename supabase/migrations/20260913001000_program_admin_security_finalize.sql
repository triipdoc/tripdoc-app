-- Run only AFTER deploying the app code that reads program_public_view and uploads through /api/admin/program-images.
begin;
drop policy if exists "Public read programs" on public.programs;
drop policy if exists "Public read public programs" on public.programs;
revoke select on public.programs from public, anon, authenticated;
-- Table-level REVOKE does not remove legacy column-level grants.
do $$ declare cols text; begin
  select string_agg(quote_ident(column_name), ',') into cols from information_schema.columns where table_schema='public' and table_name='programs';
  execute 'revoke select (' || cols || '), insert (' || cols || '), update (' || cols || '), references (' || cols || ') on public.programs from public, anon, authenticated';
end $$;
-- Server-side authenticated upload replaces browser writes for this bucket.
insert into storage.buckets(id, name, public) values ('program-images', 'program-images', true) on conflict (id) do nothing;
drop policy if exists program_images_admin_insert on storage.objects;
create policy program_images_admin_insert on storage.objects as restrictive for insert to anon, authenticated with check (bucket_id <> 'program-images');
drop policy if exists program_images_admin_update on storage.objects;
create policy program_images_admin_update on storage.objects as restrictive for update to anon, authenticated using (bucket_id <> 'program-images') with check (bucket_id <> 'program-images');
drop policy if exists program_images_admin_delete on storage.objects;
create policy program_images_admin_delete on storage.objects as restrictive for delete to anon, authenticated using (bucket_id <> 'program-images');
commit;
