-- Heritage Solar — core schema

create extension if not exists "pgcrypto";

create type public.bill_status as enum ('draft', 'published', 'archived');

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  created_at timestamptz not null default now()
);

create table public.billing_configuration (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  rate numeric(10, 4) not null check (rate >= 0),
  discount_percent numeric(6, 3) not null check (discount_percent >= 0 and discount_percent <= 100),
  fixed_charge numeric(12, 2) not null check (fixed_charge >= 0),
  effective_from date not null default current_date,
  created_at timestamptz not null default now(),
  unique (property_id, effective_from)
);

create table public.bills (
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
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index bills_one_published_per_month_idx
  on public.bills (property_id, billing_month)
  where status = 'published';

create index bills_property_status_month_idx
  on public.bills (property_id, status, billing_month desc);


create index bills_property_month_idx
  on public.bills (property_id, billing_month desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger bills_set_updated_at
before update on public.bills
for each row
execute function public.set_updated_at();

-- Public tenant portal (no login). Writes allowed for admin workflow until auth lands.
alter table public.properties enable row level security;
alter table public.billing_configuration enable row level security;
alter table public.bills enable row level security;

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
