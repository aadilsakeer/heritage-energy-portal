import {
  CREDIT_REASONS,
  getActiveCreditBalance,
  roundMoney,
  type CreditStatus,
} from '@/lib/credits'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import { fetchBillById } from '@/services/billService'
import { logBillEvent } from '@/services/eventService'
import type { Bill, CustomerCredit } from '@/types'
import type {
  CustomerCreditInsert,
  CustomerCreditRow,
  CustomerCreditUpdate,
} from '@/types/database'
import { mapCustomerCredit } from '@/utils/mappers'

export async function fetchCreditsForProperty(
  propertyId: string,
): Promise<CustomerCredit[]> {
  const { data, error } = await supabase
    .from('customer_credits')
    .select('*')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapCustomerCredit)
}

export async function fetchActiveCreditsForProperty(
  propertyId: string,
): Promise<CustomerCredit[]> {
  const { data, error } = await supabase
    .from('customer_credits')
    .select('*')
    .eq('property_id', propertyId)
    .eq('status', 'active')
    .gt('remaining_amount', 0)
    .order('created_at', { ascending: true })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapCustomerCredit)
}

export async function fetchCreditsForBill(
  billId: string,
): Promise<CustomerCredit[]> {
  const { data, error } = await supabase
    .from('customer_credits')
    .select('*')
    .eq('bill_id', billId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return (data ?? []).map(mapCustomerCredit)
}

export async function fetchPropertyCreditBalance(
  propertyId: string,
): Promise<number> {
  const credits = await fetchActiveCreditsForProperty(propertyId)
  return getActiveCreditBalance(credits)
}

export async function applyCreditsOnPublish(
  bill: Bill,
): Promise<{ creditApplied: number; amountPayable: number }> {
  const tenantTotal = bill.tenantTotal ?? 0
  const activeCredits = await fetchActiveCreditsForProperty(bill.propertyId)

  let remainingBill = tenantTotal
  let totalApplied = 0

  for (const credit of activeCredits) {
    if (remainingBill <= 0) break

    const applyAmount = roundMoney(
      Math.min(credit.remainingAmount, remainingBill),
    )
    if (applyAmount <= 0) continue

    const newRemaining = roundMoney(credit.remainingAmount - applyAmount)
    const nextStatus: CreditStatus = newRemaining <= 0 ? 'used' : 'active'

    const updatePayload: CustomerCreditUpdate = {
      remaining_amount: newRemaining,
      status: nextStatus,
      applied_at:
        nextStatus === 'used' ? new Date().toISOString() : credit.appliedAt,
    }

    const { error } = await supabase
      .from('customer_credits')
      .update(updatePayload)
      .eq('id', credit.id)

    if (error) throw new Error(getSupabaseErrorMessage(error))

    await logBillEvent(bill.id, 'credit_applied', {
      creditId: credit.id,
      amount: applyAmount,
      reason: credit.reason,
    })

    totalApplied = roundMoney(totalApplied + applyAmount)
    remainingBill = roundMoney(remainingBill - applyAmount)
  }

  return {
    creditApplied: totalApplied,
    amountPayable: roundMoney(tenantTotal - totalApplied),
  }
}

async function insertCredit(
  payload: CustomerCreditInsert,
  eventType: 'credit_created' | 'manual_credit_added',
  auditBillId: string,
): Promise<CustomerCredit> {
  const { data, error } = await supabase
    .from('customer_credits')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const credit = mapCustomerCredit(data)
  await logBillEvent(auditBillId, eventType, {
    creditId: credit.id,
    amount: credit.amount,
    reason: credit.reason,
  })
  return credit
}

export async function createOverpaymentCredit(
  bill: Bill,
  overpaymentAmount: number,
): Promise<CustomerCredit | null> {
  if (overpaymentAmount <= 0) return null

  const existing = await fetchOverpaymentCreditForBill(bill.id)
  const amount = roundMoney(overpaymentAmount)

  if (existing) {
    if (
      existing.status === 'active' &&
      existing.remainingAmount === existing.amount
    ) {
      const { data, error } = await supabase
        .from('customer_credits')
        .update({
          amount,
          remaining_amount: amount,
        })
        .eq('id', existing.id)
        .select('*')
        .single()

      if (error) throw new Error(getSupabaseErrorMessage(error))
      return mapCustomerCredit(data)
    }
    return existing
  }

  return insertCredit(
    {
      property_id: bill.propertyId,
      bill_id: bill.id,
      amount,
      remaining_amount: amount,
      reason: CREDIT_REASONS.overpayment,
      status: 'active',
    },
    'credit_created',
    bill.id,
  )
}

export async function syncOverpaymentCredit(billId: string): Promise<void> {
  const bill = await fetchBillById(billId)
  if (!bill || bill.tenantTotal === null) return
  if (bill.status === 'draft' || bill.status === 'archived') return

  const { fetchPayments } = await import('@/services/paymentService')
  const { getBillAmountDue } = await import('@/lib/credits')
  const payments = await fetchPayments(billId)
  const billAmountDue = getBillAmountDue(bill)
  const totalPaid = roundMoney(
    payments.reduce((sum, payment) => sum + payment.amount, 0),
  )
  const overpayment = roundMoney(Math.max(0, totalPaid - billAmountDue))

  const existing = await fetchOverpaymentCreditForBill(billId)

  if (overpayment <= 0) {
    if (existing?.status === 'active') {
      await cancelCredit(existing.id, billId)
    }
    return
  }

  await createOverpaymentCredit(bill, overpayment)
}

export async function createManualCredit(input: {
  propertyId: string
  amount: number
  reason: string
  auditBillId: string
}): Promise<CustomerCredit> {
  const amount = roundMoney(input.amount)
  if (amount <= 0) throw new Error('Credit amount must be greater than zero')

  return insertCredit(
    {
      property_id: input.propertyId,
      bill_id: null,
      amount,
      remaining_amount: amount,
      reason: input.reason.trim() || CREDIT_REASONS.manual,
      status: 'active',
    },
    'manual_credit_added',
    input.auditBillId,
  )
}

export async function cancelCredit(
  creditId: string,
  auditBillId: string,
): Promise<CustomerCredit> {
  const { data, error } = await supabase
    .from('customer_credits')
    .update({
      status: 'cancelled',
      remaining_amount: 0,
    })
    .eq('id', creditId)
    .select('*')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const credit = mapCustomerCredit(data)
  await logBillEvent(auditBillId, 'credit_cancelled', {
    creditId: credit.id,
    amount: credit.amount,
    reason: credit.reason,
  })
  return credit
}

async function fetchOverpaymentCreditForBill(
  billId: string,
): Promise<CustomerCredit | null> {
  const { data, error } = await supabase
    .from('customer_credits')
    .select('*')
    .eq('bill_id', billId)
    .eq('reason', CREDIT_REASONS.overpayment)
    .neq('status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(getSupabaseErrorMessage(error))
  return data ? mapCustomerCredit(data as CustomerCreditRow) : null
}
