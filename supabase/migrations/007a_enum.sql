-- Heritage Solar v1.2 — bill_status enum extension (step 1 of 2)
--
-- Run this file FIRST in the Supabase SQL Editor, then run 007b_payments.sql.
-- PostgreSQL cannot use newly added enum values in the same transaction.
-- Safe to re-run (idempotent).

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'bill_status'
      and e.enumlabel = 'partially_paid'
  ) then
    alter type public.bill_status add value 'partially_paid';
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'bill_status'
      and e.enumlabel = 'paid'
  ) then
    alter type public.bill_status add value 'paid';
  end if;
end
$$;

-- Verification
select e.enumlabel as bill_status_value
from pg_enum e
join pg_type t on t.oid = e.enumtypid
join pg_namespace n on n.oid = t.typnamespace
where n.nspname = 'public'
  and t.typname = 'bill_status'
order by e.enumsortorder;
