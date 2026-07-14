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
      accent: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Payments',
      value: summary.payments,
      accent: 'text-emerald-700 dark:text-emerald-300',
    },
    { label: 'Closing Balance', value: summary.closingBalance },
  ]

  return (
    <Card className="surface-elevated overflow-hidden">
      <CardContent className="space-y-5 p-5 sm:p-6">
        <div>
          <p className="text-caption text-primary">Financial Statement</p>
          <h2 className="text-heading mt-1">Bill Summary</h2>
          <p className="text-caption mt-1.5">
            Opening balance carries unpaid amounts from earlier bills
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {rows.map((row, index) => (
            <div
              key={row.label}
              className={
                index === rows.length - 1
                  ? 'rounded-2xl border border-primary/20 bg-primary/5 px-3.5 py-4'
                  : 'rounded-2xl border border-border/50 bg-muted/20 px-3.5 py-4'
              }
            >
              <p className="text-caption">{row.label}</p>
              <p
                className={`mt-2 text-lg font-semibold tabular-nums tracking-tight ${row.accent ?? ''}`}
              >
                {formatCurrency(row.value)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
