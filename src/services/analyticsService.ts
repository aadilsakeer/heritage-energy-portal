import type { AnalyticsData, Bill, MonthlyMetric, SavingsSummary } from '@/types'
import { formatMonthShort } from '@/utils/format'
import { fetchPublishedBills } from '@/services/billService'

function toMetric(bill: Bill, value: number): MonthlyMetric {
  return {
    month: formatMonthShort(bill.billingMonth),
    value,
  }
}

export async function fetchAnalytics(propertyId: string): Promise<AnalyticsData> {
  const bills = await fetchPublishedBills(propertyId)

  return {
    monthlyBills: bills.map((bill) =>
      toMetric(bill, bill.tenantTotal ?? 0),
    ),
    monthlySavings: bills.map((bill) =>
      toMetric(bill, bill.discountAmount ?? 0),
    ),
    solarGeneration: bills.map((bill) =>
      toMetric(bill, bill.generation ?? 0),
    ),
    consumption: bills.map((bill) =>
      toMetric(bill, bill.consumption ?? 0),
    ),
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
      ? `${((consumption / generation) * 100).toFixed(1)}%`
      : '—'

  return [
    {
      id: 'generation',
      label: 'Solar Generated',
      value: `${generation.toLocaleString('en-IN')} kWh`,
    },
    {
      id: 'consumption',
      label: 'Consumed',
      value: `${consumption.toLocaleString('en-IN')} kWh`,
    },
    {
      id: 'export',
      label: 'Exported',
      value: `${exportKwh.toLocaleString('en-IN')} kWh`,
    },
    {
      id: 'efficiency',
      label: 'Self-use',
      value: efficiency,
    },
  ]
}
