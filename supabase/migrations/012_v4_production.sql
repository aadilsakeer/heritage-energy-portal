-- Heritage Solar v4.0 — Final Production Release
-- Additive only. Outstanding remains calculated from bills + payments + credits.

-- Locked / monthly closing on bills
alter table public.bills
  add column if not exists is_locked boolean not null default false;

alter table public.bills
  add column if not exists locked_at timestamptz;

alter table public.bills
  add column if not exists locked_by text;

-- App settings (single-row style via key)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_all" on public.app_settings;
create policy "app_settings_all" on public.app_settings
  for all using (true) with check (true);

insert into public.app_settings (key, value)
values (
  'portal',
  jsonb_build_object(
    'companyName', 'Heritage Solar',
    'logoPath', '/icons/logo.png',
    'dueDays', 15,
    'criticalOverdueDays', 30,
    'reminderDaysBefore', 3,
    'reminderDueToday', true,
    'reminderDaysOverdue', array[7, 30],
    'retentionDays', 3650,
    'themeDefault', 'system',
    'averagePaymentDelayDays', 0
  )
)
on conflict (key) do nothing;

-- Account adjustments (debit/credit beyond credits wallet)
create table if not exists public.account_adjustments (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  bill_id uuid references public.bills (id) on delete set null,
  amount numeric(12, 2) not null,
  reason text not null,
  notes text,
  created_at timestamptz not null default now(),
  created_by text,
  constraint account_adjustments_amount_nonzero check (amount <> 0)
);

create index if not exists account_adjustments_property_idx
  on public.account_adjustments (property_id, created_at desc);

alter table public.account_adjustments enable row level security;

drop policy if exists "account_adjustments_all" on public.account_adjustments;
create policy "account_adjustments_all" on public.account_adjustments
  for all using (true) with check (true);

-- Reminder history (sending can remain disabled; engine prepares records)
create table if not exists public.reminder_history (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  bill_id uuid references public.bills (id) on delete set null,
  stage text not null,
  due_date date,
  scheduled_for date not null,
  status text not null default 'prepared'
    check (status in ('prepared', 'sent', 'skipped', 'cancelled')),
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reminder_history_property_idx
  on public.reminder_history (property_id, scheduled_for desc);

create unique index if not exists reminder_history_dedupe_idx
  on public.reminder_history (property_id, bill_id, stage, scheduled_for);

alter table public.reminder_history enable row level security;

drop policy if exists "reminder_history_all" on public.reminder_history;
create policy "reminder_history_all" on public.reminder_history
  for all using (true) with check (true);

-- Property / system audit trail (extends bill_events)
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties (id) on delete set null,
  bill_id uuid references public.bills (id) on delete set null,
  entity_type text not null,
  entity_id text,
  action text not null,
  actor text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_property_idx
  on public.audit_events (property_id, created_at desc);

create index if not exists audit_events_action_idx
  on public.audit_events (action, created_at desc);

alter table public.audit_events enable row level security;

drop policy if exists "audit_events_all" on public.audit_events;
create policy "audit_events_all" on public.audit_events
  for all using (true) with check (true);

-- Soft duplicate payment guard (same bill + reference + amount + date)
create unique index if not exists payments_duplicate_guard_idx
  on public.payments (bill_id, payment_date, amount, (coalesce(reference, '')));

comment on column public.bills.is_locked is
  'Monthly closing lock. Locked bills cannot be edited until admin reopens.';

comment on table public.reminder_history is
  'Prepared reminder stages: before_due, due_today, overdue_7, overdue_30. Notification sending may stay disabled.';
