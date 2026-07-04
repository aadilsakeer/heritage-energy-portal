-- Heritage Solar v1.4 — add payment_pending_verification bill status
-- Run BEFORE 009b_payment_workflow.sql (separate transaction if using psql)

do $$
begin
  if not exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    where t.typname = 'bill_status'
      and e.enumlabel = 'payment_pending_verification'
  ) then
    alter type public.bill_status add value 'payment_pending_verification';
  end if;
end
$$;
