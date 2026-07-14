import { APP_NAME, BRAND } from '@/constants'
import { fetchCustomerLedger } from '@/services/accountService'
import type { Property } from '@/types'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

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

export interface StatementOptions {
  fromDate?: string | null
  toDate?: string | null
}

export async function generateStatementPdf(
  property: Property,
  options: StatementOptions = {},
): Promise<void> {
  const [{ jsPDF }, logo, ledger] = await Promise.all([
    import('jspdf'),
    loadBrandLogo(),
    fetchCustomerLedger(property.id, {
      fromDate: options.fromDate,
      toDate: options.toDate,
    }),
  ])

  const doc = new jsPDF()
  const margin = 16
  let y = 22
  const generatedAt = new Date().toISOString()
  const pageWidth = doc.internal.pageSize.getWidth()
  const right = pageWidth - margin

  const logoWidth = 48
  const logoHeight = (logo.height / logo.width) * logoWidth
  doc.addImage(logo.dataUrl, 'PNG', margin, y - 6, logoWidth, logoHeight)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(80)
  y += logoHeight + 4
  doc.text('Statement of Account', margin, y)

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.setFontSize(14)
  doc.text(property.label, margin, y)

  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(60)
  const rangeLabel =
    options.fromDate || options.toDate
      ? `${options.fromDate ? formatDate(options.fromDate) : '…'} – ${options.toDate ? formatDate(options.toDate) : '…'}`
      : 'All dates'
  doc.text(`Period: ${rangeLabel}`, margin, y)
  doc.text(`Generated: ${formatDateTime(generatedAt)}`, 110, y)

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(20)
  doc.text('Account Summary', margin, y)
  doc.setFont('helvetica', 'normal')
  y += 8
  doc.text('Opening Balance', margin, y)
  doc.text(formatCurrency(ledger.openingBalance), right, y, { align: 'right' })
  y += 7
  doc.text('Closing Balance', margin, y)
  doc.text(formatCurrency(ledger.closingBalance), right, y, { align: 'right' })

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.text('Transactions', margin, y)
  y += 8

  doc.setFontSize(8)
  doc.setTextColor(100)
  doc.text('Date', margin, y)
  doc.text('Description', margin + 28, y)
  doc.text('Debit', 130, y, { align: 'right' })
  doc.text('Credit', 155, y, { align: 'right' })
  doc.text('Balance', right, y, { align: 'right' })
  y += 3
  doc.setDrawColor(210)
  doc.line(margin, y, right, y)
  y += 6
  doc.setTextColor(30)
  doc.setFont('helvetica', 'normal')

  const ensureSpace = (needed = 10) => {
    if (y + needed < 280) return
    doc.addPage()
    y = 20
  }

  if (ledger.entries.length === 0) {
    doc.text('No transactions in this period.', margin, y)
    y += 8
  } else {
    for (const entry of ledger.entries) {
      ensureSpace(12)
      const descLines = doc.splitTextToSize(entry.description, 70)
      doc.text(formatDate(entry.date), margin, y)
      doc.text(descLines, margin + 28, y)
      doc.text(
        entry.debit > 0 ? formatCurrency(entry.debit) : '—',
        130,
        y,
        { align: 'right' },
      )
      doc.text(
        entry.credit > 0 ? formatCurrency(entry.credit) : '—',
        155,
        y,
        { align: 'right' },
      )
      doc.text(formatCurrency(entry.runningBalance), right, y, {
        align: 'right',
      })
      y += Math.max(7, descLines.length * 4 + 3)
    }
  }

  ensureSpace(24)
  y += 6
  doc.setDrawColor(200)
  doc.line(margin, y, right, y)
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(
    `${APP_NAME} · Statement of Account · Property account ledger`,
    margin,
    y,
  )
  y += 5
  doc.text(
    'Outstanding is calculated from bills, payments, and credits. History is never deleted.',
    margin,
    y,
  )

  const fromSlug = (options.fromDate ?? 'all').slice(0, 10)
  const toSlug = (options.toDate ?? 'all').slice(0, 10)
  doc.save(
    `SOA-${property.slug}-${fromSlug}-${toSlug}.pdf`,
  )
}
