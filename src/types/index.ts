import type { BillEventType, BillStatus, Json } from '@/types/database'
import type { ExtractionResult } from '@/lib/extractionSchema'

export type { BillStatus, BillEventType, ExtractionResult }

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
  creditApplied: number
  amountPayable: number | null
  securityDeposit: number
  arrears: number
  rate: number | null
  discountPercent: number | null
  pdfPath: string | null
  pdfFileName: string | null
  dueDate: string | null
  billDate: string | null
  consumerNumber: string | null
  invoiceNumber: string | null
  aiJson: ExtractionResult | null
  validatedJson: ExtractionResult | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BillEvent {
  id: string
  billId: string
  eventType: BillEventType
  metadata: Json
  createdAt: string
}

export interface Payment {
  id: string
  billId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  reference: string | null
  notes: string | null
  createdAt: string
}

export interface CustomerCredit {
  id: string
  propertyId: string
  billId: string | null
  amount: number
  reason: string
  remainingAmount: number
  createdAt: string
  appliedAt: string | null
  status: 'active' | 'used' | 'cancelled'
}

export interface CurrentBill {
  id: string
  month: string
  amountDue: number
  dueDate: string
  status: BillStatus
  currency: string
  propertyLabel?: string
  billAmount: number
  totalPaid: number
  balance: number
  paymentPercentage: number
  accountCredit: number
  creditApplied: number
  finalAmount: number
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
  propertyId: string
  propertyLabel?: string
  creditApplied: number
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

export interface AnalyticsSummary {
  highestBill: number
  lowestBill: number
  averageBill: number
  averageConsumption: number
  lifetimeSavings: number
  lifetimeSolarGeneration: number
  outstandingCredits: number
  creditsUsed: number
  totalCreditsGiven: number
}

export interface AnalyticsData {
  monthlyBills: MonthlyMetric[]
  monthlySavings: MonthlyMetric[]
  solarGeneration: MonthlyMetric[]
  consumption: MonthlyMetric[]
  summary: AnalyticsSummary
}
