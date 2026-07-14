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
  if (
    !Number.isFinite(input.rate) ||
    input.rate < 0 ||
    !Number.isFinite(input.discountPercent) ||
    input.discountPercent < 0 ||
    input.discountPercent > 100 ||
    !Number.isFinite(input.fixedCharge) ||
    input.fixedCharge < 0
  ) {
    throw new Error('Billing rate, discount, and fixed charge must be valid numbers')
  }

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
  const normalized = consumerNumber?.replace(/\D/g, '') || null
  if (normalized && normalized.length > 32) {
    throw new Error('Consumer number is too long')
  }

  const { data, error } = await supabase
    .from('properties')
    .update({
      consumer_number: normalized,
    })
    .eq('id', propertyId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return mapProperty(data)
}
