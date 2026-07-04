import { calculateBill } from '@/lib/calculations'
import {
  getSupabaseErrorMessage,
  METER_READINGS_BUCKET,
  supabase,
} from '@/lib/supabase'
import type { Bill, BillStatus } from '@/types'
import type { BillInsert } from '@/types/database'
import { mapBill } from '@/utils/mappers'
import { fetchBillingConfiguration } from '@/services/propertyService'

export async function fetchLatestPublishedBill(
  propertyId: string,
): Promise<Bill | null> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'published')
    .order('billing_month', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapBill(data) : null
}

export async function fetchBillHistory(
  propertyId: string,
): Promise<Bill[]> {
  const { data, error } = await supabase
    .from('bills')
    .select('*')
    .eq('property_id', propertyId)
    .in('status', ['published', 'archived'])
    .order('billing_month', { ascending: false })

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
    .eq('status', 'published')
    .order('billing_month', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapBill)
}

export async function fetchRecentUploads(limit = 10): Promise<Bill[]> {
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

function toBillingMonth(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export async function uploadMeterReading(input: {
  propertyId: string
  file: File
  billingMonth?: string
}): Promise<Bill> {
  const billingMonth = input.billingMonth ?? toBillingMonth()
  const extension = input.file.name.split('.').pop() ?? 'pdf'
  const objectPath = `${input.propertyId}/${billingMonth}/${crypto.randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from(METER_READINGS_BUCKET)
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
    await supabase.storage.from(METER_READINGS_BUCKET).remove([objectPath])
    throw new Error(getSupabaseErrorMessage(error))
  }

  return mapBill(data)
}

export async function applyCalculationsToBill(
  billId: string,
  readings: {
    generation: number
    exportKwh: number
    importKwh: number
    securityDeposit?: number
    arrears?: number
  },
): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')

  const config = await fetchBillingConfiguration(bill.propertyId)
  if (!config) throw new Error('Billing configuration not found')

  const result = calculateBill({
    generation: readings.generation,
    exportKwh: readings.exportKwh,
    importKwh: readings.importKwh,
    rate: config.rate,
    discountPercent: config.discountPercent,
    fixedCharge: config.fixedCharge,
    securityDeposit: readings.securityDeposit,
    arrears: readings.arrears,
  })

  const { data, error } = await supabase
    .from('bills')
    .update({
      generation: readings.generation,
      export_kwh: readings.exportKwh,
      import_kwh: readings.importKwh,
      consumption: result.consumption,
      energy_charge: result.energyCharge,
      discount_amount: result.discountAmount,
      fixed_charge: result.fixedCharge,
      tenant_total: result.tenantTotal,
      security_deposit: result.securityDeposit,
      arrears: result.arrears,
      rate: result.rate,
      discount_percent: result.discountPercent,
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapBill(data)
}

export async function publishBill(billId: string): Promise<Bill> {
  const bill = await fetchBillById(billId)
  if (!bill) throw new Error('Bill not found')
  if (bill.tenantTotal === null) {
    throw new Error('Bill must be calculated before publishing')
  }

  const { data, error } = await supabase
    .from('bills')
    .update({
      status: 'published' satisfies BillStatus,
      published_at: new Date().toISOString(),
    })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapBill(data)
}

export async function archiveBill(billId: string): Promise<Bill> {
  const { data, error } = await supabase
    .from('bills')
    .update({ status: 'archived' satisfies BillStatus })
    .eq('id', billId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapBill(data)
}
