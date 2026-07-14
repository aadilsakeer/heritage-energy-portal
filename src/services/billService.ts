import { calculateBill } from '@/lib/calculations'
import type { ExtractionResult, ReviewFormValues } from '@/lib/extractionSchema'
import { assertAllowedUpload } from '@/lib/validation'
import {
  getSupabaseErrorMessage,
  KSEB_BILLS_BUCKET,
  supabase,
} from '@/lib/supabase'

import { logBillEvent } from '@/services/eventService'
import { fetchBillingConfiguration } from '@/services/propertyService'
import type { Bill, BillStatus } from '@/types'
import type { BillInsert, Json } from '@/types/database'
import { PAYABLE_STATUSES } from '@/lib/payments'
import { applyCreditsOnPublish } from '@/services/creditService'
import {
  billingMonthFromDate,
  mapBill,
  storagePath,
} from '@/utils/mappers'
import { formatMonthLabel } from '@/utils/format'

export async function fetchLatestPublishedBill(
  propertyId: string,
): Promise<Bill | null> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('property_id', propertyId)
    .in('status', PAYABLE_STATUSES)
    .order('billing_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapBill(data) : null
}

export async function fetchBillHistory(
  propertyId?: string | null,
): Promise<Bill[]> {
  let query = supabase
    .from('bills')
    .select('*')
    .in('status', [...PAYABLE_STATUSES, 'archived'])
    .order('billing_month', { ascending: false })

  if (propertyId) query = query.eq('property_id', propertyId)

  const { data, error } = await query
  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapBill)
}

export async function fetchPublishedBills(
  propertyId: string,
): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('property_id', propertyId)
    .in('status', PAYABLE_STATUSES)
    .order('billing_month', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapBill)
}

export async function fetchRecentUploads(limit = 20): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .not('pdf_path', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapBill)
}

export async function fetchBillById(billId: string): Promise<Bill | null> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('id', billId)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapBill(data) : null
}

export async function uploadMeterReading(input: {
  propertyId: string
  file: File
  billingMonth?: string
}): Promise<Bill> {
  assertAllowedUpload(input.file)
  const billingMonth = input.billingMonth ?? billingMonthFromDate(null)
  const objectPath = storagePath(
    input.propertyId,
    billingMonth,
    input.file.name,
  )

  const { error: uploadError } = await supabase.storage
    .from(KSEB_BILLS_BUCKET)
    .upload(objectPath, input.file, {
      cacheControl: '3600',
      upsert: false,
      contentType: input.file.type || 'application/pdf',
    })

  if (uploadError) throw new Error(getSupabaseErrorMessage(uploadError))

  const payload: BillInsert = {
    property_id: input.propertyId,
    billing_month: billingMonth,
    status: 'draft',
    pdf_path: objectPath,
    pdf_file_name: input.file.name,
  }

  const { data, error } = await supabase
    .from('bills')
    .insert(payload)
    .select('*')
    .single()

  if (error) {
    await supabase.storage.from(KSEB_BILLS_BUCKET).remove([objectPath])
    throw new Error(getSupabaseErrorMessage(error))
  }

  const bill = mapBill(data)
  await logBillEvent(bill.id, 'pdf_uploaded', {
    fileName: input.file.name,
    path: objectPath,
  })
  return bill
}

