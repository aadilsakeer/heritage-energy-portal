import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'
import type { Database } from '@/types/database'

export const supabase = createClient<Database>(
  env.supabaseUrl,
  env.supabaseAnonKey,
)

/** KSEB bill originals (PDF / PNG / JPEG) */
export const KSEB_BILLS_BUCKET = 'kseb-bills'

export function getSupabaseErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}
