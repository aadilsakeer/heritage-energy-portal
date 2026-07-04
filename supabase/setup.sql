-- =============================================================================
-- Heritage Solar — one-shot production setup
-- Run this entire file in the Supabase SQL Editor (one run).
-- Safe to re-run (idempotent).
-- =============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- Enum: bill_status (all v1.2 values on fresh install)
-- Existing databases created before v1.2: run 007a_enum.sql then 007b_payments.sql first.
do $$
begin
  create type public.bill_status as enum (
    'draft',
    'published',
    'partially_paid',
    'paid',
    'archived'
  );
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

  create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    bill_id uuid not null references public.bills (id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    payment_date date not null default current_date,
    payment_method text not null default 'bank_transfer',
    reference text,
    notes text,
    created_at timestamptz not null default now()
  );

alter table public.bills
  add column if not exists credit_applied numeric(12, 2) not null default 0,
  add column if not exists amount_payable numeric(12, 2);

create table if not exists public.customer_credits (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  bill_id uuid references public.bills (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  reason text not null,
  remaining_amount numeric(12, 2) not null check (remaining_amount >= 0),
  created_at timestamptz not null default now(),
  applied_at timestamptz,
  status text not null default 'active' check (status in ('active', 'used', 'cancelled'))
);

-- =============================================================================
-- Indexes
-- =============================================================================

drop index if exists public.bills_one_published_per_month_idx;

create unique index if not exists bills_one_active_per_month_idx
  on public.bills (property_id, billing_month)
  where status in ('published', 'partially_paid', 'paid');

create index if not exists bills_property_status_month_idx
  on public.bills (property_id, status, billing_month desc);

create index if not exists bills_property_month_idx
  on public.bills (property_id, billing_month desc);

create index if not exists bill_events_bill_id_created_idx
  on public.bill_events (bill_id, created_at desc);

create index if not exists payments_bill_id_idx
  on public.payments (bill_id, payment_date desc);

create index if not exists customer_credits_property_status_idx
  on public.customer_credits (property_id, status, created_at asc);

create index if not exists customer_credits_bill_id_idx
  on public.customer_credits (bill_id);

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
alter table public.payments enable row level security;
alter table public.customer_credits enable row level security;

drop policy if exists "Public read properties" on public.properties;
drop policy if exists "Public read billing configuration" on public.billing_configuration;
drop policy if exists "Public read bills" on public.bills;
drop policy if exists "Public insert bills" on public.bills;
drop policy if exists "Public update bills" on public.bills;
drop policy if exists "Public delete bills" on public.bills;
drop policy if exists "Public read bill events" on public.bill_events;
drop policy if exists "Public insert bill events" on public.bill_events;
drop policy if exists "Public read payments" on public.payments;
drop policy if exists "Public insert payments" on public.payments;
drop policy if exists "Public update payments" on public.payments;
drop policy if exists "Public delete payments" on public.payments;
drop policy if exists "Public read customer credits" on public.customer_credits;
drop policy if exists "Public insert customer credits" on public.customer_credits;
drop policy if exists "Public update customer credits" on public.customer_credits;
drop policy if exists "Public delete customer credits" on public.customer_credits;

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

create policy "Public read payments"
  on public.payments for select
  using (true);

create policy "Public insert payments"
  on public.payments for insert
  with check (true);

create policy "Public update payments"
  on public.payments for update
  using (true)
  with check (true);

create policy "Public delete payments"
  on public.payments for delete
  using (true);

create policy "Public read customer credits"
  on public.customer_credits for select
  using (true);

create policy "Public insert customer credits"
  on public.customer_credits for insert
  with check (true);

create policy "Public update customer credits"
  on public.customer_credits for update
  using (true)
  with check (true);

create policy "Public delete customer credits"
  on public.customer_credits for delete
  using (true);

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
-- Production cleanup: remove demo/sample bills (see 006_production_cleanup.sql)
-- Only deletes from public.bills; properties and billing_configuration are kept.
-- bill_events rows cascade automatically (bills.id ON DELETE CASCADE).
-- =============================================================================

delete from public.bills
where id in (
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000004',
  'c1000000-0000-0000-0000-000000000005',
  'c1000000-0000-0000-0000-000000000006',
  'c2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000002',
  'c2000000-0000-0000-0000-000000000003',
  'c2000000-0000-0000-0000-000000000004',
  'c2000000-0000-0000-0000-000000000005',
  'c2000000-0000-0000-0000-000000000006'
);

-- =============================================================================
-- Verification
-- =============================================================================

select id, slug, name from public.properties order by slug;
select property_id, rate, discount_percent, fixed_charge from public.billing_configuration order by property_id;
select count(*) as remaining_bills from public.bills;
select count(*) as remaining_bill_events from public.bill_events;
select count(*) as remaining_payments from public.payments;
select count(*) as remaining_customer_credits from public.customer_credits;
select id, name from storage.buckets where id = 'kseb-bills';
