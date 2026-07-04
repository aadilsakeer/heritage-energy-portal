import { APP_NAME } from '@/constants'
import type { Bill, Property } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatMonthLabel } from '@/utils/format'

export async function generateInvoicePdf(
  bill: Bill,
  property: Property,
): Promise<void> {
  const [{ jsPDF }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ])

  const doc = new jsPDF()
  const margin = 20
  let y = 24
  const generatedAt = new Date().toISOString()

  const invoiceNumber =
    bill.invoiceNumber ??
    `HS-${bill.billingMonth.slice(0, 7).replace('-', '')}-${bill.id.slice(0, 8).toUpperCase()}`

  doc.setFillColor(15, 138, 95)
  doc.roundedRect(margin, y - 8, 12, 12, 3, 3, 'F')
  doc.setDrawColor(247, 251, 248)
  doc.setLineWidth(1.2)
  doc.circle(margin + 6, y - 4, 2.2, 'S')
  doc.line(margin + 2.5, y + 1, margin + 9.5, y + 1)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(16, 120, 90)
  doc.text(APP_NAME, margin + 16, y)

  doc.setFontSize(11)
  doc.setTextColor(80)
  doc.setFont('helvetica', 'normal')
  y += 8
  doc.text('Solar Billing Invoice', margin + 16, y)

  y += 14
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text(property.label, margin, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`Invoice # ${invoiceNumber}`, 120, y)

  y += 8
  doc.text(`Month: ${formatMonthLabel(bill.billingMonth)}`, margin, y)
  doc.text(`Bill Date: ${bill.billDate ? formatDate(bill.billDate) : '—'}`, 120, y)

  y += 8
  doc.text(`Due Date: ${bill.dueDate ? formatDate(bill.dueDate) : '—'}`, margin, y)
  if (bill.consumerNumber) {
    doc.text(`Consumer No: ${bill.consumerNumber}`, 120, y)
  }

  y += 14
  doc.setFont('helvetica', 'bold')
  doc.text('Calculation', margin, y)
  doc.setFont('helvetica', 'normal')
  y += 8

  const rows: Array<[string, string]> = [
    ['Generation', `${bill.generation ?? 0} kWh`],
    ['Import', `${bill.importKwh ?? 0} kWh`],
    ['Export', `${bill.exportKwh ?? 0} kWh`],
    ['Consumption', `${bill.consumption ?? 0} kWh`],
    ['Energy Charge', formatCurrency(bill.energyCharge ?? 0)],
    ['Discount', `−${formatCurrency(bill.discountAmount ?? 0)}`],
    ['Fixed Charge', formatCurrency(bill.fixedCharge ?? 0)],
    ['Tenant Total', formatCurrency(bill.tenantTotal ?? 0)],
  ]

  rows.forEach(([label, value]) => {
    doc.text(label, margin, y)
    doc.text(value, 160, y, { align: 'right' })
    y += 7
  })

  y += 8
  doc.setFont('helvetica', 'bold')
  doc.text('Owner Paid (Not Included In Tenant Bill)', margin, y)
  doc.setFont('helvetica', 'normal')
  y += 8
  doc.text('Security Deposit', margin, y)
  doc.text(formatCurrency(bill.securityDeposit), 160, y, { align: 'right' })
  y += 7
  doc.text('Arrears', margin, y)
  doc.text(formatCurrency(bill.arrears), 160, y, { align: 'right' })

  y += 18
  doc.setDrawColor(200)
  doc.line(margin, y, 190, y)
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(
    `${APP_NAME} · Transparent solar billing · Generated ${formatDateTime(generatedAt)}`,
    margin,
    y,
  )
  y += 5
  doc.text(
    'Security deposit and arrears are owner-paid and excluded from tenant total.',
    margin,
    y,
  )

  doc.save(`${invoiceNumber}.pdf`)
}
