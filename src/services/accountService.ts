import {
  buildCustomerLedger,
  computeAveragePaymentDelayDays,
  computeBillAccountSummary,
  computeOutstandingBreakdown,
  filterLedgerEntries,
  ledgerOpeningBalance,
  planFifoAllocation,
  toBillBalanceRow,
  toCollectionStatus,
  UNPAID_STATUSES,
  type AccountAdjustment,
  type BillAccountSummary,
  type BillBalanceRow,
  type FifoAllocationPlan,
  type LedgerEntry,
  type LedgerTransactionType,
  type OutstandingBreakdown,
  type PropertyAccountSummary,
} from '@/lib/account'
import { roundMoney } from '@/lib/credits'
import { PAYABLE_STATUSES } from '@/lib/payments'
import { assertNonZeroAmount } from '@/lib/validation'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import { fetchPropertyCreditBalance } from '@/services/creditService'
import { fetchPortalSettings } from '@/services/settingsService'
import type { Bill, CustomerCredit, Payment, Property } from '@/types'
import { mapBill, mapCustomerCredit, mapPayment } from '@/utils/mappers'

function mapAdjustment(row: {
  id: string
  property_id: string
  bill_id: string | null
  amount: number
  reason: string
  notes: string | null
  created_at: string
  created_by: string | null
}): AccountAdjustment {
  return {
    id: row.id,
    propertyId: row.property_id,
    billId: row.bill_id,
    amount: Number(row.amount),
    reason: row.reason,
    notes: row.notes,
    createdAt: row.created_at,
    createdBy: row.created_by,
  }
}

async function fetchPayableBills(propertyId: string): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('property_id', propertyId)
    .in('status', PAYABLE_STATUSES)
    .order('billing_month', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapBill)
}

async function fetchPaymentsForBillIds(
  billIds: string[],
): Promise<Map<string, Payment[]>> {
  const map = new Map<string, Payment[]>()
  if (billIds.length === 0) return map

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .in('bill_id', billIds)
    .order('payment_date', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))

  for (const row of data ?? []) {
    const payment = mapPayment(row)
    const list = map.get(payment.billId) ?? []
    list.push(payment)
    map.set(payment.billId, list)
  }

  return map
}

async function fetchCredits(propertyId: string): Promise<CustomerCredit[]> {
  const { data, error } = await supabase
    .from('customer_credits')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapCustomerCredit)
}

export async function fetchAdjustmentsForProperty(
  propertyId: string,
): Promise<AccountAdjustment[]> {
  const { data, error } = await supabase
    .from('account_adjustments')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: true })

  if (error) {
    // Table may not exist until migration — fail soft
    if (error.message.toLowerCase().includes('account_adjustments')) return []
    throw new Error(getSupabaseErrorMessage(error))
  }
  return (data ?? []).map(mapAdjustment)
}

export async function fetchBillBalanceRows(
  propertyId: string,
): Promise<BillBalanceRow[]> {
  const [bills, settings] = await Promise.all([
    fetchPayableBills(propertyId),
    fetchPortalSettings().catch(() => null),
  ])
  const paymentsByBill = await fetchPaymentsForBillIds(bills.map((b) => b.id))
  const criticalDays = settings?.criticalOverdueDays ?? 30
  return bills.map((bill) =>
    toBillBalanceRow(
      bill,
      paymentsByBill.get(bill.id) ?? [],
      undefined,
      criticalDays,
    ),
  )
}

export async function fetchOutstandingBreakdown(
  propertyId: string,
): Promise<OutstandingBreakdown> {
  const [rows, accountCredit] = await Promise.all([
    fetchBillBalanceRows(propertyId),
    fetchPropertyCreditBalance(propertyId),
  ])

  const current = rows[rows.length - 1] ?? null
  const allPayments = rows.flatMap((row) => row.payments)
  const lastPayment =
    [...allPayments].sort((a, b) =>
      b.paymentDate.localeCompare(a.paymentDate),
    )[0] ?? null

  return computeOutstandingBreakdown(
    rows,
    current?.bill.id ?? null,
    accountCredit,
    lastPayment?.amount ?? null,
  )
}

