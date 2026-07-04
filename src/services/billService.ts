import type { BillBreakdown, CurrentBill, HistoryItem } from '@/types'
import {
  BILL_BREAKDOWN,
  CURRENT_BILL,
  HISTORY_ITEMS,
} from '@/constants'

export async function getCurrentBill(): Promise<CurrentBill> {
  return CURRENT_BILL
}

export async function getBillBreakdown(): Promise<BillBreakdown> {
  return BILL_BREAKDOWN
}

export async function getBillHistory(): Promise<HistoryItem[]> {
  return HISTORY_ITEMS
}
