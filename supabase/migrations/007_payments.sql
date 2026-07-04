-- Heritage Solar v1.2 — payments + extended bill status

alter type public.bill_status add value if not exists 'partially_paid';
alter type public.bill_status add value if not exists 'paid';

drop index if exists public.bills_one_published_per_month_idx;

create unique index if not exists bills_one_active_per_month_idx
  on public.bills (property_id, billing_month)
  where status in ('published', 'partially_paid', 'paid');

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

create index if not exists payments_bill_id_idx
  on public.payments (bill_id, payment_date desc);

alter table public.payments enable row level security;

drop policy if exists "Public read payments" on public.payments;
drop policy if exists "Public insert payments" on public.payments;
drop policy if exists "Public update payments" on public.payments;
drop policy if exists "Public delete payments" on public.payments;

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
