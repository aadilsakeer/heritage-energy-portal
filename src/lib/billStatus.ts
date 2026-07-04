import type { BillStatus } from '@/types'

export const billStatusVariant: Record<
  BillStatus,
  'success' | 'warning' | 'outline' | 'accent' | 'default'
> = {
  draft: 'outline',
  published: 'default',
  payment_pending_verification: 'warning',
  partially_paid: 'accent',
  paid: 'success',
  archived: 'outline',
}

export const billStatusColorClass: Record<BillStatus, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  payment_pending_verification:
    'bg-orange-500/15 text-orange-700 dark:text-orange-300',
  partially_paid: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  paid: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  archived: 'bg-zinc-500/15 text-zinc-600 dark:text-zinc-400',
}
