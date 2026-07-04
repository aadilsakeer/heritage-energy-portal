import type { ExtractionResult } from '@/lib/extractionSchema'
import { computePaymentSummary, type PaymentSummary } from '@/lib/payments'
import type {
  Bill,
  BillBreakdown,
  BillEvent,
  BillingConfiguration,
  CurrentBill,
  HistoryItem,
  Payment,
  Property,
  UploadItem,
} from '@/types'
import type {
  BillEventRow,
  BillRow,
  BillingConfigRow,
  Json,
  PaymentRow,
  PropertyRow,
} from '@/types/database'
import { formatMonthLabel } from '@/utils/format'

function asExtraction(value: Json | null): ExtractionResult | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as ExtractionResult
}

export function mapProperty(row: PropertyRow): Property {
  return {
    id: row.id,
    slug: row.slug,
    label: row.name,
    shortLabel: row.short_name,
  }
}

export function mapBillingConfig(row: BillingConfigRow): BillingConfiguration {
  return {
    id: row.id,
    propertyId: row.property_id,
    rate: Number(row.rate),
    discountPercent: Number(row.discount_percent),
    fixedCharge: Number(row.fixed_charge),
    effectiveFrom: row.effective_from,
  }
}

export function mapBill(row: BillRow): Bill {
  return {
    id: row.id,
    propertyId: row.property_id,
    billingMonth: row.billing_month,
    status: row.status,
    generation: row.generation === null ? null : Number(row.generation),
    exportKwh: row.export_kwh === null ? null : Number(row.export_kwh),
    importKwh: row.import_kwh === null ? null : Number(row.import_kwh),
    consumption: row.consumption === null ? null : Number(row.consumption),
    energyCharge: row.energy_charge === null ? null : Number(row.energy_charge),
    discountAmount:
      row.discount_amount === null ? null : Number(row.discount_amount),
    fixedCharge: row.fixed_charge === null ? null : Number(row.fixed_charge),
    tenantTotal: row.tenant_total === null ? null : Number(row.tenant_total),
    securityDeposit: Number(row.security_deposit),
    arrears: Number(row.arrears),
    rate: row.rate === null ? null : Number(row.rate),
    discountPercent:
      row.discount_percent === null ? null : Number(row.discount_percent),
    pdfPath: row.pdf_path,
    pdfFileName: row.pdf_file_name,
    dueDate: row.due_date,
    billDate: row.bill_date,
    consumerNumber: row.consumer_number,
    invoiceNumber: row.invoice_number,
    aiJson: asExtraction(row.ai_json),
    validatedJson: asExtraction(row.validated_json),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapBillEvent(row: BillEventRow): BillEvent {
  return {
    id: row.id,
    billId: row.bill_id,
    eventType: row.event_type,
    metadata: row.metadata,
    createdAt: row.created_at,
  }
}

export function mapPayment(row: PaymentRow): Payment {
  return {
    id: row.id,
    billId: row.bill_id,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method,
    reference: row.reference,
    notes: row.notes,
    createdAt: row.created_at,
  }
}

export function toCurrentBill(
  bill: Bill,
  propertyLabel?: string,
  paymentSummary?: PaymentSummary,
): CurrentBill {
  const billAmount = bill.tenantTotal ?? 0
  const summary = paymentSummary ?? computePaymentSummary(billAmount, [])

  return {
    id: bill.id,
    month: formatMonthLabel(bill.billingMonth),
    amountDue: summary.balance,
    dueDate: bill.dueDate ?? bill.billingMonth,
    status: bill.status,
    currency: '₹',
    propertyLabel,
    billAmount: summary.billAmount,
    totalPaid: summary.totalPaid,
    balance: summary.balance,
    paymentPercentage: summary.paymentPercentage,
  }
}

export function toBillBreakdown(bill: Bill): BillBreakdown {
  return {
    generation: bill.generation ?? 0,
    gridImport: bill.importKwh ?? 0,
    export: bill.exportKwh ?? 0,
    consumption: bill.consumption ?? 0,
    energyCharge: bill.energyCharge ?? 0,
    discount: bill.discountAmount ?? 0,
    fixedCharge: bill.fixedCharge ?? 0,
    total: bill.tenantTotal ?? 0,
    securityDeposit: bill.securityDeposit,
    arrears: bill.arrears,
    currency: '₹',
    unit: 'kWh',
  }
}

export function toHistoryItem(
  bill: Bill,
  propertyLabel?: string,
): HistoryItem {
  return {
    id: bill.id,
    month: formatMonthLabel(bill.billingMonth),
    status: bill.status,
    amount: bill.tenantTotal ?? 0,
    currency: '₹',
    propertyId: bill.propertyId,
    propertyLabel,
  }
}

export function toUploadItem(bill: Bill): UploadItem {
  return {
    id: bill.id,
    fileName: bill.pdfFileName ?? 'Untitled upload',
    uploadedAt: bill.createdAt,
    status: bill.status,
    propertyId: bill.propertyId,
  }
}

export function billingMonthFromDate(dateString: string | null): string {
  if (!dateString) {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  }
  const [year, month] = dateString.slice(0, 10).split('-')
  return `${year}-${month}-01`
}

export function storagePath(
  propertyId: string,
  billingMonth: string,
  fileName: string,
): string {
  const [year, month] = billingMonth.slice(0, 10).split('-')
  const extension = fileName.split('.').pop() ?? 'pdf'
  return `${propertyId}/${year}/${month}/${crypto.randomUUID()}.${extension}`
}
