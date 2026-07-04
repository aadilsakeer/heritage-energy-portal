export function formatCurrency(amount: number, currency = '₹'): string {
  return `${currency}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
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

export function formatDate(dateString: string): string {
  const [year, month, day] = dateString.slice(0, 10).split('-').map(Number)
  const date = new Date(year, (month ?? 1) - 1, day ?? 1)
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}


export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatEnergy(value: number, unit = 'kWh'): string {
  return `${value.toLocaleString('en-IN')} ${unit}`
}
