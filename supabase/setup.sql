-- =============================================================================
-- Heritage Solar — one-shot production setup
-- Run this entire file in the Supabase SQL Editor (one run).
-- Safe to re-run (idempotent).
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enum: bill_status
do $$
begin
  create type public.bill_status as enum ('draft', 'published', 'archived');
exception
  when duplicate_object then null;
end
$$;

-- =============================================================================
-- Tables
-- =============================================================================

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_configuration (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  rate numeric(10, 4) not null check (rate >= 0),
  discount_percent numeric(6, 3) not null check (
    discount_percent >= 0 and discount_percent <= 100
  ),
  fixed_charge numeric(12, 2) not null check (fixed_charge >= 0),
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  unique (property_id, effective_from)
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  billing_month date not null,
  status public.bill_status not null default 'draft',

  generation numeric(12, 3),
  export_kwh numeric(12, 3),
  import_kwh numeric(12, 3),

  consumption numeric(12, 3),
  energy_charge numeric(12, 2),
  discount_amount numeric(12, 2),
  fixed_charge numeric(12, 2),
  tenant_total numeric(12, 2),

  -- Stored separately; never included in tenant_total
  security_deposit numeric(12, 2) not null default 0,
  arrears numeric(12, 2) not null default 0,

  rate numeric(10, 4),
  discount_percent numeric(6, 3),

  pdf_path text,
  pdf_file_name text,

  due_date date,
  bill_date date,
  consumer_number text,
  invoice_number text,
  ai_json jsonb,
  validated_json jsonb,

  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Columns for projects that created bills before final-release fields existed
alter table public.bills add column if not exists bill_date date;
alter table public.bills add column if not exists consumer_number text;
alter table public.bills add column if not exists invoice_number text;
alter table public.bills add column if not exists ai_json jsonb;
alter table public.bills add column if not exists validated_json jsonb;

create table if not exists public.bill_events (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

create unique index if not exists bills_one_published_per_month_idx
  on public.bills (property_id, billing_month)
  where status = 'published';

create index if not exists bills_property_status_month_idx
  on public.bills (property_id, status, billing_month desc);

create index if not exists bills_property_month_idx
  on public.bills (property_id, billing_month desc);

create index if not exists bill_events_bill_id_created_idx
  on public.bill_events (bill_id, created_at desc);

-- =============================================================================
-- updated_at trigger
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bills_set_updated_at on public.bills;

create trigger bills_set_updated_at
before update on public.bills
for each row
execute function public.set_updated_at();

-- =============================================================================
-- Row Level Security (public tenant portal — no login)
-- =============================================================================

alter table public.properties enable row level security;
alter table public.billing_configuration enable row level security;
alter table public.bills enable row level security;
alter table public.bill_events enable row level security;

drop policy if exists "Public read properties" on public.properties;
drop policy if exists "Public read billing configuration" on public.billing_configuration;
drop policy if exists "Public read bills" on public.bills;
drop policy if exists "Public insert bills" on public.bills;
drop policy if exists "Public update bills" on public.bills;
drop policy if exists "Public delete bills" on public.bills;
drop policy if exists "Public read bill events" on public.bill_events;
drop policy if exists "Public insert bill events" on public.bill_events;

create policy "Public read properties"
  on public.properties for select
  using (true);

create policy "Public read billing configuration"
  on public.billing_configuration for select
  using (true);

create policy "Public read bills"
  on public.bills for select
  using (true);

create policy "Public insert bills"
  on public.bills for insert
  with check (true);

create policy "Public update bills"
  on public.bills for update
  using (true)
  with check (true);

create policy "Public delete bills"
  on public.bills for delete
  using (true);

create policy "Public read bill events"
  on public.bill_events for select
  using (true);

create policy "Public insert bill events"
  on public.bill_events for insert
  with check (true);

-- =============================================================================
-- Storage: kseb-bills
-- =============================================================================

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

-- =============================================================================
-- Seed: properties
-- =============================================================================

insert into public.properties (id, slug, name, short_name)
values
  ('11111111-1111-1111-1111-111111111111', 'home', 'Home', 'Home'),
  ('22222222-2222-2222-2222-222222222222', 'heritage', 'Heritage Building', 'Heritage')
on conflict (slug) do update
set
  name = excluded.name,
  short_name = excluded.short_name;

-- =============================================================================
-- Seed: billing_configuration
-- =============================================================================

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

-- =============================================================================
-- Seed: sample published bills (so Home / Analytics / History have live data)
-- Formula: consumption = generation - (export - import)
--           energy = consumption * rate
--           discount = energy * discount%
--           tenant_total = energy - discount + fixed_charge
-- =============================================================================

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
  ),
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
on conflict (id) do nothing;

-- =============================================================================
-- Verification
-- =============================================================================

select * from properties;
select * from billing_configuration;
select * from bills;
select id, name from storage.buckets where id = 'kseb-bills';
