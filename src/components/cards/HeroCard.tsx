import { CalendarDays, Download, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { CurrentBill } from '@/types'
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
  onDownloadInvoice?: () => void
  isDownloading?: boolean
}

export function HeroCard({
  bill,
  onDownloadInvoice,
  isDownloading = false,
}: HeroCardProps) {
  return (
    <motion.div {...cardEnter}>
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-brand-secondary to-primary text-primary-foreground shadow-soft">
        <CardContent className="relative p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-brand-accent/20 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <p className="text-caption text-primary-foreground/75">
                  Current Bill · {bill.month}
                </p>
                {bill.propertyLabel ? (
                  <p className="text-sm font-medium text-primary-foreground/90">
                    {bill.propertyLabel}
                  </p>
                ) : null}
              </div>
              <Badge
                variant="secondary"
                className="border-0 bg-white/15 capitalize text-primary-foreground backdrop-blur-md"
              >
                {formatBillStatus(bill.status)}
              </Badge>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-caption text-primary-foreground/75">
                  Remaining Amount
                </p>
                <p className="text-money mt-2 text-primary-foreground">
                  <CountUp value={bill.balance} currency={bill.currency} />
                </p>
              </div>

              <div className="space-y-3 border-t border-white/15 pt-6">
                <AmountRow
                  label="Bill Amount"
                  value={formatCurrency(bill.billAmount, bill.currency)}
                />
                <AmountRow
                  label="Paid"
                  value={formatCurrency(bill.totalPaid, bill.currency)}
                />
                <AmountRow
                  label="Credit Applied"
                  value={formatCurrency(bill.creditApplied, bill.currency)}
                />
                <AmountRow
                  label="Final Amount"
                  value={formatCurrency(bill.finalAmount, bill.currency)}
                  emphasized
                />
              </div>

              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-primary-foreground/90 backdrop-blur-md">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Due {formatDate(bill.dueDate)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="min-h-12 bg-white text-primary hover:bg-white/90 active:bg-white/85"
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
                className="min-h-12 border-white/30 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground active:bg-white/20"
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
}

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
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-primary-foreground/75">{label}</span>
      <span
        className={
          emphasized
            ? 'text-money-sm text-primary-foreground'
            : 'text-base font-medium tabular-nums text-primary-foreground/95'
        }
      >
        {value}
      </span>
    </div>
  )
}
