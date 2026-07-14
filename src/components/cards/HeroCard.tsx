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

  const statusLabel =
    typeof displayStatus === 'string' &&
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
      ? formatAccountDisplayStatus(displayStatus as AccountDisplayStatus)
      : formatBillStatus(bill.status)

  return (
    <motion.div {...cardEnter}>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-[#066b40] to-brand-secondary text-primary-foreground shadow-elevated">
        <CardContent className="relative p-6 sm:p-8 lg:p-10">
          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-brand-accent/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
                  Account Summary
                </p>
                <p className="truncate text-sm font-medium text-primary-foreground/90">
                  {bill.propertyLabel ? `${bill.propertyLabel} · ` : ''}
                  {bill.month}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <Badge className="border-0 bg-white/15 capitalize text-primary-foreground backdrop-blur-md">
                  {statusLabel}
                </Badge>
                {isOverdue && outstanding ? (
                  <Badge className="border-0 bg-red-500/30 text-primary-foreground">
                    <AlertTriangle className="mr-1 h-3 w-3" aria-hidden />
                    {outstanding.isCritical
                      ? `Critical · ${outstanding.overdueDays}d`
                      : `${outstanding.overdueDays}d overdue`}
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-foreground/70">
                Outstanding
              </p>
              <p className="text-money text-primary-foreground">
                <CountUp value={heroAmount} currency={bill.currency} />
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MiniStat
                label="Current Bill"
                value={formatCurrency(
                  outstanding?.currentBillAmount ?? bill.finalAmount,
                  bill.currency,
                )}
              />
              <MiniStat
                label="Credits"
                value={formatCurrency(
                  outstanding?.creditApplied ?? bill.creditApplied,
                  bill.currency,
                )}
              />
              <MiniStat
                label="Paid"
                value={formatCurrency(bill.totalPaid, bill.currency)}
              />
              <MiniStat
                label="Amount Due"
                value={formatCurrency(
                  outstanding?.totalDue ?? bill.balance,
                  bill.currency,
                )}
                emphasis
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-primary-foreground/95 backdrop-blur-md">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Due {formatDate(outstanding?.dueDate ?? bill.dueDate)}
                </span>
              </div>
              {outstanding?.collectionStatus ? (
                <div className="inline-flex min-h-11 items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-md">
                  {outstanding.collectionStatus}
                </div>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:gap-3">
              <Button
                asChild
                size="lg"
                className="min-h-12 flex-1 rounded-2xl bg-white text-primary hover:bg-white/92"
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
                className="android-ripple min-h-12 flex-1 rounded-2xl border-white/25 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
                onClick={onDownloadInvoice}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
})

function MiniStat({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-3.5 py-3 backdrop-blur-md">
      <p className="text-[11px] font-medium text-primary-foreground/70">{label}</p>
      <p
        className={
          emphasis
            ? 'mt-1.5 text-base font-semibold tabular-nums'
            : 'mt-1.5 text-sm font-semibold tabular-nums text-primary-foreground/95'
        }
      >
        {value}
      </p>
    </div>
  )
}
