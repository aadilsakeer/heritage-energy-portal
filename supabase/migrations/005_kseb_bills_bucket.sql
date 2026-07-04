-- Production storage bucket (idempotent for projects that already applied older migrations)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kseb-bills',
  'kseb-bills',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read meter readings" on storage.objects;
drop policy if exists "Public upload meter readings" on storage.objects;
drop policy if exists "Public update meter readings" on storage.objects;
drop policy if exists "Public read kseb bills" on storage.objects;
drop policy if exists "Public upload kseb bills" on storage.objects;
drop policy if exists "Public update kseb bills" on storage.objects;
drop policy if exists "Public delete kseb bills" on storage.objects;

create policy "Public read kseb bills"
  on storage.objects for select
  using (bucket_id = 'kseb-bills');

create policy "Public upload kseb bills"
  on storage.objects for insert
  with check (bucket_id = 'kseb-bills');

create policy "Public update kseb bills"
  on storage.objects for update
  using (bucket_id = 'kseb-bills')
  with check (bucket_id = 'kseb-bills');

create policy "Public delete kseb bills"
  on storage.objects for delete
  using (bucket_id = 'kseb-bills');
