import { fetchCustomerLedger, fetchUnpaidBillRows } from '@/services/accountService'
import { fetchBillHistory } from '@/services/billService'
import { fetchCreditsForProperty } from '@/services/creditService'
import { formatCurrency, formatInvoiceNumber, formatMonthLabel } from '@/utils/format'
import { supabase } from '@/lib/supabase'
import { mapPayment } from '@/utils/mappers'

export type SearchResultType =
  | 'bill'
  | 'payment'
  | 'credit'
  | 'timeline'
  | 'invoice'
  | 'consumer'

export interface SearchResult {
  id: string
  type: SearchResultType
  title: string
  subtitle: string
  href: string
}

export async function searchPropertyAccount(
  propertyId: string,
  query: string,
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const [bills, credits, ledger, unpaid] = await Promise.all([
    fetchBillHistory(propertyId),
    fetchCreditsForProperty(propertyId),
    fetchCustomerLedger(propertyId),
    fetchUnpaidBillRows(propertyId),
  ])

  const billIds = bills.map((bill) => bill.id)
  let payments = [] as ReturnType<typeof mapPayment>[]
  if (billIds.length > 0) {
    const { data } = await supabase.from('payments').select('*').in('bill_id', billIds)
    payments = (data ?? []).map(mapPayment)
  }

  const results: SearchResult[] = []

  for (const bill of bills) {
    const invoice = formatInvoiceNumber(bill)
    const month = formatMonthLabel(bill.billingMonth)
    const hay = `${month} ${bill.status} ${bill.consumerNumber ?? ''} ${invoice}`.toLowerCase()
    if (hay.includes(q)) {
      results.push({
        id: `bill-${bill.id}`,
        type: 'bill',
        title: month,
        subtitle: `${bill.status.replace(/_/g, ' ')} · ${formatCurrency(bill.amountPayable ?? bill.tenantTotal ?? 0)}`,
        href: `/bill/${bill.id}`,
      })
    }
    if (invoice.toLowerCase().includes(q)) {
      results.push({
        id: `invoice-${bill.id}`,
        type: 'invoice',
        title: invoice,
        subtitle: `Invoice · ${month}`,
        href: `/bill/${bill.id}`,
      })
    }
    if ((bill.consumerNumber ?? '').toLowerCase().includes(q)) {
      results.push({
        id: `consumer-${bill.id}`,
        type: 'consumer',
        title: bill.consumerNumber ?? '',
        subtitle: `Consumer · ${month}`,
        href: `/bill/${bill.id}`,
      })
    }
  }

  for (const payment of payments) {
    const hay = `${payment.amount} ${payment.reference ?? ''} ${payment.paymentMethod} ${payment.paymentDate}`.toLowerCase()
    if (!hay.includes(q)) continue
    results.push({
      id: `pay-${payment.id}`,
      type: 'payment',
      title: formatCurrency(payment.amount),
      subtitle: `${payment.paymentDate} · ${payment.paymentMethod.replace(/_/g, ' ')}`,
      href: `/account`,
    })
  }

  for (const credit of credits) {
    const hay = `${credit.reason} ${credit.amount} ${credit.status}`.toLowerCase()
    if (!hay.includes(q)) continue
    results.push({
      id: `credit-${credit.id}`,
      type: 'credit',
      title: formatCurrency(credit.remainingAmount || credit.amount),
      subtitle: `${credit.reason} · ${credit.status}`,
      href: `/account`,
    })
  }

  for (const entry of ledger.entries) {
    const hay = `${entry.description} ${entry.reference ?? ''} ${entry.type}`.toLowerCase()
    if (!hay.includes(q)) continue
    results.push({
      id: `ledger-${entry.id}`,
      type: 'timeline',
      title: entry.description,
      subtitle: `${entry.date} · Bal ${formatCurrency(entry.runningBalance)}`,
      href: `/account`,
    })
  }

  void unpaid
  // De-dupe by id, limit
  const seen = new Set<string>()
  return results.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }).slice(0, 20)
}
