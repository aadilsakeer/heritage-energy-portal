import { memo } from 'react'
import { AlertTriangle, CalendarDays, Download, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { CurrentBill } from '@/types'
import type { AccountDisplayStatus, OutstandingBreakdown } from '@/lib/account'
import { formatAccountDisplayStatus } from '@/lib/account'
import { ROUTES } from '@/constants'
import { cardEnter } from '@/lib/motion'
import { formatBillStatus } from '@/lib/payments'
import { formatCurrency, formatDate } from '@/utils/format'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CountUp } from '@/components/ui/CountUp'

interface HeroCardProps {
  bill: CurrentBill
  outstanding?: OutstandingBreakdown | null
  onDownloadInvoice?: () => void
  isDownloading?: boolean
}

export const HeroCard = memo(function HeroCard({
  bill,
  outstanding,
  onDownloadInvoice,
  isDownloading = false,
}: HeroCardProps) {
  const displayStatus: AccountDisplayStatus | CurrentBill['status'] =
    outstanding?.status ?? bill.status
  const isOverdue = outstanding?.isOverdue ?? false
  const heroAmount = outstanding?.totalOutstanding ?? bill.balance

  return (
    <motion.div {...cardEnter}>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-brand-secondary to-primary text-primary-foreground shadow-soft">
        <CardContent className="relative p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-brand-accent/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative space-y-8 sm:space-y-10">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <p className="text-caption text-primary-foreground/80">
                  Property Account · {bill.month}
                </p>
                {bill.propertyLabel ? (
                  <p className="text-sm font-medium text-primary-foreground/95">
                    {bill.propertyLabel}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge
                  variant="secondary"
                  className="border-0 bg-white/15 capitalize text-primary-foreground backdrop-blur-md"
                >
                  {typeof displayStatus === 'string' &&
                  [
                    'Paid',
                    'Unpaid',
                    'Partially Paid',
                    'Overdue',
                    'Critical',
                    'Pending Verification',
                    'Draft',
                    'Archived',
                  ].includes(displayStatus)
                    ? formatAccountDisplayStatus(
                        displayStatus as AccountDisplayStatus,
                      )
                    : formatBillStatus(bill.status)}
                </Badge>
                {isOverdue && outstanding ? (
                  <Badge className="border-0 bg-red-500/25 text-primary-foreground">
                    <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                    {outstanding.isCritical
                      ? `Critical · ${outstanding.overdueDays}d`
                      : `${outstanding.overdueDays}d overdue`}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-caption text-primary-foreground/80">
                  Total Outstanding
                </p>
                <p className="text-money text-primary-foreground">
                  <CountUp value={heroAmount} currency={bill.currency} />
                </p>
              </div>

              <div className="space-y-4 border-t border-white/15 pt-8">
                <AmountRow
                  label="Current Bill"
                  value={formatCurrency(
                    outstanding?.currentBillAmount ?? bill.finalAmount,
                    bill.currency,
                  )}
                />
                <AmountRow
                  label="Previous Outstanding"
                  value={formatCurrency(
                    outstanding?.previousOutstanding ?? 0,
                    bill.currency,
                  )}
                />
                <AmountRow
                  label="Credit Applied"
                  value={formatCurrency(
                    outstanding?.creditApplied ?? bill.creditApplied,
                    bill.currency,
                  )}
                />
                <AmountRow
                  label="Paid"
                  value={formatCurrency(bill.totalPaid, bill.currency)}
                />
                <AmountRow
                  label="Total Due"
                  value={formatCurrency(
                    outstanding?.totalDue ?? bill.balance,
                    bill.currency,
                  )}
                  emphasized
                />
              </div>

              <div className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-primary-foreground/95 backdrop-blur-md">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Due{' '}
                  {formatDate(
                    outstanding?.dueDate ?? bill.dueDate,
                  )}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Button
                asChild
                size="lg"
                className="min-h-12 flex-1 bg-white text-primary hover:bg-white/90 active:bg-white/85"
              >
                <Link
                  to={`${ROUTES.bill}/${bill.id}`}
                  aria-label="View bill breakdown"
                >
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  View Bill
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="lg"
                aria-label="Download invoice"
                loading={isDownloading}
                className="android-ripple min-h-12 flex-1 border-white/30 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground active:bg-white/20"
                onClick={onDownloadInvoice}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Download Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

function AmountRow({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: string
  emphasized?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-sm font-medium text-primary-foreground/75">{label}</span>
      <span
        className={
          emphasized
            ? 'text-money-sm text-primary-foreground'
            : 'text-base font-semibold tabular-nums text-primary-foreground/95'
        }
      >
        {value}
      </span>
    </div>
  )
}
