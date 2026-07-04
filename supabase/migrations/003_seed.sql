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

-- Helper: consumption = generation - (export - import)
-- energy = consumption * rate
-- discount = energy * discount%
-- tenant_total = energy - discount + fixed_charge

-- Home published bills (Jan–Jun 2026)
insert into public.bills (
  id, property_id, billing_month, status,
  generation, export_kwh, import_kwh,
  consumption, energy_charge, discount_amount, fixed_charge, tenant_total,
  security_deposit, arrears, rate, discount_percent,
  due_date, published_at
)
values
  (
    'c1000000-0000-0000-0000-000000000001',
    '11111111-1111-1111-1111-111111111111',
    '2026-01-01', 'published',
    390, 100, 80,
    370, 3515.00, 175.75, 1700.00, 5039.25,
    0, 0, 9.5, 5,
    '2026-02-15', '2026-02-01T10:00:00Z'
  ),
  (
    'c1000000-0000-0000-0000-000000000002',
    '11111111-1111-1111-1111-111111111111',
    '2026-02-01', 'published',
    410, 110, 85,
    385, 3657.50, 182.88, 1700.00, 5174.62,
    0, 0, 9.5, 5,
    '2026-03-15', '2026-03-01T10:00:00Z'
  ),
  (
    'c1000000-0000-0000-0000-000000000003',
    '11111111-1111-1111-1111-111111111111',
    '2026-03-01', 'published',
    445, 120, 90,
    415, 3942.50, 197.13, 1700.00, 5445.37,
    0, 0, 9.5, 5,
    '2026-04-15', '2026-04-01T10:00:00Z'
  ),
  (
    'c1000000-0000-0000-0000-000000000004',
    '11111111-1111-1111-1111-111111111111',
    '2026-04-01', 'published',
    480, 130, 95,
    445, 4227.50, 211.38, 1700.00, 5716.12,
    0, 0, 9.5, 5,
    '2026-05-15', '2026-05-01T10:00:00Z'
  ),
  (
    'c1000000-0000-0000-0000-000000000005',
    '11111111-1111-1111-1111-111111111111',
    '2026-05-01', 'published',
    455, 125, 92,
    422, 4009.00, 200.45, 1700.00, 5508.55,
    0, 0, 9.5, 5,
    '2026-06-15', '2026-06-01T10:00:00Z'
  ),
  (
    'c1000000-0000-0000-0000-000000000006',
    '11111111-1111-1111-1111-111111111111',
    '2026-06-01', 'published',
    428, 116, 94,
    406, 3857.00, 192.85, 1700.00, 5364.15,
    500, 0, 9.5, 5,
    '2026-07-15', '2026-07-01T10:00:00Z'
  )
on conflict do nothing;

-- Heritage Building published bills (Jan–Jun 2026)
insert into public.bills (
  id, property_id, billing_month, status,
  generation, export_kwh, import_kwh,
  consumption, energy_charge, discount_amount, fixed_charge, tenant_total,
  security_deposit, arrears, rate, discount_percent,
  due_date, published_at
)
values
  (
    'c2000000-0000-0000-0000-000000000001',
    '22222222-2222-2222-2222-222222222222',
    '2026-01-01', 'published',
    1180, 240, 200,
    1140, 10830.00, 541.50, 8550.00, 18838.50,
    0, 0, 9.5, 5,
    '2026-02-18', '2026-02-02T10:00:00Z'
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    '22222222-2222-2222-2222-222222222222',
    '2026-02-01', 'published',
    1210, 250, 205,
    1165, 11067.50, 553.38, 8550.00, 19064.12,
    0, 0, 9.5, 5,
    '2026-03-18', '2026-03-02T10:00:00Z'
  ),
  (
    'c2000000-0000-0000-0000-000000000003',
    '22222222-2222-2222-2222-222222222222',
    '2026-03-01', 'published',
    1290, 270, 220,
    1240, 11780.00, 589.00, 8550.00, 19741.00,
    0, 0, 9.5, 5,
    '2026-04-18', '2026-04-02T10:00:00Z'
  ),
  (
    'c2000000-0000-0000-0000-000000000004',
    '22222222-2222-2222-2222-222222222222',
    '2026-04-01', 'published',
    1340, 280, 230,
    1290, 12255.00, 612.75, 8550.00, 20192.25,
    0, 0, 9.5, 5,
    '2026-05-18', '2026-05-02T10:00:00Z'
  ),
  (
    'c2000000-0000-0000-0000-000000000005',
    '22222222-2222-2222-2222-222222222222',
    '2026-05-01', 'published',
    1275, 265, 215,
    1225, 11637.50, 581.88, 8550.00, 19605.62,
    0, 0, 9.5, 5,
    '2026-06-18', '2026-06-02T10:00:00Z'
  ),
  (
    'c2000000-0000-0000-0000-000000000006',
    '22222222-2222-2222-2222-222222222222',
    '2026-06-01', 'published',
    1240, 260, 210,
    1190, 11305.00, 565.25, 8550.00, 19289.75,
    1000, 0, 9.5, 5,
    '2026-07-18', '2026-07-02T10:00:00Z'
  )
on conflict do nothing;
