import { getBillAmountDue, roundMoney } from '@/lib/credits'
import { computePaymentSummary, formatBillStatus } from '@/lib/payments'
import type { Bill, BillStatus, CustomerCredit, Payment } from '@/types'

/** Bills that can still hold an outstanding balance. */
export const UNPAID_STATUSES: BillStatus[] = [
  'published',
  'payment_pending_verification',
  'partially_paid',
]

export const DEFAULT_CRITICAL_OVERDUE_DAYS = 30

export type OverdueStage = 'pending' | 'overdue' | 'critical'

export type AccountDisplayStatus =
  | 'Paid'
  | 'Unpaid'
  | 'Partially Paid'
  | 'Overdue'
  | 'Critical'
  | 'Pending Verification'
  | 'Draft'
  | 'Archived'

export type CollectionStatus =
  | 'Current'
  | 'Pending'
  | 'Overdue'
  | 'Critical'
  | 'Clear'

export interface BillBalanceRow {
  bill: Bill
  payments: Payment[]
  billAmount: number
  creditApplied: number
  finalAmount: number
  totalPaid: number
  balance: number
  isOverdue: boolean
  isCritical: boolean
  overdueDays: number
  overdueStage: OverdueStage
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
  isCritical: boolean
  overdueDays: number
  overdueStage: OverdueStage
  currentBillId: string | null
  accountCredit: number
  collectionStatus: CollectionStatus
  lastPaymentAmount: number | null
  pendingBills: number
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
  isCritical: boolean
  overdueDays: number
  overdueStage: OverdueStage
  unpaidBills: BillBalanceRow[]
  collected: number
  overdueAmount: number
  overdueBillCount: number
  criticalAmount: number
  criticalBillCount: number
  collectionPercent: number
  creditsOutstanding: number
  collectionStatus: CollectionStatus
  averagePaymentDelayDays: number
}

export type LedgerTransactionType =
  | 'bill_published'
  | 'payment'
  | 'credit'
  | 'credit_applied'
  | 'adjustment'
  | 'manual_credit'
  | 'carry_forward'
  | 'reminder'
  | 'bill_closed'

export interface AccountAdjustment {
  id: string
  propertyId: string
  billId: string | null
  amount: number
  reason: string
  notes: string | null
  createdAt: string
  createdBy: string | null
}

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
  reference?: string | null
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

export function getOverdueStage(
  dueDate: string | null | undefined,
  balance: number,
  criticalDays = DEFAULT_CRITICAL_OVERDUE_DAYS,
  asOf = todayIsoDate(),
): OverdueStage {
  if (balance <= 0) return 'pending'
  const days = getOverdueDays(dueDate, asOf)
  if (days <= 0) return 'pending'
  if (days >= criticalDays) return 'critical'
  return 'overdue'
}

export function isBillOverdue(
  dueDate: string | null | undefined,
  balance: number,
  asOf = todayIsoDate(),
): boolean {
  return getOverdueStage(dueDate, balance, DEFAULT_CRITICAL_OVERDUE_DAYS, asOf) !==
    'pending'
}

