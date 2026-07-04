import type {
  Bill,
  BillBreakdown,
  BillingConfiguration,
  CurrentBill,
  HistoryItem,
  Property,
  UploadItem,
} from '@/types'
import type { BillRow, BillingConfigRow, PropertyRow } from '@/types/database'
import { formatMonthLabel } from '@/utils/format'

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
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function toCurrentBill(bill: Bill): CurrentBill {
  return {
    id: bill.id,
    month: formatMonthLabel(bill.billingMonth),
    amountDue: bill.tenantTotal ?? 0,
    dueDate: bill.dueDate ?? bill.billingMonth,
    status: bill.status,
    currency: '₹',
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

export function toHistoryItem(bill: Bill): HistoryItem {
  return {
    id: bill.id,
    month: formatMonthLabel(bill.billingMonth),
    status: bill.status,
    amount: bill.tenantTotal ?? 0,
    currency: '₹',
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
