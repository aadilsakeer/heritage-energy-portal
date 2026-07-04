import type {
  BillBreakdown,
  CurrentBill,
  HistoryItem,
  PropertyId,
} from '@/types'
import { PROPERTY_DATA } from '@/constants'

export async function getCurrentBill(
  propertyId: PropertyId = 'home',
): Promise<CurrentBill> {
  return PROPERTY_DATA[propertyId].bill
}

export async function getBillBreakdown(
  propertyId: PropertyId = 'home',
): Promise<BillBreakdown> {
  return PROPERTY_DATA[propertyId].breakdown
}

export async function getBillHistory(
  propertyId: PropertyId = 'home',
): Promise<HistoryItem[]> {
  return PROPERTY_DATA[propertyId].history
}
