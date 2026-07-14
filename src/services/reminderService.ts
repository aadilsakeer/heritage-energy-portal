import {
  getOverdueDays,
  todayIsoDate,
  type BillBalanceRow,
} from '@/lib/account'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'
import { fetchBillBalanceRows } from '@/services/accountService'
import { fetchPortalSettings } from '@/services/settingsService'

export type ReminderStage =
  | 'before_due'
  | 'due_today'
  | 'overdue_7'
  | 'overdue_30'

export interface ReminderRecord {
  id: string
  propertyId: string
  billId: string | null
  stage: ReminderStage
  dueDate: string | null
  scheduledFor: string
  status: string
  message: string | null
  createdAt: string
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function buildMessage(
  stage: ReminderStage,
  row: BillBalanceRow,
): string {
  const month = row.bill.billingMonth.slice(0, 7)
  const amount = row.balance.toFixed(2)
  switch (stage) {
    case 'before_due':
      return `Reminder: bill ${month} of ₹${amount} is due soon.`
    case 'due_today':
      return `Reminder: bill ${month} of ₹${amount} is due today.`
    case 'overdue_7':
      return `Overdue: bill ${month} of ₹${amount} is 7+ days past due.`
    case 'overdue_30':
      return `Critical: bill ${month} of ₹${amount} is 30+ days past due.`
  }
}

/**
 * Prepare reminder history rows for a property.
 * Does not send notifications — status stays `prepared`.
 */
export async function prepareRemindersForProperty(
  propertyId: string,
): Promise<ReminderRecord[]> {
  const [rows, settings] = await Promise.all([
    fetchBillBalanceRows(propertyId),
    fetchPortalSettings(),
  ])
  const today = todayIsoDate()
  const unpaid = rows.filter((row) => row.balance > 0 && row.bill.dueDate)
  const prepared: ReminderRecord[] = []

  for (const row of unpaid) {
    const due = row.bill.dueDate!.slice(0, 10)
    const daysOverdue = getOverdueDays(due, today)
    const candidates: Array<{ stage: ReminderStage; scheduledFor: string }> =
      []

    if (settings.reminderDaysBefore > 0) {
      candidates.push({
        stage: 'before_due',
        scheduledFor: addDays(due, -settings.reminderDaysBefore),
      })
    }
    if (settings.reminderDueToday) {
      candidates.push({ stage: 'due_today', scheduledFor: due })
    }
    for (const overdueDay of settings.reminderDaysOverdue) {
      candidates.push({
        stage: overdueDay >= 30 ? 'overdue_30' : 'overdue_7',
        scheduledFor: addDays(due, overdueDay),
      })
    }

    for (const candidate of candidates) {
      if (candidate.scheduledFor > today) continue
      // Only prepare overdue_* when threshold reached
      if (
        candidate.stage === 'overdue_7' &&
        daysOverdue < 7
      ) {
        continue
      }
      if (candidate.stage === 'overdue_30' && daysOverdue < 30) continue

      const message = buildMessage(candidate.stage, row)
      const { data, error } = await supabase
        .from('reminder_history')
        .upsert(
          {
            property_id: propertyId,
            bill_id: row.bill.id,
            stage: candidate.stage,
            due_date: due,
            scheduled_for: candidate.scheduledFor,
            status: 'prepared',
            message,
            metadata: { balance: row.balance, daysOverdue },
          },
          { onConflict: 'property_id,bill_id,stage,scheduled_for' },
        )
        .select('*')
        .maybeSingle()

      if (error) {
        if (error.message.includes('reminder_history')) continue
        throw new Error(getSupabaseErrorMessage(error))
      }
      if (data) {
        prepared.push({
          id: data.id,
          propertyId: data.property_id,
          billId: data.bill_id,
          stage: data.stage as ReminderStage,
          dueDate: data.due_date,
          scheduledFor: data.scheduled_for,
          status: data.status,
          message: data.message,
          createdAt: data.created_at,
        })
      }
    }
  }

  return prepared
}

export async function fetchReminderHistory(
  propertyId: string,
): Promise<ReminderRecord[]> {
  const { data, error } = await supabase
    .from('reminder_history')
    .select('*')
    .eq('property_id', propertyId)
    .order('scheduled_for', { ascending: false })
    .limit(100)

  if (error) {
    if (error.message.includes('reminder_history')) return []
    throw new Error(getSupabaseErrorMessage(error))
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    propertyId: row.property_id,
    billId: row.bill_id,
    stage: row.stage as ReminderStage,
    dueDate: row.due_date,
    scheduledFor: row.scheduled_for,
    status: row.status,
    message: row.message,
    createdAt: row.created_at,
  }))
}
