-- Final release schema extensions

alter table public.bills
  add column if not exists bill_date date,
  add column if not exists consumer_number text,
  add column if not exists invoice_number text,
  add column if not exists ai_json jsonb,
  add column if not exists validated_json jsonb;

create table if not exists public.bill_events (
  id uuid primary key default gen_random_uuid(),
  bill_id uuid not null references public.bills (id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bill_events_bill_id_created_idx
  on public.bill_events (bill_id, created_at desc);

alter table public.bill_events enable row level security;

create policy "Public read bill events"
  on public.bill_events for select
  using (true);

create policy "Public insert bill events"
  on public.bill_events for insert
  with check (true);

create policy "Public delete bills"
  on public.bills for delete
  using (true);