export function getAccountDisplayStatus(
  bill: Bill,
  balance: number,
  asOf = todayIsoDate(),
  criticalDays = DEFAULT_CRITICAL_OVERDUE_DAYS,
): AccountDisplayStatus {
  if (bill.status === 'draft') return 'Draft'
  if (bill.status === 'archived') return 'Archived'
  if (balance <= 0) return 'Paid'
  const stage = getOverdueStage(bill.dueDate, balance, criticalDays, asOf)
  if (stage === 'critical') return 'Critical'
  if (stage === 'overdue') return 'Overdue'
  if (bill.status === 'payment_pending_verification') {
    return 'Pending Verification'
  }
  if (
    bill.status === 'partially_paid' ||
    (bill.status !== 'paid' && balance < getBillAmountDue(bill))
  ) {
    return 'Partially Paid'
  }
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

export function toCollectionStatus(
  unpaid: BillBalanceRow[],
  outstanding: number,
): CollectionStatus {
  if (outstanding <= 0) return 'Clear'
  if (unpaid.some((row) => row.overdueStage === 'critical')) return 'Critical'
  if (unpaid.some((row) => row.overdueStage === 'overdue')) return 'Overdue'
  if (unpaid.length > 0) return 'Pending'
  return 'Current'
}

export function toBillBalanceRow(
  bill: Bill,
  payments: Payment[],
  asOf = todayIsoDate(),
  criticalDays = DEFAULT_CRITICAL_OVERDUE_DAYS,
): BillBalanceRow {
  const summary = computePaymentSummary(bill, payments)
  const overdueDays =
    summary.balance > 0 ? getOverdueDays(bill.dueDate, asOf) : 0
  const overdueStage = getOverdueStage(
    bill.dueDate,
    summary.balance,
    criticalDays,
    asOf,
  )
  return {
    bill,
    payments,
    billAmount: summary.billAmount,
    creditApplied: summary.creditApplied,
    finalAmount: summary.finalAmount,
    totalPaid: summary.totalPaid,
    balance: summary.balance,
    isOverdue: overdueStage !== 'pending',
    isCritical: overdueStage === 'critical',
    overdueDays,
    overdueStage,
    displayStatus: getAccountDisplayStatus(
      bill,
      summary.balance,
      asOf,
      criticalDays,
    ),
  }
}

export function computeOutstandingBreakdown(
  rows: BillBalanceRow[],
  currentBillId: string | null,
  accountCredit = 0,
  lastPaymentAmount: number | null = null,
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
  const overdueDays =
    unpaid.length > 0 ? Math.max(...unpaid.map((row) => row.overdueDays)) : 0
  const overdueStage =
    unpaid.find((row) => row.overdueStage === 'critical')?.overdueStage ??
    unpaid.find((row) => row.overdueStage === 'overdue')?.overdueStage ??
    'pending'

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
    isOverdue: overdueStage !== 'pending',
    isCritical: overdueStage === 'critical',
    overdueDays,
    overdueStage,
    currentBillId: current?.bill.id ?? null,
    accountCredit,
    collectionStatus: toCollectionStatus(unpaid, totalOutstanding),
    lastPaymentAmount,
    pendingBills: unpaid.length,
  }
}

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

  if (remaining > 0) {
    const target = unpaidOldestFirst[unpaidOldestFirst.length - 1] ?? null
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
  adjustments?: AccountAdjustment[]
}): LedgerEntry[] {
  const events: Array<Omit<LedgerEntry, 'runningBalance'>> = []

  const billsAsc = [...input.bills].sort((a, b) =>
    a.billingMonth.localeCompare(b.billingMonth),
  )

  for (const bill of billsAsc) {
    if (bill.status === 'draft' || !bill.publishedAt) continue

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
        reference: bill.invoiceNumber ?? bill.id.slice(0, 8),
      })
    }

    if ((bill.creditApplied ?? 0) > 0) {
      events.push({
        id: `bill-credit-${bill.id}`,
        date: (bill.publishedAt ?? bill.createdAt).slice(0, 10),
        description: `Credit Applied · ${bill.billingMonth.slice(0, 7)}`,
        type: 'credit_applied',
        debit: 0,
        credit: roundMoney(bill.creditApplied),
        billId: bill.id,
        referenceId: bill.id,
        reference: bill.invoiceNumber,
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
        reference: payment.reference,
      })
    }

    if (bill.isLocked && bill.lockedAt) {
      events.push({
        id: `closed-${bill.id}`,
        date: bill.lockedAt.slice(0, 10),
        description: `Bill Closed · ${bill.billingMonth.slice(0, 7)}`,
        type: 'bill_closed',
        debit: 0,
        credit: 0,
        billId: bill.id,
        referenceId: bill.id,
        reference: bill.invoiceNumber,
      })
    }
  }

  for (const credit of input.credits) {
    if (credit.status === 'cancelled') continue
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
      reference: credit.id.slice(0, 8),
    })
  }

  for (const adjustment of input.adjustments ?? []) {
    const isDebit = adjustment.amount > 0
    events.push({
      id: `adj-${adjustment.id}`,
      date: adjustment.createdAt.slice(0, 10),
      description: `Adjustment · ${adjustment.reason}`,
      type: 'adjustment',
      debit: isDebit ? roundMoney(adjustment.amount) : 0,
      credit: isDebit ? 0 : roundMoney(Math.abs(adjustment.amount)),
      billId: adjustment.billId,
      referenceId: adjustment.id,
      reference: adjustment.id.slice(0, 8),
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

export function filterLedgerEntries(
  entries: LedgerEntry[],
  options?: {
    fromDate?: string | null
    toDate?: string | null
    types?: LedgerTransactionType[] | null
    search?: string | null
  },
): LedgerEntry[] {
  const search = options?.search?.trim().toLowerCase() ?? ''
  return entries.filter((entry) => {
    if (options?.fromDate && entry.date < options.fromDate.slice(0, 10)) {
      return false
    }
    if (options?.toDate && entry.date > options.toDate.slice(0, 10)) {
      return false
    }
    if (options?.types && options.types.length > 0) {
      if (!options.types.includes(entry.type)) return false
    }
    if (search) {
      const hay = `${entry.description} ${entry.reference ?? ''} ${entry.type}`.toLowerCase()
      if (!hay.includes(search)) return false
    }
    return true
  })
}

export function filterLedgerByDateRange(
  entries: LedgerEntry[],
  fromDate?: string | null,
  toDate?: string | null,
): LedgerEntry[] {
  return filterLedgerEntries(entries, { fromDate, toDate })
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

export function computeAveragePaymentDelayDays(
  rows: BillBalanceRow[],
): number {
  const delays: number[] = []
  for (const row of rows) {
    if (!row.bill.dueDate || row.payments.length === 0) continue
    for (const payment of row.payments) {
      const due = new Date(`${row.bill.dueDate.slice(0, 10)}T00:00:00`).getTime()
      const paid = new Date(`${payment.paymentDate.slice(0, 10)}T00:00:00`).getTime()
      delays.push(Math.max(0, Math.floor((paid - due) / 86_400_000)))
    }
  }
  if (delays.length === 0) return 0
  return roundMoney(delays.reduce((sum, d) => sum + d, 0) / delays.length)
}
