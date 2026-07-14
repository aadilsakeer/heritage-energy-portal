import { APP_NAME, BRAND } from '@/constants'
import type { Json } from '@/types/database'
import { getSupabaseErrorMessage, supabase } from '@/lib/supabase'

export interface PortalSettings {
  companyName: string
  logoPath: string
  dueDays: number
  criticalOverdueDays: number
  reminderDaysBefore: number
  reminderDueToday: boolean
  reminderDaysOverdue: number[]
  retentionDays: number
  themeDefault: 'system' | 'light' | 'dark'
}

export const DEFAULT_PORTAL_SETTINGS: PortalSettings = {
  companyName: APP_NAME,
  logoPath: BRAND.logo,
  dueDays: 15,
  criticalOverdueDays: 30,
  reminderDaysBefore: 3,
  reminderDueToday: true,
  reminderDaysOverdue: [7, 30],
  retentionDays: 3650,
  themeDefault: 'system',
}

function asSettings(value: Json | null | undefined): PortalSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_PORTAL_SETTINGS }
  }
  const raw = value as Record<string, unknown>
  return {
    companyName:
      typeof raw.companyName === 'string'
        ? raw.companyName
        : DEFAULT_PORTAL_SETTINGS.companyName,
    logoPath:
      typeof raw.logoPath === 'string'
        ? raw.logoPath
        : DEFAULT_PORTAL_SETTINGS.logoPath,
    dueDays:
      typeof raw.dueDays === 'number'
        ? raw.dueDays
        : DEFAULT_PORTAL_SETTINGS.dueDays,
    criticalOverdueDays:
      typeof raw.criticalOverdueDays === 'number'
        ? raw.criticalOverdueDays
        : DEFAULT_PORTAL_SETTINGS.criticalOverdueDays,
    reminderDaysBefore:
      typeof raw.reminderDaysBefore === 'number'
        ? raw.reminderDaysBefore
        : DEFAULT_PORTAL_SETTINGS.reminderDaysBefore,
    reminderDueToday:
      typeof raw.reminderDueToday === 'boolean'
        ? raw.reminderDueToday
        : DEFAULT_PORTAL_SETTINGS.reminderDueToday,
    reminderDaysOverdue: Array.isArray(raw.reminderDaysOverdue)
      ? raw.reminderDaysOverdue.filter(
          (item): item is number => typeof item === 'number',
        )
      : DEFAULT_PORTAL_SETTINGS.reminderDaysOverdue,
    retentionDays:
      typeof raw.retentionDays === 'number'
        ? raw.retentionDays
        : DEFAULT_PORTAL_SETTINGS.retentionDays,
    themeDefault:
      raw.themeDefault === 'light' ||
      raw.themeDefault === 'dark' ||
      raw.themeDefault === 'system'
        ? raw.themeDefault
        : DEFAULT_PORTAL_SETTINGS.themeDefault,
  }
}

export async function fetchPortalSettings(): Promise<PortalSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'portal')
    .maybeSingle()

  if (error) {
    if (error.code === '42P01' || error.message.includes('app_settings')) {
      return { ...DEFAULT_PORTAL_SETTINGS }
    }
    throw new Error(getSupabaseErrorMessage(error))
  }

  return asSettings(data?.value ?? null)
}

export async function savePortalSettings(
  settings: PortalSettings,
): Promise<PortalSettings> {
  const payload = {
    key: 'portal',
    value: settings as unknown as Json,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('app_settings')
    .upsert(payload)
    .select('value')
    .single()

  if (error) throw new Error(getSupabaseErrorMessage(error))

  const { logAuditEvent } = await import('@/services/auditService')
  await logAuditEvent({
    entityType: 'settings',
    entityId: 'portal',
    action: 'settings_updated',
    actor: 'admin',
    metadata: { companyName: settings.companyName },
  })

  return asSettings(data.value)
}
