import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/constants'
import {
  formatAccountDisplayStatus,
  type BillBalanceRow,
} from '@/lib/account'
import { formatCurrency, formatMonthLabel } from '@/utils/format'

interface OutstandingBillsTableProps {
  rows: BillBalanceRow[]
  maxVisible?: number
}

export function OutstandingBillsTable({
  rows,
  maxVisible = 50,
}: OutstandingBillsTableProps) {
  const visible = rows.slice(0, maxVisible)

  if (rows.length === 0) {
    return (
      <Card className="surface-card">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No outstanding bills on this account.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead className="border-b border-border/50 bg-muted/30 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Original</th>
                <th className="px-4 py-3 font-medium">Paid</th>
                <th className="px-4 py-3 font-medium">Remaining</th>
                <th className="px-4 py-3 font-medium">Overdue</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr
                  key={row.bill.id}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`${ROUTES.bill}/${row.bill.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {formatMonthLabel(row.bill.billingMonth)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {formatCurrency(row.finalAmount)}
                  </td>
                  <td className="px-4 py-3 tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(row.totalPaid)}
                  </td>
                  <td className="px-4 py-3 tabular-nums font-semibold">
                    {formatCurrency(row.balance)}
                  </td>
                  <td className="px-4 py-3">
                    {row.overdueDays > 0 ? (
                      <span className="inline-flex items-center gap-1 text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        {row.overdueDays}d
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        row.isCritical
                          ? 'border-0 bg-red-600/20 text-red-800 dark:text-red-200'
                          : row.isOverdue
                            ? 'border-0 bg-red-500/15 text-red-700 dark:text-red-300'
                            : row.displayStatus === 'Partially Paid'
                              ? 'border-0 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'border-0 bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      }
                    >
                      {formatAccountDisplayStatus(row.displayStatus)}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length > maxVisible ? (
          <p className="border-t border-border/40 px-4 py-2 text-xs text-muted-foreground">
            Showing {maxVisible} of {rows.length} bills
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
