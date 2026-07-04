import type {
  BillBreakdown,
  CurrentBill,
  HistoryItem,
  MonthlyMetric,
  QuickStat,
  SavingsSummary,
  UploadItem,
} from '@/types'

export const APP_NAME = 'Heritage Solar'

export const ROUTES = {
  home: '/',
  bill: '/bill',
  history: '/history',
  analytics: '/analytics',
  admin: '/admin',
} as const

export const CURRENT_BILL: CurrentBill = {
  month: 'June 2026',
  amountDue: 2840,
  dueDate: '2026-07-15',
  status: 'published',
  currency: '₹',
}

export const SAVINGS: SavingsSummary = {
  solarSavings: 4120,
  energySavings: 1860,
  currency: '₹',
}

export const QUICK_STATS: QuickStat[] = [
  {
    id: 'generation',
    label: 'Solar Generated',
    value: '428 kWh',
    trend: '+12%',
    trendUp: true,
  },
  {
    id: 'consumption',
    label: 'Consumed',
    value: '312 kWh',
    trend: '-4%',
    trendUp: false,
  },
  {
    id: 'export',
    label: 'Exported',
    value: '116 kWh',
    trend: '+18%',
    trendUp: true,
  },
  {
    id: 'efficiency',
    label: 'Efficiency',
    value: '94.2%',
    trend: '+2%',
    trendUp: true,
  },
]

export const BILL_BREAKDOWN: BillBreakdown = {
  generation: 428,
  gridImport: 94,
  export: 116,
  consumption: 312,
  energyCharge: 3120,
  discount: 820,
  fixedCharge: 540,
  total: 2840,
  currency: '₹',
  unit: 'kWh',
}

export const HISTORY_ITEMS: HistoryItem[] = [
  {
    id: '1',
    month: 'June 2026',
    status: 'published',
    amount: 2840,
    currency: '₹',
  },
  {
    id: '2',
    month: 'May 2026',
    status: 'published',
    amount: 3120,
    currency: '₹',
  },
  {
    id: '3',
    month: 'April 2026',
    status: 'published',
    amount: 2680,
    currency: '₹',
  },
  {
    id: '4',
    month: 'March 2026',
    status: 'published',
    amount: 3450,
    currency: '₹',
  },
  {
    id: '5',
    month: 'February 2026',
    status: 'published',
    amount: 2980,
    currency: '₹',
  },
  {
    id: '6',
    month: 'January 2026',
    status: 'published',
    amount: 3210,
    currency: '₹',
  },
]

export const MONTHLY_BILLS: MonthlyMetric[] = [
  { month: 'Jan', value: 3210 },
  { month: 'Feb', value: 2980 },
  { month: 'Mar', value: 3450 },
  { month: 'Apr', value: 2680 },
  { month: 'May', value: 3120 },
  { month: 'Jun', value: 2840 },
]

export const MONTHLY_CONSUMPTION: MonthlyMetric[] = [
  { month: 'Jan', value: 340 },
  { month: 'Feb', value: 318 },
  { month: 'Mar', value: 365 },
  { month: 'Apr', value: 298 },
  { month: 'May', value: 332 },
  { month: 'Jun', value: 312 },
]

export const MONTHLY_SAVINGS: MonthlyMetric[] = [
  { month: 'Jan', value: 3800 },
  { month: 'Feb', value: 4100 },
  { month: 'Mar', value: 3650 },
  { month: 'Apr', value: 4520 },
  { month: 'May', value: 3980 },
  { month: 'Jun', value: 4120 },
]

export const SOLAR_GENERATION: MonthlyMetric[] = [
  { month: 'Jan', value: 390 },
  { month: 'Feb', value: 410 },
  { month: 'Mar', value: 445 },
  { month: 'Apr', value: 480 },
  { month: 'May', value: 455 },
  { month: 'Jun', value: 428 },
]

export const RECENT_UPLOADS: UploadItem[] = [
  {
    id: '1',
    fileName: 'meter_reading_june_2026.pdf',
    uploadedAt: '2026-07-01T10:24:00Z',
    status: 'processed',
  },
  {
    id: '2',
    fileName: 'meter_reading_may_2026.pdf',
    uploadedAt: '2026-06-02T09:12:00Z',
    status: 'processed',
  },
  {
    id: '3',
    fileName: 'meter_reading_april_2026.pdf',
    uploadedAt: '2026-05-03T14:45:00Z',
    status: 'processed',
  },
]
