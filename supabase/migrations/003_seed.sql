-- Seed properties and billing configuration

insert into public.properties (id, slug, name, short_name)
values
  ('11111111-1111-1111-1111-111111111111', 'home', 'Home', 'Home'),
  ('22222222-2222-2222-2222-222222222222', 'heritage', 'Heritage Building', 'Heritage')
on conflict (slug) do update
set
  name = excluded.name,
  short_name = excluded.short_name;

insert into public.billing_configuration (
  id,
  property_id,
  rate,
  discount_percent,
  fixed_charge,
  effective_from
)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    9.5,
    5,
    1700,
    '2026-01-01'
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    9.5,
    5,
    8550,
    '2026-01-01'
  )
on conflict (property_id, effective_from) do update
set
  rate = excluded.rate,
  discount_percent = excluded.discount_percent,
  fixed_charge = excluded.fixed_charge;
