import { APP_NAME, BRAND } from '@/constants'
import { formatBillStatus } from '@/lib/payments'
import {
  fetchBillAccountSummary,
  fetchPropertyAccount,
} from '@/services/accountService'
import { fetchPayments } from '@/services/paymentService'
import { fetchPortalSettings } from '@/services/settingsService'
import type { Bill, Property } from '@/types'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEnergy,
  formatInvoiceNumber,
  formatMonthLabel,
} from '@/utils/format'

async function loadBrandLogo(logoPath: string): Promise<{
  dataUrl: string
  width: number
  height: number
}> {
  const response = await fetch(logoPath || BRAND.logo)
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
  const [{ jsPDF }, settings, account, billSummary, payments] =
    await Promise.all([
      import('jspdf'),
      fetchPortalSettings(),
      fetchPropertyAccount(property.id),
      fetchBillAccountSummary(bill.id, property.id),
      fetchPayments(bill.id),
    ])
  const logo = await loadBrandLogo(settings.logoPath)

  const doc = new jsPDF()
  const left = 16
  const right = 194
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 18
  const generatedAt = new Date().toISOString()
  const invoiceNumber = formatInvoiceNumber(bill)
  const moneyX = right

  const ensureSpace = (needed = 16) => {
    if (y + needed < 280) return
    doc.addPage()
    y = 18
  }

  const row = (label: string, value: string, bold = false) => {
    ensureSpace(8)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(9)
    doc.setTextColor(40)
    doc.text(label, left, y)
    doc.text(value, moneyX, y, { align: 'right' })
    y += 6.5
  }

  const section = (title: string) => {
    ensureSpace(14)
    y += 2
    doc.setDrawColor(220)
    doc.line(left, y, right, y)
    y += 7
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(20)
    doc.text(title, left, y)
    y += 7
    doc.setFont('helvetica', 'normal')
  }

  // Header
  const logoWidth = 42
  const logoHeight = (logo.height / logo.width) * logoWidth
  doc.addImage(logo.dataUrl, 'PNG', left, y, logoWidth, logoHeight)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15)
  doc.text(settings.companyName || APP_NAME, left + logoWidth + 8, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(90)
  let companyY = y + 11
  if (settings.companyAddress) {
    const lines = doc.splitTextToSize(settings.companyAddress, 90)
    doc.text(lines, left + logoWidth + 8, companyY)
    companyY += lines.length * 4
  }
  if (settings.companyPhone) {
    doc.text(`Ph: ${settings.companyPhone}`, left + logoWidth + 8, companyY)
    companyY += 4
  }
  if (settings.companyEmail) {
    doc.text(settings.companyEmail, left + logoWidth + 8, companyY)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(15)
  doc.text('TAX INVOICE', right, y + 6, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(70)
  doc.text(`Invoice # ${invoiceNumber}`, right, y + 12, { align: 'right' })
  doc.text(
    `Date: ${bill.billDate ? formatDate(bill.billDate) : formatDate(generatedAt)}`,
    right,
    y + 17,
    { align: 'right' },
  )
  doc.text(`Status: ${formatBillStatus(bill.status)}`, right, y + 22, {
    align: 'right',
  })

  y = Math.max(y + logoHeight + 8, companyY + 8)

  section('Bill To')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(property.label, left, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(70)
  doc.text(`Billing Month: ${formatMonthLabel(bill.billingMonth)}`, left, y)
  doc.text(
    `Consumer No: ${bill.consumerNumber ?? property.consumerNumber ?? '—'}`,
    110,
    y,
  )
  y += 5
  doc.text(
    `Due Date: ${bill.dueDate ? formatDate(bill.dueDate) : '—'}`,
    left,
    y,
  )
  doc.text(`Collection: ${account.collectionStatus}`, 110, y)
  y += 4

  section('Account Summary')
  const opening = billSummary?.openingBalance ?? account.previousOutstanding
  const closing = billSummary?.closingBalance ?? account.totalDue
  row('Opening Balance', formatCurrency(opening))
  row('Current Charges', formatCurrency(bill.tenantTotal ?? 0))
  row('Solar Generation', formatEnergy(bill.generation ?? 0))
  row('Import', formatEnergy(bill.importKwh ?? 0))
  row('Export', formatEnergy(bill.exportKwh ?? 0))
  row('Consumption', formatEnergy(bill.consumption ?? 0))
  row('Energy Charge', formatCurrency(bill.energyCharge ?? 0))
  row('Discount', `−${formatCurrency(bill.discountAmount ?? 0)}`)
  row('Fixed Charge', formatCurrency(bill.fixedCharge ?? 0))
  row('Previous Outstanding', formatCurrency(account.previousOutstanding))
  row('Credit Applied', `−${formatCurrency(bill.creditApplied ?? 0)}`)
  row(
    'Payments Received',
    `−${formatCurrency(billSummary?.payments ?? 0)}`,
  )
  row('Net Amount / Final', formatCurrency(bill.amountPayable ?? bill.tenantTotal ?? 0), true)
  row('Outstanding', formatCurrency(closing), true)

  if (payments.length > 0) {
    section('Payment History')
    for (const payment of payments.slice(0, 12)) {
      const ref = payment.reference ? ` · Ref ${payment.reference}` : ''
      row(
        `${formatDate(payment.paymentDate)} · ${payment.paymentMethod.replace(/_/g, ' ')}${ref}`,
        formatCurrency(payment.amount),
      )
    }
  }

  section('Owner Paid (Excluded From Tenant Bill)')
  row('Security Deposit', formatCurrency(bill.securityDeposit))
  row('Arrears', formatCurrency(bill.arrears))

  section('Payment Instructions')
  doc.setFontSize(8)
  doc.setTextColor(60)
  const instructionLines = doc.splitTextToSize(
    settings.paymentInstructions || DEFAULT_INSTRUCTIONS,
    pageWidth - left * 2,
  )
  ensureSpace(instructionLines.length * 4 + 8)
  doc.text(instructionLines, left, y)
  y += instructionLines.length * 4 + 4
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Amount Due: ${formatCurrency(closing)} · Due ${bill.dueDate ? formatDate(bill.dueDate) : '—'}`,
    left,
    y,
  )
  y += 8

  // QR placeholder
  ensureSpace(28)
  doc.setDrawColor(180)
  doc.setFillColor(248, 248, 248)
  doc.roundedRect(left, y, 22, 22, 2, 2, 'FD')
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(120)
  doc.text('QR', left + 8, y + 12)
  doc.text('Scan placeholder', left + 26, y + 8)
  doc.text(`Invoice ${invoiceNumber}`, left + 26, y + 13)
  y += 28

  section('Terms & Conditions')
  const terms = doc.splitTextToSize(
    settings.termsAndConditions || DEFAULT_TERMS,
    pageWidth - left * 2,
  )
  ensureSpace(terms.length * 4 + 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(110)
  doc.text(terms, left, y)
  y += terms.length * 4 + 10

  doc.setDrawColor(200)
  doc.line(left, y, right, y)
  y += 7
  doc.setFontSize(7)
  doc.text(
    `${settings.companyName || APP_NAME} · Enterprise Billing · v5.0 · Generated ${formatDateTime(generatedAt)}`,
    left,
    y,
  )
  y += 4
  doc.text(
    'Outstanding is calculated from bills, payments, and credits. History is retained.',
    left,
    y,
  )

  doc.save(`${invoiceNumber}.pdf`)
}

const DEFAULT_INSTRUCTIONS =
  'Please settle the outstanding amount on or before the due date. Reference the invoice number in your transfer notes.'

const DEFAULT_TERMS =
  'Security deposit and arrears are owner-paid and excluded from tenant total. Outstanding is calculated from bills, payments, and credits.'
