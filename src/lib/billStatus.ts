import type { BillStatus } from '@/types'

export const billStatusVariant: Record<
  BillStatus,
  'success' | 'warning' | 'outline' | 'accent' | 'default' | 'danger' | 'info'
> = {
  draft: 'outline',
  published: 'info',
  payment_pending_verification: 'warning',
  partially_paid: 'accent',
  paid: 'success',
  archived: 'outline',
}

export const billStatusColorClass: Record<BillStatus, string> = {
  draft: 'border-0 bg-muted text-muted-foreground',
  published: 'border-0 bg-blue-500/12 text-blue-700 dark:text-blue-300',
  payment_pending_verification:
    'border-0 bg-amber-500/12 text-amber-800 dark:text-amber-300',
  partially_paid: 'border-0 bg-orange-500/12 text-orange-800 dark:text-orange-300',
  paid: 'border-0 bg-emerald-500/12 text-emerald-800 dark:text-emerald-300',
  archived: 'border-0 bg-zinc-500/12 text-zinc-600 dark:text-zinc-400',
}
