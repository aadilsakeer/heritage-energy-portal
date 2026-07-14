import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import type { BillAccountSummary } from '@/lib/account'
import { formatCurrency, formatPercent } from '@/utils/format'

interface BillSummaryCardProps {
  summary: BillAccountSummary
}

export function BillSummaryCard({ summary }: BillSummaryCardProps) {
  const gross = Math.max(
    0,
    summary.openingBalance + summary.currentCharges,
  )
  const settled = Math.min(
    gross,
    Math.max(0, summary.credits + summary.payments),
  )
  const progress =
    gross > 0 ? Math.min(100, Math.round((settled / gross) * 1000) / 10) : 100

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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-caption text-primary">Financial Statement</p>
            <h2 className="text-heading mt-1">Bill Summary</h2>
            <p className="text-caption mt-1.5">
              Opening balance carries unpaid amounts from earlier bills
            </p>
          </div>
          <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-right">
            <p className="text-caption">Outstanding</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(summary.closingBalance)}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">Payment Progress</p>
            <p className="text-sm tabular-nums text-muted-foreground">
              {formatPercent(progress)}
            </p>
          </div>
          <Progress value={progress} aria-label="Payment progress" />
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
                className={`mt-2 text-right text-lg font-semibold tabular-nums tracking-tight ${row.accent ?? ''}`}
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
