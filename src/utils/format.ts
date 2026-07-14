export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export function formatPercent(value: number, digits = 1): string {
  return `${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`
}

export function formatMonthLabel(dateString: string): string {
  const [year, month] = dateString.slice(0, 10).split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, 1)
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function formatMonthShort(dateString: string): string {
  const [year, month] = dateString.slice(0, 10).split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, 1)
  return date.toLocaleDateString('en-US', { month: 'short' })
}

/** Example: 05 Jul 2026 */
export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.slice(0, 10).split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, day ?? 1)
  const dd = String(date.getDate()).padStart(2, '0')
  const mon = date.toLocaleDateString('en-GB', { month: 'short' })
  return `${dd} ${mon} ${date.getFullYear()}`
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  const day = formatDate(date.toISOString())
  const time = date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  return `${day}, ${time}`
}

export function formatEnergy(value: number, unit = 'kWh'): string {
  return `${Number(value || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
  })} ${unit}`
}

export function formatInvoiceNumber(bill: {
  invoiceNumber?: string | null
  billingMonth: string
  id: string
}): string {
  if (bill.invoiceNumber) return bill.invoiceNumber
  const ym = bill.billingMonth.slice(0, 7).replace('-', '')
  const seq = bill.id.replace(/-/g, '').slice(0, 6).toUpperCase()
  return `HS-${ym}-${seq}`
}
