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
        <CardContent className="p-6 text-sm text-muted-foreground">
          No outstanding bills on this account.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="surface-card overflow-hidden">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[560px]">
            <thead>
              <tr>
                <th>Month</th>
                <th>Original</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Overdue</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.bill.id}>
                  <td>
                    <Link
                      to={`${ROUTES.bill}/${row.bill.id}`}
                      className="font-semibold tracking-tight text-primary hover:underline"
                    >
                      {formatMonthLabel(row.bill.billingMonth)}
                    </Link>
                  </td>
                  <td className="tabular-nums">
                    {formatCurrency(row.finalAmount)}
                  </td>
                  <td className="tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatCurrency(row.totalPaid)}
                  </td>
                  <td className="font-semibold tabular-nums">
                    {formatCurrency(row.balance)}
                  </td>
                  <td>
                    {row.overdueDays > 0 ? (
                      <span className="inline-flex items-center gap-1 font-medium text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                        {row.overdueDays}d
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td>
                    <Badge
                      className={
                        row.isCritical
                          ? 'border-0 bg-red-600/15 text-red-800 dark:text-red-200'
                          : row.isOverdue
                            ? 'border-0 bg-red-500/12 text-red-700 dark:text-red-300'
                            : row.displayStatus === 'Partially Paid'
                              ? 'border-0 bg-orange-500/12 text-orange-800 dark:text-orange-300'
                              : 'border-0 bg-blue-500/12 text-blue-700 dark:text-blue-300'
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
          <p className="border-t border-border/40 px-4 py-2.5 text-xs text-muted-foreground">
            Showing {maxVisible} of {rows.length} bills
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