export async function fetchUnpaidBillRows(
  propertyId: string,
): Promise<BillBalanceRow[]> {
  const rows = await fetchBillBalanceRows(propertyId)
  return rows
    .filter((row) => row.balance > 0)
    .sort((a, b) => b.bill.billingMonth.localeCompare(a.bill.billingMonth))
}

export async function fetchPropertyAccount(
  propertyId: string,
): Promise<PropertyAccountSummary> {
  const [rows, accountCredit] = await Promise.all([
    fetchBillBalanceRows(propertyId),
    fetchPropertyCreditBalance(propertyId),
  ])

  const unpaid = rows.filter((row) => row.balance > 0)
  const current = rows[rows.length - 1] ?? null

  const outstandingBreakdown = computeOutstandingBreakdown(
    rows,
    current?.bill.id ?? null,
    accountCredit,
  )

  const allPayments = rows.flatMap((row) => row.payments)
  const lastPayment =
    [...allPayments].sort((a, b) => {
      const byDate = b.paymentDate.localeCompare(a.paymentDate)
      if (byDate !== 0) return byDate
      return b.createdAt.localeCompare(a.createdAt)
    })[0] ?? null

  const collected = roundMoney(
    rows.reduce((sum, row) => sum + row.totalPaid, 0),
  )
  const billed = roundMoney(
    rows.reduce((sum, row) => sum + row.finalAmount, 0),
  )
  const overdueRows = unpaid.filter((row) => row.isOverdue)
  const criticalRows = unpaid.filter((row) => row.isCritical)
  const overdueAmount = roundMoney(
    overdueRows.reduce((sum, row) => sum + row.balance, 0),
  )
  const criticalAmount = roundMoney(
    criticalRows.reduce((sum, row) => sum + row.balance, 0),
  )
  const collectionPercent =
    billed > 0 ? roundMoney((collected / billed) * 100) : 0

  const nextDue =
    unpaid
      .filter((row) => row.bill.dueDate)
      .sort((a, b) =>
        (a.bill.dueDate ?? '').localeCompare(b.bill.dueDate ?? ''),
      )[0]?.bill.dueDate ?? null

  return {
    currentBill: current?.bill ?? null,
    outstanding: outstandingBreakdown.totalOutstanding,
    paid: collected,
    credits: accountCredit,
    balance: outstandingBreakdown.totalDue,
    pendingBills: unpaid.length,
    lastPayment,
    nextDue,
    previousOutstanding: outstandingBreakdown.previousOutstanding,
    currentBillAmount: outstandingBreakdown.currentBillAmount,
    creditApplied: outstandingBreakdown.creditApplied,
    totalDue: outstandingBreakdown.totalDue,
    status: outstandingBreakdown.status,
    isOverdue: outstandingBreakdown.isOverdue,
    isCritical: outstandingBreakdown.isCritical,
    overdueDays: outstandingBreakdown.overdueDays,
    overdueStage: outstandingBreakdown.overdueStage,
    unpaidBills: unpaid.sort((a, b) =>
      b.bill.billingMonth.localeCompare(a.bill.billingMonth),
    ),
    collected,
    overdueAmount,
    overdueBillCount: overdueRows.length,
    criticalAmount,
    criticalBillCount: criticalRows.length,
    collectionPercent,
    creditsOutstanding: accountCredit,
    collectionStatus: toCollectionStatus(
      unpaid,
      outstandingBreakdown.totalOutstanding,
    ),
    averagePaymentDelayDays: computeAveragePaymentDelayDays(rows),
  }
}

