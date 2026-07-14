import { getBillAmountDue, roundMoney } from '@/lib/credits'
import { computePaymentSummary, formatBillStatus } from '@/lib/payments'
import type { Bill, BillStatus, CustomerCredit, Payment } from '@/types'

/** Bills that can still hold an outstanding balance. */
export const UNPAID_STATUSES: BillStatus[] = [
  'published',
  'payment_pending_verification',
  'partially_paid',
]

export type AccountDisplayStatus =
  | 'Paid'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Overdue'
  | 'Pending Verification'
  | 'Draft'
  | 'Archived'

export interface BillBalanceRow {
  bill: Bill
  payments: Payment[]
  billAmount: number
  creditApplied: number
  finalAmount: number
  totalPaid: number
  balance: number
  isOverdue: boolean
  overdueDays: number
  displayStatus: AccountDisplayStatus
}

export interface OutstandingBreakdown {
  totalOutstanding: number
  currentBillAmount: number
  previousOutstanding: number
  creditApplied: number
  totalDue: number
  dueDate: string | null
  status: AccountDisplayStatus
  isOverdue: boolean
  overdueDays: number
  currentBillId: string | null
  accountCredit: number
}

export interface BillAccountSummary {
  openingBalance: number
  currentCharges: number
  credits: number
  payments: number
  closingBalance: number
}

export interface PropertyAccountSummary {
  currentBill: Bill | null
  outstanding: number
  paid: number
  credits: number
  balance: number
  pendingBills: number
  lastPayment: Payment | null
  nextDue: string | null
  previousOutstanding: number
  currentBillAmount: number
  creditApplied: number
  totalDue: number
  status: AccountDisplayStatus
  isOverdue: boolean
  overdueDays: number
  unpaidBills: BillBalanceRow[]
  collected: number
  overdueAmount: number
  overdueBillCount: number
  collectionPercent: number
  creditsOutstanding: number
}

export type LedgerTransactionType =
  | 'bill_published'
  | 'payment'
  | 'credit'
  | 'adjustment'
  | 'manual_credit'
  | 'carry_forward'

