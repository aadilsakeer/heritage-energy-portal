import { Card, CardContent } from '@/components/ui/card'
import type { BillAccountSummary } from '@/lib/account'
import { formatCurrency } from '@/utils/format'

interface BillSummaryCardProps {
  summary: BillAccountSummary
}

export function BillSummaryCard({ summary }: BillSummaryCardProps) {
  const rows: Array<{ label: string; value: number; accent?: string }> = [
    { label: 'Opening Balance', value: summary.openingBalance },
    { label: 'Current Charges', value: summary.currentCharges },
    {
      label: 'Credits',
      value: summary.credits,
      accent: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Payments',
      value: summary.payments,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    { label: 'Closing Balance', value: summary.closingBalance },
  ]

  return (
    <Card className="surface-card overflow-hidden">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div>
          <p className="text-sm font-medium text-primary">Bill Summary</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Opening balance carries unpaid amounts from earlier bills
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row) => (
            <div
              key={row.label}
              className="rounded-2xl border border-border/40 bg-muted/20 px-3 py-3"
            >
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <p className={`mt-1 text-base font-semibold tabular-nums ${row.accent ?? ''}`}>
                {formatCurrency(row.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
