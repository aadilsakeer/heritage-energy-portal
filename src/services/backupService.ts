import { fetchCustomerLedger, fetchPropertyAccount } from '@/services/accountService'
import { fetchBillHistory } from '@/services/billService'
import { fetchCreditsForProperty } from '@/services/creditService'
import { fetchAuditEvents } from '@/services/auditService'
import { fetchReminderHistory } from '@/services/reminderService'
import { fetchAdjustmentsForProperty } from '@/services/accountService'
import type { Property } from '@/types'
import { downloadCsv, downloadJson } from '@/utils/exportDownload'
import { supabase } from '@/lib/supabase'
import { mapPayment } from '@/utils/mappers'

export async function exportPropertyBackup(
  property: Property,
  format: 'json' | 'csv' = 'json',
): Promise<void> {
  const [account, bills, credits, ledger, adjustments, reminders, audits] =
    await Promise.all([
      fetchPropertyAccount(property.id),
      fetchBillHistory(property.id),
      fetchCreditsForProperty(property.id),
      fetchCustomerLedger(property.id),
      fetchAdjustmentsForProperty(property.id),
      fetchReminderHistory(property.id),
      fetchAuditEvents({ propertyId: property.id, limit: 500 }),
    ])

  const billIds = bills.map((bill) => bill.id)
  let payments = [] as ReturnType<typeof mapPayment>[]
  if (billIds.length > 0) {
    const { data } = await supabase.from('payments').select('*').in('bill_id', billIds)
    payments = (data ?? []).map(mapPayment)
  }

  const payload = {
    exportedAt: new Date().toISOString(),
    property,
    account: {
      outstanding: account.outstanding,
      collected: account.collected,
      credits: account.credits,
      pendingBills: account.pendingBills,
      collectionStatus: account.collectionStatus,
    },
    bills,
    payments,
    credits,
    adjustments,
    ledger: ledger.entries,
    reminders,
    audits,
  }

  if (format === 'json') {
    downloadJson(`backup-${property.slug}.json`, payload)
    return
  }

  downloadCsv(
    `backup-bills-${property.slug}.csv`,
    ['id', 'month', 'status', 'tenantTotal', 'amountPayable', 'dueDate', 'locked'],
    bills.map((bill) => [
      bill.id,
      bill.billingMonth,
      bill.status,
      bill.tenantTotal,
      bill.amountPayable,
      bill.dueDate,
      bill.isLocked,
    ]),
  )
  downloadCsv(
    `backup-payments-${property.slug}.csv`,
    ['id', 'billId', 'amount', 'date', 'method', 'reference'],
    payments.map((payment) => [
      payment.id,
      payment.billId,
      payment.amount,
      payment.paymentDate,
      payment.paymentMethod,
      payment.reference,
    ]),
  )
  downloadCsv(
    `backup-ledger-${property.slug}.csv`,
    ['date', 'description', 'debit', 'credit', 'balance', 'type'],
    ledger.entries.map((entry) => [
      entry.date,
      entry.description,
      entry.debit,
      entry.credit,
      entry.runningBalance,
      entry.type,
    ]),
  )
}