export async function saveAiExtraction(
  billId: string,
  extraction: ExtractionResult,
): Promise<Bill> {
  const billingMonth = billingMonthFromDate(extraction.bill_date)

  const { data, error } = await supabase
    .from('bills')
    .update({
      billing_month: billingMonth,
      generation: extraction.generation,
      import_kwh: extraction.import_units,
      export_kwh: extraction.export_units,
      fixed_charge: extraction.fixed_charge,
      security_deposit: extraction.security_deposit ?? 0,
      arrears: extraction.arrears ?? 0,
      bill_date: extraction.bill_date,
      due_date: extraction.due_date,
      consumer_number: extraction.consumer_number,
      ai_json: extraction as Json,
      validated_json: extraction as Json,
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  await logBillEvent(billId, 'ai_completed', extraction as Json)
  return mapBill(data)
}

export function recalculateFromForm(
  values: ReviewFormValues,
  rate: number,
  discountPercent: number,
) {
  return calculateBill({
    generation: values.generation,
    exportKwh: values.export_units,
    importKwh: values.import_units,
    rate,
    discountPercent,
    fixedCharge: values.fixed_charge,
    securityDeposit: values.security_deposit,
    arrears: values.arrears,
  })
}

export async function saveReviewedBill(
  billId: string,
  values: ReviewFormValues,
  options?: { eventType?: 'edited' },
): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.isLocked) {
    throw new Error(
      'This bill is locked for monthly closing. Reopen it before editing.',
    )
  }

  const config = await fetchBillingConfiguration(bill.propertyId)
  if (!config) throw new Error('Billing configuration not found')

  const result = recalculateFromForm(
    values,
    config.rate,
    config.discountPercent,
  )

  const validated: ExtractionResult = {
    generation: values.generation,
    import_units: values.import_units,
    export_units: values.export_units,
    fixed_charge: values.fixed_charge,
    security_deposit: values.security_deposit,
    arrears: values.arrears,
    bill_date: values.bill_date,
    due_date: values.due_date,
    consumer_number: values.consumer_number,
  }

  const { data, error } = await supabase
    .from('bills')
    .update({
      billing_month: billingMonthFromDate(values.bill_date),
      generation: values.generation,
      import_kwh: values.import_units,
      export_kwh: values.export_units,
      consumption: result.consumption,
      energy_charge: result.energyCharge,
      discount_amount: result.discountAmount,
      fixed_charge: result.fixedCharge,
      tenant_total: result.tenantTotal,
      security_deposit: result.securityDeposit,
      arrears: result.arrears,
      rate: result.rate,
      discount_percent: result.discountPercent,
      bill_date: values.bill_date,
      due_date: values.due_date,
      consumer_number: values.consumer_number,
      validated_json: validated as Json,
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  await logBillEvent(billId, options?.eventType ?? 'edited', validated as Json)
  return mapBill(data)
}

export async function publishBill(billId: string): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.tenantTotal === null) {
    throw new Error('Bill must be calculated before publishing')
  }

  const wasPublished = PAYABLE_STATUSES.includes(bill.status)
  const invoiceNumber =
    bill.invoiceNumber ??
    `HS-${bill.billingMonth.slice(0, 7).replace('-', '')}-${bill.id.slice(0, 8).toUpperCase()}`

  if (!wasPublished) {
    const { error: archiveError } = await supabase
      .from('bills')
      .update({ status: 'archived' satisfies BillStatus })
      .eq('property_id', bill.propertyId)
      .eq('billing_month', bill.billingMonth)
      .in('status', PAYABLE_STATUSES)
      .neq('id', billId)

    if (archiveError) throw new Error(getSupabaseErrorMessage(archiveError))
  }

  let creditApplied = bill.creditApplied ?? 0
  let amountPayable = bill.amountPayable ?? bill.tenantTotal ?? 0

  if (!wasPublished) {
    const applied = await applyCreditsOnPublish(bill)
    creditApplied = applied.creditApplied
    amountPayable = applied.amountPayable
  }

  const { data, error } = await supabase
    .from('bills')
    .update({
      status: 'published' satisfies BillStatus,
      published_at: new Date().toISOString(),
      invoice_number: invoiceNumber,
      credit_applied: creditApplied,
      amount_payable: amountPayable,
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  await logBillEvent(billId, wasPublished ? 'republished' : 'published', {
    invoiceNumber,
    creditApplied,
    amountPayable,
  })

  const published = mapBill(data)
  const { createNotification } = await import('@/services/notificationService')
  await createNotification({
    propertyId: published.propertyId,
    billId: published.id,
    type: 'bill_published',
    title: 'New bill published',
    message: `Your ${formatMonthLabel(published.billingMonth)} bill of ₹${(amountPayable ?? published.tenantTotal ?? 0).toFixed(2)} is now available.`,
  })

  if (creditApplied > 0) {
    await createNotification({
      propertyId: published.propertyId,
      billId: published.id,
      type: 'credit_applied',
      title: 'Credit applied to bill',
      message: `₹${creditApplied.toFixed(2)} account credit was applied to your new bill.`,
    })
  }

  return published
}

export async function archiveBill(billId: string): Promise<Bill> {
  const { data, error } = await supabase
    .from('bills')
    .update({ status: 'archived' satisfies BillStatus })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  await logBillEvent(billId, 'archived')
  return mapBill(data)
}

export async function duplicateBill(billId: string): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')

  const payload: BillInsert = {
    property_id: bill.propertyId,
    billing_month: bill.billingMonth,
    status: 'draft',
    generation: bill.generation,
    export_kwh: bill.exportKwh,
    import_kwh: bill.importKwh,
    consumption: bill.consumption,
    energy_charge: bill.energyCharge,
    discount_amount: bill.discountAmount,
    fixed_charge: bill.fixedCharge,
    tenant_total: bill.tenantTotal,
    security_deposit: bill.securityDeposit,
    arrears: bill.arrears,
    rate: bill.rate,
    discount_percent: bill.discountPercent,
    pdf_path: bill.pdfPath,
    pdf_file_name: bill.pdfFileName,
    due_date: bill.dueDate,
    bill_date: bill.billDate,
    consumer_number: bill.consumerNumber,
    ai_json: bill.aiJson as Json | null,
    validated_json: bill.validatedJson as Json | null,
  }

  const { data, error } = await supabase
    .from('bills')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  const created = mapBill(data)
  await logBillEvent(created.id, 'duplicated', { sourceBillId: billId })
  return created
}

export async function deleteDraftBill(billId: string): Promise<void> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.status !== 'draft') {
    throw new Error('Only draft bills can be deleted')
  }

  await logBillEvent(billId, 'deleted')

  if (bill.pdfPath) {
    await supabase.storage.from(KSEB_BILLS_BUCKET).remove([bill.pdfPath])
  }

  const { error } = await supabase.from('bills').delete().eq('id', billId)
  if (error) throw new Error(getSupabaseErrorMessage(error))
}
