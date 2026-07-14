import { Link } from 'react-router-dom'
import { AlertTriangle, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ROUTES } from '@/constants'
import {
  formatAccountDisplayStatus,
  type BillBalanceRow,
} from '@/lib/account'
import { easeOut } from '@/lib/motion'
import { formatCurrency, formatMonthLabel } from '@/utils/format'

interface PreviousBillsListProps {
  rows: BillBalanceRow[]
}

export function PreviousBillsList({ rows }: PreviousBillsListProps) {
  if (rows.length === 0) return null

  return (
    <section aria-label="Unpaid bills" className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Previous Bills</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Unpaid and partially paid bills on this account
        </p>
      </div>
      <ul className="space-y-2.5">
        {rows.map((row, index) => (
          <motion.li
            key={row.bill.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04, ease: easeOut }}
          >
            <Link
              to={`${ROUTES.bill}/${row.bill.id}`}
              className="block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label={`View ${formatMonthLabel(row.bill.billingMonth)} bill, ${formatCurrency(row.balance)}, ${row.displayStatus}`}
            >
              <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-foreground">
                        {formatMonthLabel(row.bill.billingMonth)}
                      </p>
                      <Badge
                        className={
                          row.isOverdue
                            ? 'border-0 bg-red-500/15 text-red-700 dark:text-red-300'
                            : row.displayStatus === 'Partially Paid'
                              ? 'border-0 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                              : 'border-0 bg-blue-500/15 text-blue-700 dark:text-blue-300'
                        }
                      >
                        {formatAccountDisplayStatus(row.displayStatus)}
                      </Badge>
                      {row.isOverdue ? (
                        <Badge className="border-0 bg-red-500/10 text-red-700 dark:text-red-300">
                          <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                          {row.overdueDays}d overdue
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold tracking-tight tabular-nums">
                      {formatCurrency(row.balance)}
                    </p>
                    <ChevronRight
                      className="h-4 w-4 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.li>
        ))}
      </ul>
    </section>
  )
}
