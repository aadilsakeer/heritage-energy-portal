import {
  fetchCustomerLedger,
  fetchPropertyAccount,
  fetchUnpaidBillRows,
} from '@/services/accountService'
import { fetchCreditsForProperty } from '@/services/creditService'
import { generateStatementPdf } from '@/services/statementService'
import type { Property } from '@/types'
import { formatMonthLabel } from '@/utils/format'
import { downloadCsv, downloadExcel, downloadJson } from '@/utils/exportDownload'

export type ReportFormat = 'csv' | 'excel' | 'pdf' | 'json'

export async function exportOutstandingReport(
  property: Property,
  format: ReportFormat,
): Promise<void> {
  const rows = await fetchUnpaidBillRows(property.id)
  const headers = [
    'Month',
    'Original Amount',
    'Paid',
    'Remaining',
    'Days Overdue',
    'Status',
  ]
  const data = rows.map((row) => [
    formatMonthLabel(row.bill.billingMonth),
    row.finalAmount,
    row.totalPaid,
    row.balance,
    row.overdueDays,
    row.displayStatus,
  ])

  if (format === 'pdf') {
    await generateStatementPdf(property)
    return
  }
  if (format === 'json') {
    downloadJson(`outstanding-${property.slug}.json`, { property, rows: data })
    return
  }
  if (format === 'excel') {
    downloadExcel(`outstanding-${property.slug}.xls`, headers, data)
    return
  }
  downloadCsv(`outstanding-${property.slug}.csv`, headers, data)
}

export async function exportCollectionReport(
  property: Property,
  format: ReportFormat,
): Promise<void> {
  const account = await fetchPropertyAccount(property.id)
  const headers = [
    'Property',
    'Outstanding',
    'Collected',
    'Collection %',
    'Pending Bills',
    'Overdue',
    'Critical',
    'Credits',
    'Avg Payment Delay (days)',
  ]
  const data = [
    [
      property.label,
      account.outstanding,
      account.collected,
      account.collectionPercent,
      account.pendingBills,
      account.overdueAmount,
      account.criticalAmount,
      account.creditsOutstanding,
      account.averagePaymentDelayDays,
    ],
  ]

  if (format === 'json') {
    downloadJson(`collection-${property.slug}.json`, { property, account })
    return
  }
  if (format === 'excel') {
    downloadExcel(`collection-${property.slug}.xls`, headers, data)
    return
  }
  if (format === 'pdf') {
    await generateStatementPdf(property)
    return
  }
  downloadCsv(`collection-${property.slug}.csv`, headers, data)
}

export async function exportLedgerReport(
  property: Property,
  format: ReportFormat,
  range?: { fromDate?: string; toDate?: string },
): Promise<void> {
  const ledger = await fetchCustomerLedger(property.id, range)
  const headers = [
    'Date',
    'Description',
    'Type',
    'Debit',
    'Credit',
    'Balance',
    'Reference',
  ]
  const data = ledger.entries.map((entry) => [
    entry.date,
    entry.description,
    entry.type,
    entry.debit,
    entry.credit,
    entry.runningBalance,
    entry.reference ?? '',
  ])

  if (format === 'pdf') {
    await generateStatementPdf(property, range)
    return
  }
  if (format === 'json') {
    downloadJson(`ledger-${property.slug}.json`, ledger)
    return
  }
  if (format === 'excel') {
    downloadExcel(`ledger-${property.slug}.xls`, headers, data)
    return
  }
  downloadCsv(`ledger-${property.slug}.csv`, headers, data)
}

export async function exportCreditReport(
  property: Property,
  format: ReportFormat,
): Promise<void> {
  const credits = await fetchCreditsForProperty(property.id)
  const headers = [
    'Date',
    'Reason',
    'Amount',
    'Remaining',
    'Status',
    'Bill Id',
  ]
  const data = credits.map((credit) => [
    credit.createdAt.slice(0, 10),
    credit.reason,
    credit.amount,
    credit.remainingAmount,
    credit.status,
    credit.billId ?? '',
  ])

  if (format === 'json') {
    downloadJson(`credits-${property.slug}.json`, { property, credits })
    return
  }
  if (format === 'excel') {
    downloadExcel(`credits-${property.slug}.xls`, headers, data)
    return
  }
  if (format === 'pdf') {
    await generateStatementPdf(property)
    return
  }
  downloadCsv(`credits-${property.slug}.csv`, headers, data)
}

export async function exportMonthlyReport(
  property: Property,
  yearMonth: string,
  format: ReportFormat,
): Promise<void> {
  const fromDate = `${yearMonth.slice(0, 7)}-01`
  const [y, m] = yearMonth.slice(0, 7).split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const toDate = `${yearMonth.slice(0, 7)}-${String(lastDay).padStart(2, '0')}`
  await exportLedgerReport(property, format, { fromDate, toDate })
}

export async function exportYearlyReport(
  property: Property,
  year: number,
  format: ReportFormat,
): Promise<void> {
  await exportLedgerReport(property, format, {
    fromDate: `${year}-01-01`,
    toDate: `${year}-12-31`,
  })
}
