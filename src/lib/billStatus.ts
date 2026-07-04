import type { BillStatus } from '@/types'

export const billStatusVariant: Record<
  BillStatus,
  'success' | 'warning' | 'outline' | 'accent' | 'default'
> = {
  published: 'success',
  partially_paid: 'warning',
  paid: 'accent',
  draft: 'warning',
  archived: 'outline',
}
