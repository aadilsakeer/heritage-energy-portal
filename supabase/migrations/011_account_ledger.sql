-- Heritage Solar v3.0 — Account Ledger & Outstanding Management
-- No destructive changes. Outstanding remains calculated from bills + payments + credits.
-- FIFO payment allocation and ledger/statement are application-layer services.

-- Helpful index for property account queries (payable bills by month)
create index if not exists bills_property_billing_month_idx
  on public.bills (property_id, billing_month);

create index if not exists bills_property_status_idx
  on public.bills (property_id, status);

create index if not exists payments_bill_payment_date_idx
  on public.payments (bill_id, payment_date);

comment on table public.bills is
  'Property account bills. Outstanding = sum of unpaid balances across published/partially_paid/pending bills. Overdue is derived when due_date < today and balance > 0.';

comment on table public.payments is
  'Bill-scoped payments. Admin FIFO allocation may insert multiple payment rows (oldest unpaid bill first). Never delete payment history for accounting.';

comment on table public.customer_credits is
  'Property credit wallet. Applied FIFO on bill publish; remaining amounts reduce future outstanding.';
