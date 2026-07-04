-- Meter reading PDF storage

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meter-readings',
  'meter-readings',
  false,
  10485760,
  array['application/pdf', 'image/png', 'image/jpeg']
)
on conflict (id) do update
set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read meter readings"
  on storage.objects for select
  using (bucket_id = 'meter-readings');

create policy "Public upload meter readings"
  on storage.objects for insert
  with check (bucket_id = 'meter-readings');

create policy "Public update meter readings"
  on storage.objects for update
  using (bucket_id = 'meter-readings')
  with check (bucket_id = 'meter-readings');