export async function fetchBillAccountSummary(
  billId: string,
  propertyId: string,
): Promise<BillAccountSummary | null> {
  const rows = await fetchBillBalanceRows(propertyId)
  const target = rows.find((row) => row.bill.id === billId)
  if (!target) return null

  const openingBalance = roundMoney(
    rows
      .filter(
        (row) =>
          row.bill.billingMonth < target.bill.billingMonth && row.balance > 0,
      )
      .reduce((sum, row) => sum + row.balance, 0),
  )

  return computeBillAccountSummary(
    target.bill,
    target.payments,
    openingBalance,
  )
}

export async function fetchCustomerLedger(
  propertyId: string,
  options?: {
    fromDate?: string | null
    toDate?: string | null
    types?: LedgerTransactionType[] | null
    search?: string | null
  },
): Promise<{
  entries: LedgerEntry[]
  allEntries: LedgerEntry[]
  openingBalance: number
  closingBalance: number
}> {
  const [bills, credits, adjustments] = await Promise.all([
    fetchPayableBills(propertyId),
    fetchCredits(propertyId),
    fetchAdjustmentsForProperty(propertyId),
  ])
  const paymentsByBillId = await fetchPaymentsForBillIds(bills.map((b) => b.id))
  const allEntries = buildCustomerLedger({
    bills,
    paymentsByBillId,
    credits,
    adjustments,
  })
  const openingBalance = ledgerOpeningBalance(allEntries, options?.fromDate)
  const entries = filterLedgerEntries(allEntries, options)
  const closingBalance =
    entries.length > 0
      ? entries[entries.length - 1].runningBalance
      : openingBalance

  return { entries, allEntries, openingBalance, closingBalance }
}

export async function planPropertyFifoAllocation(
  propertyId: string,
  amount: number,
): Promise<FifoAllocationPlan[]> {
  const rows = await fetchBillBalanceRows(propertyId)
  const unpaidOldestFirst = rows
    .filter(
      (row) =>
        row.balance > 0 && UNPAID_STATUSES.includes(row.bill.status),
    )
    .sort((a, b) => a.bill.billingMonth.localeCompare(b.bill.billingMonth))

  if (unpaidOldestFirst.length === 0) {
    const latest = [...rows].sort((a, b) =>
      b.bill.billingMonth.localeCompare(a.bill.billingMonth),
    )[0]
    if (!latest) return []
    return [
      {
        billId: latest.bill.id,
        amount: roundMoney(amount),
        billingMonth: latest.bill.billingMonth,
      },
    ]
  }

  return planFifoAllocation(unpaidOldestFirst, amount)
}

export interface PropertyOverviewRow {
  property: Property
  account: PropertyAccountSummary
}

export async function fetchAllPropertyAccounts(
  properties: Property[],
): Promise<PropertyOverviewRow[]> {
  const accounts = await Promise.all(
    properties.map(async (property) => ({
      property,
      account: await fetchPropertyAccount(property.id),
    })),
  )
  return accounts
}

export async function createAccountAdjustment(input: {
  propertyId: string
  billId?: string | null
  amount: number
  reason: string
  notes?: string
}): Promise<AccountAdjustment> {
  assertNonZeroAmount(input.amount, 'Adjustment amount')
  if (!input.reason.trim()) throw new Error('Adjustment reason is required')

  const { data, error } = await supabase
    .from('account_adjustments')
    .insert({
      property_id: input.propertyId,
      bill_id: input.billId ?? null,
      amount: input.amount,
      reason: input.reason.trim(),
      notes: input.notes ?? null,
      created_by: 'admin',
    })
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const { logAuditEvent } = await import('@/services/auditService')
  await logAuditEvent({
    propertyId: input.propertyId,
    billId: input.billId ?? null,
    entityType: 'adjustment',
    entityId: data.id,
    action: 'adjustment_created',
    actor: 'admin',
    metadata: { amount: input.amount, reason: input.reason },
  })

  return mapAdjustment(data)
}
