-- Heritage Solar v1.4-v1.5 — payment requests + notifications
-- Requires 009a_enum.sql committed first on existing databases.

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null default 'upi',
  transaction_reference text,
  proof_url text,
  notes text,
  requested_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text,
  rejection_reason text,
  status text not null default 'pending' check (
    status in ('pending', 'approved', 'rejected', 'cancelled')
  )
);

create unique index if not exists payment_requests_one_pending_per_bill_idx
  on public.payment_requests (bill_id)
  where status = 'pending';

create index if not exists payment_requests_status_idx
  on public.payment_requests (status, requested_at desc);

create index if not exists payment_requests_property_idx
  on public.payment_requests (property_id, status, requested_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  bill_id uuid references public.bills (id) on delete set null,
  title text not null,
  message text not null,
  type text not null check (
    type in (
      'bill_published',
      'payment_requested',
      'payment_approved',
      'payment_rejected',
      'credit_created',
      'credit_applied',
      'bill_updated',
      'payment_edited',
      'payment_deleted'
    )
  ),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_property_read_idx
  on public.notifications (property_id, is_read, created_at desc);

alter table public.payment_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "Public read payment requests" on public.payment_requests;
drop policy if exists "Public insert payment requests" on public.payment_requests;
drop policy if exists "Public update payment requests" on public.payment_requests;
drop policy if exists "Public delete payment requests" on public.payment_requests;

create policy "Public read payment requests"
  on public.payment_requests for select using (true);
create policy "Public insert payment requests"
  on public.payment_requests for insert with check (true);
create policy "Public update payment requests"
  on public.payment_requests for update using (true) with check (true);
create policy "Public delete payment requests"
  on public.payment_requests for delete using (true);

drop policy if exists "Public read notifications" on public.notifications;
drop policy if exists "Public insert notifications" on public.notifications;
drop policy if exists "Public update notifications" on public.notifications;
drop policy if exists "Public delete notifications" on public.notifications;

create policy "Public read notifications"
  on public.notifications for select using (true);
create policy "Public insert notifications"
  on public.notifications for insert with check (true);
create policy "Public update notifications"
  on public.notifications for update using (true) with check (true);
create policy "Public delete notifications"
  on public.notifications for delete using (true);
