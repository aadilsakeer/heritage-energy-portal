-- Heritage Solar v1.3 — customer credit ledger

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

create index if not exists customer_credits_property_status_idx
  on public.customer_credits (property_id, status, created_at asc);

create index if not exists customer_credits_bill_id_idx
  on public.customer_credits (bill_id);

alter table public.customer_credits enable row level security;

drop policy if exists "Public read customer credits" on public.customer_credits;
drop policy if exists "Public insert customer credits" on public.customer_credits;
drop policy if exists "Public update customer credits" on public.customer_credits;
drop policy if exists "Public delete customer credits" on public.customer_credits;

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

-- Verification
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'bills'
  and column_name in ('credit_applied', 'amount_payable');

select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'customer_credits'
order by ordinal_position;
