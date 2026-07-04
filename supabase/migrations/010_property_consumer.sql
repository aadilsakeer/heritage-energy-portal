-- Heritage Solar v1.5.1 — property consumer numbers for auto-detection

alter table public.properties
  add column if not exists consumer_number text;

create unique index if not exists properties_consumer_number_idx
  on public.properties (consumer_number)
  where consumer_number is not null;

update public.properties
set consumer_number = '1155442007288'
where slug = 'home'
  and (consumer_number is null or consumer_number = '');

update public.properties
set consumer_number = '1155446031429'
where slug = 'heritage'
  and (consumer_number is null or consumer_number = '');
