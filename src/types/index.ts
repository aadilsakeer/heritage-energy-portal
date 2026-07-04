import type { BillStatus } from '@/types/database'

export type { BillStatus }

export interface Property {
  id: string
  slug: string
  label: string
  shortLabel: string
}

export interface BillingConfiguration {
  id: string
  propertyId: string
  rate: number
  discountPercent: number
  fixedCharge: number
  effectiveFrom: string
}

export interface Bill {
  id: string
  propertyId: string
  billingMonth: string
  status: BillStatus
  generation: number | null
  exportKwh: number | null
  importKwh: number | null
  consumption: number | null
  energyCharge: number | null
  discountAmount: number | null
  fixedCharge: number | null
  tenantTotal: number | null
  securityDeposit: number
  arrears: number
  rate: number | null
  discountPercent: number | null
  pdfPath: string | null
  pdfFileName: string | null
  dueDate: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CurrentBill {
  id: string
  month: string
  amountDue: number
  dueDate: string
  status: BillStatus
  currency: string
}

export interface SavingsSummary {
  savedThisMonth: number
  lifetimeSavings: number
  currency: string
}

export interface QuickStat {
  id: string
  label: string
  value: string
  trend?: string
  trendUp?: boolean
}

export interface BillBreakdown {
  generation: number
  gridImport: number
  export: number
  consumption: number
  energyCharge: number
  discount: number
  fixedCharge: number
  total: number
  securityDeposit: number
  arrears: number
  currency: string
  unit: string
}

export interface HistoryItem {
  id: string
  month: string
  status: BillStatus
  amount: number
  currency: string
}

export interface MonthlyMetric {
  month: string
  value: number
}

export interface UploadItem {
  id: string
  fileName: string
  uploadedAt: string
  status: BillStatus
  propertyId: string
}

export interface AnalyticsData {
  monthlyBills: MonthlyMetric[]
  monthlySavings: MonthlyMetric[]
  solarGeneration: MonthlyMetric[]
  consumption: MonthlyMetric[]
}

export interface AsyncState<T> {
  data: T
  isLoading: boolean
  error: string | null
}
