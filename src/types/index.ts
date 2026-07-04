export type BillStatus = 'published' | 'draft' | 'pending'

export type UploadStatus = 'processed' | 'pending' | 'failed'

export type PropertyId = 'home' | 'heritage'

export interface Property {
  id: PropertyId
  label: string
  shortLabel: string
}

export interface CurrentBill {
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
  status: UploadStatus
}

export interface PropertyData {
  bill: CurrentBill
  savings: SavingsSummary
  quickStats: QuickStat[]
  breakdown: BillBreakdown
  history: HistoryItem[]
  monthlyBills: MonthlyMetric[]
  monthlyConsumption: MonthlyMetric[]
  monthlySavings: MonthlyMetric[]
  solarGeneration: MonthlyMetric[]
}