export interface LedgerEntry {
  id: string
  date: string
  description: string
  type: LedgerTransactionType
  debit: number
  credit: number
  runningBalance: number
  billId: string | null
  referenceId: string | null
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getOverdueDays(
  dueDate: string | null | undefined,
  asOf = todayIsoDate(),
): number {
  if (!dueDate) return 0
  const due = dueDate.slice(0, 10)
  if (due >= asOf) return 0
  const dueMs = new Date(`${due}T00:00:00`).getTime()
  const asOfMs = new Date(`${asOf}T00:00:00`).getTime()
  return Math.max(0, Math.floor((asOfMs - dueMs) / 86_400_000))
}

export function isBillOverdue(
  dueDate: string | null | undefined,
  balance: number,
  asOf = todayIsoDate(),
): boolean {
  if (balance <= 0 || !dueDate) return false
  return dueDate.slice(0, 10) < asOf
}

export function getAccountDisplayStatus(
  bill: Bill,
  balance: number,
  asOf = todayIsoDate(),
): AccountDisplayStatus {
  if (bill.status === 'draft') return 'Draft'
  if (bill.status === 'archived') return 'Archived'
  if (balance <= 0) return 'Paid'
  if (isBillOverdue(bill.dueDate, balance, asOf)) return 'Overdue'
  if (bill.status === 'payment_pending_verification') {
    return 'Pending Verification'
  }
  if (
    bill.status === 'partially_paid' ||
    (bill.status !== 'paid' && balance < getBillAmountDue(bill))
  ) {
    return 'Partially Paid'
  }
  if (bill.status === 'paid' && balance > 0) return 'Unpaid'
  return 'Unpaid'
}

export function formatAccountDisplayStatus(
  status: AccountDisplayStatus | BillStatus,
): string {
  if (
    status === 'draft' ||
    status === 'published' ||
    status === 'payment_pending_verification' ||
    status === 'partially_paid' ||
    status === 'paid' ||
    status === 'archived'
  ) {
    return formatBillStatus(status)
  }
  return status
}

export function toBillBalanceRow(
  bill: Bill,
  payments: Payment[],
  asOf = todayIsoDate(),
): BillBalanceRow {
  const summary = computePaymentSummary(bill, payments)
  const isOverdue = isBillOverdue(bill.dueDate, summary.balance, asOf)
  return {
    bill,
    payments,
    billAmount: summary.billAmount,
    creditApplied: summary.creditApplied,
    finalAmount: summary.finalAmount,
    totalPaid: summary.totalPaid,
    balance: summary.balance,
    isOverdue,
    overdueDays: isOverdue ? getOverdueDays(bill.dueDate, asOf) : 0,
    displayStatus: getAccountDisplayStatus(bill, summary.balance, asOf),
  }
}

export function computeOutstandingBreakdown(
  rows: BillBalanceRow[],
  currentBillId: string | null,
  accountCredit = 0,
): OutstandingBreakdown {
  const unpaid = rows.filter((row) => row.balance > 0)
  const current = currentBillId
    ? rows.find((row) => row.bill.id === currentBillId) ?? null
    : rows[rows.length - 1] ?? null

  const currentBalance = current?.balance ?? 0
  const previousOutstanding = roundMoney(
    unpaid
      .filter((row) => row.bill.id !== current?.bill.id)
      .reduce((sum, row) => sum + row.balance, 0),
  )
  const totalOutstanding = roundMoney(previousOutstanding + currentBalance)
  const creditApplied = current?.creditApplied ?? 0
  const currentBillAmount = current?.finalAmount ?? 0
  const totalDue = Math.max(0, roundMoney(totalOutstanding))

  return {
    totalOutstanding,
    currentBillAmount,
    previousOutstanding,
    creditApplied,
    totalDue,
    dueDate: current?.bill.dueDate ?? null,
    status:
      totalDue <= 0
        ? 'Paid'
        : current
          ? getAccountDisplayStatus(current.bill, totalDue)
          : 'Paid',
    isOverdue: (() => {
      if (totalDue <= 0) return false
      // Overdue if any unpaid portion is past due (prefer oldest due date)
      const overdueRow = unpaid.find((row) => row.isOverdue)
      if (overdueRow) return true
      return current
        ? isBillOverdue(current.bill.dueDate, totalDue)
        : false
    })(),
    overdueDays: (() => {
      const overdueRows = unpaid.filter((row) => row.isOverdue)
      if (overdueRows.length === 0) return 0
      return Math.max(...overdueRows.map((row) => row.overdueDays))
    })(),
    currentBillId: current?.bill.id ?? null,
    accountCredit,
  }
}

/**
 * Bill-level account lines.
 * Opening = carry-forward from older unpaid balances.
 * Closing = opening + charges − credits − payments.
 */
export function computeBillAccountSummary(
  bill: Bill,
  payments: Payment[],
  openingBalance: number,
): BillAccountSummary {
  const currentCharges = bill.tenantTotal ?? 0
  const credits = bill.creditApplied ?? 0
  const paymentTotal = roundMoney(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
  )
  const closingBalance = Math.max(
    0,
    roundMoney(openingBalance + currentCharges - credits - paymentTotal),
  )

  return {
    openingBalance: roundMoney(openingBalance),
    currentCharges: roundMoney(currentCharges),
    credits: roundMoney(credits),
    payments: paymentTotal,
    closingBalance,
  }
}

export interface FifoAllocationPlan {
  billId: string
  amount: number
  billingMonth: string
}

/**
 * Allocate a payment amount across unpaid bills oldest-first (FIFO).
 * Never applies to a newer bill while an older bill still has balance.
 */
export function planFifoAllocation(
  unpaidOldestFirst: BillBalanceRow[],
  amount: number,
): FifoAllocationPlan[] {
  let remaining = roundMoney(amount)
  const plans: FifoAllocationPlan[] = []

  for (const row of unpaidOldestFirst) {
    if (remaining <= 0) break
    if (row.balance <= 0) continue

    const apply = roundMoney(Math.min(row.balance, remaining))
    if (apply <= 0) continue

    plans.push({
      billId: row.bill.id,
      amount: apply,
      billingMonth: row.bill.billingMonth,
    })
    remaining = roundMoney(remaining - apply)
  }

  // Overpayment beyond all unpaid bills lands on the newest unpaid / latest bill
  if (remaining > 0) {
    const target =
      unpaidOldestFirst[unpaidOldestFirst.length - 1] ?? null
    if (target) {
      const last = plans[plans.length - 1]
      if (last && last.billId === target.bill.id) {
        last.amount = roundMoney(last.amount + remaining)
      } else {
        plans.push({
          billId: target.bill.id,
          amount: remaining,
          billingMonth: target.bill.billingMonth,
        })
      }
    }
  }

  return plans
}

export function buildCustomerLedger(input: {
  bills: Bill[]
  paymentsByBillId: Map<string, Payment[]>
  credits: CustomerCredit[]
}): LedgerEntry[] {
  const events: Array<Omit<LedgerEntry, 'runningBalance'>> = []

  const billsAsc = [...input.bills].sort((a, b) =>
    a.billingMonth.localeCompare(b.billingMonth),
  )

  for (const bill of billsAsc) {
    if (
      bill.status === 'draft' ||
      !bill.publishedAt
    ) {
      continue
    }

    const charges = bill.tenantTotal ?? 0
    if (charges > 0) {
      events.push({
        id: `bill-${bill.id}`,
        date: (bill.publishedAt ?? bill.billDate ?? bill.createdAt).slice(0, 10),
        description: `Bill Published · ${bill.billingMonth.slice(0, 7)}`,
        type: 'bill_published',
        debit: roundMoney(charges),
        credit: 0,
        billId: bill.id,
        referenceId: bill.id,
      })
    }

    if ((bill.creditApplied ?? 0) > 0) {
      events.push({
        id: `bill-credit-${bill.id}`,
        date: (bill.publishedAt ?? bill.createdAt).slice(0, 10),
        description: `Credit Applied · ${bill.billingMonth.slice(0, 7)}`,
        type: 'credit',
        debit: 0,
        credit: roundMoney(bill.creditApplied),
        billId: bill.id,
        referenceId: bill.id,
      })
    }

    const payments = input.paymentsByBillId.get(bill.id) ?? []
    for (const payment of payments) {
      events.push({
        id: `payment-${payment.id}`,
        date: payment.paymentDate,
        description: `Payment · ${payment.paymentMethod.replace(/_/g, ' ')}`,
        type: 'payment',
        debit: 0,
        credit: roundMoney(payment.amount),
        billId: bill.id,
        referenceId: payment.id,
      })
    }
  }

  for (const credit of input.credits) {
    if (credit.status === 'cancelled') continue
    // Overpayment is already reflected in the payment credit leg.
    // Applied bill credits appear via bill.creditApplied.
    if (credit.reason === 'Overpayment') continue
    if (credit.billId && credit.status === 'used') continue

    const isManual = credit.reason === 'Manual Credit'
    events.push({
      id: `wallet-credit-${credit.id}`,
      date: credit.createdAt.slice(0, 10),
      description: isManual
        ? `Manual Credit · ${credit.reason}`
        : `Credit · ${credit.reason}`,
      type: isManual ? 'manual_credit' : 'credit',
      debit: 0,
      credit: roundMoney(credit.amount),
      billId: credit.billId,
      referenceId: credit.id,
    })
  }

  events.sort((a, b) => {
    const byDate = a.date.localeCompare(b.date)
    if (byDate !== 0) return byDate
    return a.id.localeCompare(b.id)
  })

  let running = 0
  return events.map((event) => {
    running = roundMoney(running + event.debit - event.credit)
    return { ...event, runningBalance: Math.max(0, running) }
  })
}

export function filterLedgerByDateRange(
  entries: LedgerEntry[],
  fromDate?: string | null,
  toDate?: string | null,
): LedgerEntry[] {
  return entries.filter((entry) => {
    if (fromDate && entry.date < fromDate.slice(0, 10)) return false
    if (toDate && entry.date > toDate.slice(0, 10)) return false
    return true
  })
}

export function ledgerOpeningBalance(
  allEntries: LedgerEntry[],
  fromDate?: string | null,
): number {
  if (!fromDate) return 0
  const prior = allEntries.filter((entry) => entry.date < fromDate.slice(0, 10))
  if (prior.length === 0) return 0
  return prior[prior.length - 1]?.runningBalance ?? 0
}
