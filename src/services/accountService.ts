import {
  buildCustomerLedger,
  computeBillAccountSummary,
  computeOutstandingBreakdown,
  filterLedgerByDateRange,
  ledgerOpeningBalance,
  planFifoAllocation,
  toBillBalanceRow,
  UNPAID_STATUSES,
  type BillAccountSummary,
  type BillBalanceRow,
  type FifoAllocationPlan,
  type LedgerEntry,
  type OutstandingBreakdown,
  type PropertyAccountSummary,
} from '@/lib/account'
import { roundMoney } from '@/lib/credits'
import { PAYABLE_STATUSES } from '@/lib/payments'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import { fetchPropertyCreditBalance } from '@/services/creditService'
import type { Bill, CustomerCredit, Payment } from '@/types'
import { mapBill, mapCustomerCredit, mapPayment } from '@/utils/mappers'

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

export async function fetchBillBalanceRows(
  propertyId: string,
): Promise<BillBalanceRow[]> {
  const bills = await fetchPayableBills(propertyId)
  const paymentsByBill = await fetchPaymentsForBillIds(bills.map((b) => b.id))
  return bills.map((bill) =>
    toBillBalanceRow(bill, paymentsByBill.get(bill.id) ?? []),
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

  return computeOutstandingBreakdown(
    rows,
    current?.bill.id ?? null,
    accountCredit,
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
  const [rows, accountCredit, credits] = await Promise.all([
    fetchBillBalanceRows(propertyId),
    fetchPropertyCreditBalance(propertyId),
    fetchCredits(propertyId),
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
  const overdueAmount = roundMoney(
    overdueRows.reduce((sum, row) => sum + row.balance, 0),
  )
  const collectionPercent =
    billed > 0 ? roundMoney((collected / billed) * 100) : 0

  const nextDue =
    unpaid
      .filter((row) => row.bill.dueDate)
      .sort((a, b) =>
        (a.bill.dueDate ?? '').localeCompare(b.bill.dueDate ?? ''),
      )[0]?.bill.dueDate ?? null

  // Credits created but not yet applied (wallet) — do not double-count used credits
  void credits

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
    overdueDays: outstandingBreakdown.overdueDays,
    unpaidBills: unpaid.sort((a, b) =>
      b.bill.billingMonth.localeCompare(a.bill.billingMonth),
    ),
    collected,
    overdueAmount,
    overdueBillCount: overdueRows.length,
    collectionPercent,
    creditsOutstanding: accountCredit,
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
  options?: { fromDate?: string | null; toDate?: string | null },
): Promise<{
  entries: LedgerEntry[]
  openingBalance: number
  closingBalance: number
}> {
  const [bills, credits] = await Promise.all([
    fetchPayableBills(propertyId),
    fetchCredits(propertyId),
  ])
  const paymentsByBillId = await fetchPaymentsForBillIds(bills.map((b) => b.id))
  const allEntries = buildCustomerLedger({ bills, paymentsByBillId, credits })
  const openingBalance = ledgerOpeningBalance(allEntries, options?.fromDate)
  const entries = filterLedgerByDateRange(
    allEntries,
    options?.fromDate,
    options?.toDate,
  )
  const closingBalance =
    entries.length > 0
      ? entries[entries.length - 1].runningBalance
      : openingBalance

  return { entries, openingBalance, closingBalance }
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
