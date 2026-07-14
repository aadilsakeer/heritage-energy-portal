import { supabase, getSupabaseErrorMessage } from '@/lib/supabase'
import type { BillingConfiguration, Property } from '@/types'
import { mapBillingConfig, mapProperty } from '@/utils/mappers'

export async function fetchPropertyByConsumerNumber(
  consumerNumber: string,
): Promise<Property | null> {
  const normalized = consumerNumber.replace(/\D/g, '')
  if (!normalized) return null

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('consumer_number', normalized)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapProperty(data) : null
}

export async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapProperty)
}

export async function fetchBillingConfiguration(
  propertyId: string,
): Promise<BillingConfiguration | null> {
  const { data, error } = await supabase
    .from('billing_configuration')
    .select('*')
    .eq('property_id', propertyId)
    .order('effective_from', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapBillingConfig(data) : null
}

export async function updateBillingConfiguration(
  propertyId: string,
  input: { rate: number; discountPercent: number; fixedCharge: number },
): Promise<BillingConfiguration> {
  const existing = await fetchBillingConfiguration(propertyId)
  if (!existing) {
    const { data, error } = await supabase
      .from('billing_configuration')
      .insert({
        property_id: propertyId,
        rate: input.rate,
        discount_percent: input.discountPercent,
        fixed_charge: input.fixedCharge,
        effective_from: new Date().toISOString().slice(0, 10),
      })
      .select('*')
      .single()
    if (error) throw new Error(getSupabaseErrorMessage(error))
    return mapBillingConfig(data)
  }

  const { data, error } = await supabase
    .from('billing_configuration')
    .update({
      rate: input.rate,
      discount_percent: input.discountPercent,
      fixed_charge: input.fixedCharge,
    })
    .eq('id', existing.id)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapBillingConfig(data)
}

export async function updatePropertyConsumerNumber(
  propertyId: string,
  consumerNumber: string | null,
): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .update({
      consumer_number: consumerNumber?.replace(/\D/g, '') || null,
    })
    .eq('id', propertyId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapProperty(data)
}
