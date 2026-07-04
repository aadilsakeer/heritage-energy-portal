import type { Bill, Property } from '@/types'

export async function downloadInvoice(
  bill: Bill,
  property: Property,
): Promise<void> {
  const { generateInvoicePdf } = await import('@/services/invoiceService')
  await generateInvoicePdf(bill, property)
}
