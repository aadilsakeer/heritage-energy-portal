-- Heritage Solar v5.1 — Production Security & Integrity Audit
-- Additive / corrective only. No schema redesign. Open RLS remains intentional.

-- 1) Fix mutable search_path on trigger function (Supabase linter)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 2) Settings write path: properties + billing_configuration were SELECT-only
drop policy if exists "Public update properties" on public.properties;
create policy "Public update properties"
  on public.properties for update
  using (true)
  with check (true);

drop policy if exists "Public insert billing configuration" on public.billing_configuration;
create policy "Public insert billing configuration"
  on public.billing_configuration for insert
  with check (true);

drop policy if exists "Public update billing configuration" on public.billing_configuration;
create policy "Public update billing configuration"
  on public.billing_configuration for update
  using (true)
  with check (true);

-- 3) One active bill per month must include pending verification
drop index if exists public.bills_one_active_per_month_idx;
create unique index bills_one_active_per_month_idx
  on public.bills (property_id, billing_month)
  where status in (
    'published',
    'payment_pending_verification',
    'partially_paid',
    'paid'
  );

-- 4) Credit integrity: remaining cannot exceed issued amount
alter table public.customer_credits
  drop constraint if exists customer_credits_remaining_amount_check;

alter table public.customer_credits
  add constraint customer_credits_remaining_amount_check
  check (remaining_amount >= 0 and remaining_amount <= amount);

-- 5) Drop duplicate (non-DESC) property/month index; retain bills_property_month_idx
drop index if exists public.bills_property_billing_month_idx;
