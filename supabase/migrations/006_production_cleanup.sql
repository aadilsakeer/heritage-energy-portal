-- =============================================================================
-- Heritage Solar — production cleanup (demo/sample data removal)
-- =============================================================================
--
-- Schema verified against:
--   supabase/migrations/001_create_tables.sql
--   supabase/migrations/004_final_release.sql
--   supabase/setup.sql
--   src/types/database.ts
--
-- Public tables in this project:
--   properties              (preserved)
--   billing_configuration   (preserved)
--   bills                   (demo rows removed below)
--   bill_events             (not referenced; cascades from bills delete)
--
-- Not present in this project (do not reference):
--   audit_events, invoices, or any other bill-related tables
--
-- Demo bill IDs originate from the removed inserts in 003_seed.sql.
-- Invoices are generated client-side (jspdf); there is no invoices table.
-- =============================================================================

delete from public.bills
where id in (
  'c1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000002',
  'c1000000-0000-0000-0000-000000000003',
  'c1000000-0000-0000-0000-000000000004',
  'c1000000-0000-0000-0000-000000000005',
  'c1000000-0000-0000-0000-000000000006',
  'c2000000-0000-0000-0000-000000000001',
  'c2000000-0000-0000-0000-000000000002',
  'c2000000-0000-0000-0000-000000000003',
  'c2000000-0000-0000-0000-000000000004',
  'c2000000-0000-0000-0000-000000000005',
  'c2000000-0000-0000-0000-000000000006'
);

-- =============================================================================
-- Verification (expected: 2 properties, 2 billing rows, 0 demo bills)
-- =============================================================================

select id, slug, name from public.properties order by slug;
select property_id, rate, discount_percent, fixed_charge from public.billing_configuration order by property_id;
select count(*) as remaining_bills from public.bills;
select count(*) as remaining_bill_events from public.bill_events;
