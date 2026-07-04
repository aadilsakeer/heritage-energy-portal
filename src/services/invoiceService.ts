import { APP_NAME, BRAND } from '@/constants'
import type { Bill, Property } from '@/types'
import { formatCurrency, formatDate, formatDateTime, formatMonthLabel } from '@/utils/format'

async function loadBrandLogo(): Promise<{
  dataUrl: string
  width: number
  height: number
}> {
  const response = await fetch(BRAND.logo)
  if (!response.ok) throw new Error('Failed to load brand logo')

  const blob = await response.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read brand logo'))
    reader.readAsDataURL(blob)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Failed to decode brand logo'))
    element.src = dataUrl
  })

  return { dataUrl, width: image.width, height: image.height }
}

export async function generateInvoicePdf(
  bill: Bill,
  property: Property,
): Promise<void> {
  const [{ jsPDF }, logo] = await Promise.all([
    import('jspdf'),
    loadBrandLogo(),
    import('html2canvas'),
  ])

  const doc = new jsPDF()
  const margin = 20
  let y = 24
  const generatedAt = new Date().toISOString()

  const invoiceNumber =
    bill.invoiceNumber ??
    `HS-${bill.billingMonth.slice(0, 7).replace('-', '')}-${bill.id.slice(0, 8).toUpperCase()}`

  const logoWidth = 52
  const logoHeight = (logo.height / logo.width) * logoWidth
  doc.addImage(logo.dataUrl, 'PNG', margin, y - 6, logoWidth, logoHeight)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80)
  y += logoHeight + 6
  doc.text('Solar Billing Invoice', margin, y)

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
