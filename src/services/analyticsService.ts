import { buildCreditAnalytics } from '@/lib/credits'
import { fetchCreditsForProperty } from '@/services/creditService'
import { fetchPropertyAccount } from '@/services/accountService'
import type {
  AnalyticsData,
  AnalyticsSummary,
  Bill,
  MonthlyMetric,
  SavingsSummary,
} from '@/types'
import type { LedgerEntry } from '@/lib/account'
import { formatEnergy, formatMonthShort, formatPercent } from '@/utils/format'
import { fetchPublishedBills } from '@/services/billService'

function toMetric(bill: Bill, value: number): MonthlyMetric {
  return {
    month: formatMonthShort(bill.billingMonth),
    value,
  }
}

function buildSummary(
  bills: Bill[],
  creditStats: ReturnType<typeof buildCreditAnalytics>,
  account?: Awaited<ReturnType<typeof fetchPropertyAccount>> | null,
): AnalyticsSummary {
  const totals = bills.map((bill) => bill.tenantTotal ?? 0)
  const consumptions = bills.map((bill) => bill.consumption ?? 0)
  const savings = bills.map((bill) => bill.discountAmount ?? 0)
  const generation = bills.map((bill) => bill.generation ?? 0)

  const average = (values: number[]) =>
    values.length === 0
      ? 0
      : Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) /
        100

  return {
    highestBill: totals.length ? Math.max(...totals) : 0,
    lowestBill: totals.length ? Math.min(...totals) : 0,
    averageBill: average(totals),
    averageConsumption: average(consumptions),
    lifetimeSavings: savings.reduce((sum, value) => sum + value, 0),
    lifetimeSolarGeneration: generation.reduce((sum, value) => sum + value, 0),
    outstandingCredits: creditStats.outstandingCredits,
    creditsUsed: creditStats.creditsUsed,
    totalCreditsGiven: creditStats.totalCreditsGiven,
    accountOutstanding: account?.outstanding ?? 0,
    pendingBills: account?.pendingBills ?? 0,
    lastPaymentAmount: account?.lastPayment?.amount ?? null,
    nextDue: account?.nextDue ?? null,
  }
}

export async function fetchAnalytics(propertyId: string): Promise<AnalyticsData> {
  const [bills, credits, account] = await Promise.all([
    fetchPublishedBills(propertyId),
    fetchCreditsForProperty(propertyId),
    fetchPropertyAccount(propertyId),
  ])
  const creditStats = buildCreditAnalytics(credits)

  return {
    monthlyBills: bills.map((bill) => toMetric(bill, bill.tenantTotal ?? 0)),
    monthlySavings: bills.map((bill) =>
      toMetric(bill, bill.discountAmount ?? 0),
    ),
    solarGeneration: bills.map((bill) =>
      toMetric(bill, bill.generation ?? 0),
    ),
    consumption: bills.map((bill) => toMetric(bill, bill.consumption ?? 0)),
    summary: buildSummary(bills, creditStats, account),
  }
}

export function buildSavingsSummary(
  bills: Bill[],
  latest?: Bill | null,
): SavingsSummary {
  const published = bills.filter((bill) => bill.status === 'published')
  const lifetimeSavings = published.reduce(
    (sum, bill) => sum + (bill.discountAmount ?? 0),
    0,
  )

  return {
    savedThisMonth: latest?.discountAmount ?? 0,
    lifetimeSavings,
    currency: '₹',
  }
}

export function buildQuickStats(bill: Bill | null) {
  if (!bill) return []

  const generation = bill.generation ?? 0
  const consumption = bill.consumption ?? 0
  const exportKwh = bill.exportKwh ?? 0
  const efficiency =
    generation > 0
      ? formatPercent((consumption / generation) * 100)
      : '—'

  return [
    {
      id: 'generation',
      label: 'Solar Generated',
      value: formatEnergy(generation),
    },
    {
      id: 'consumption',
      label: 'Consumed',
      value: formatEnergy(consumption),
    },
    {
      id: 'export',
      label: 'Exported',
      value: formatEnergy(exportKwh),
    },
    {
      id: 'efficiency',
      label: 'Self-use',
      value: efficiency,
    },
  ]
}

/** Display-only trend series for admin dashboard charts. */
export function buildAdminTrendCharts(
  bills: Bill[],
  entries: LedgerEntry[],
): {
  collectionTrend: MonthlyMetric[]
  outstandingTrend: MonthlyMetric[]
  paymentTrend: MonthlyMetric[]
  solarSavings: MonthlyMetric[]
} {
  const published = bills
    .filter((bill) => bill.status !== 'draft')
    .slice()
    .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth))

  const paymentByMonth = new Map<string, number>()
  for (const entry of entries) {
    if (entry.type !== 'payment') continue
    const key = entry.date.slice(0, 7)
    paymentByMonth.set(key, (paymentByMonth.get(key) ?? 0) + entry.credit)
  }

  const monthKeys = [
    ...new Set([
      ...published.map((bill) => bill.billingMonth.slice(0, 7)),
      ...paymentByMonth.keys(),
    ]),
  ].sort()

  let cumBilled = 0
  let cumPaid = 0
  const collectionTrend: MonthlyMetric[] = []
  const outstandingTrend: MonthlyMetric[] = []
  const paymentTrend: MonthlyMetric[] = []
  const solarSavings: MonthlyMetric[] = []

  for (const ym of monthKeys) {
    const bill = published.find((item) => item.billingMonth.startsWith(ym))
    const billed = bill?.tenantTotal ?? 0
    const paid = paymentByMonth.get(ym) ?? 0
    cumBilled += billed
    cumPaid += paid
    const labelDate = `${ym}-01`
    collectionTrend.push({
      month: formatMonthShort(labelDate),
      value:
        cumBilled > 0
          ? Math.round((cumPaid / cumBilled) * 1000) / 10
          : 0,
    })
    outstandingTrend.push({
      month: formatMonthShort(labelDate),
      value: Math.max(0, Math.round((cumBilled - cumPaid) * 100) / 100),
    })
    paymentTrend.push({
      month: formatMonthShort(labelDate),
      value: Math.round(paid * 100) / 100,
    })
    solarSavings.push({
      month: formatMonthShort(labelDate),
      value: Math.round((bill?.discountAmount ?? 0) * 100) / 100,
    })
  }

  return { collectionTrend, outstandingTrend, paymentTrend, solarSavings }
}
