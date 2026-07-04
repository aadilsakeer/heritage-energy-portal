import { CalendarDays, Download, FileText } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { CurrentBill } from '@/types'
import { ROUTES } from '@/constants'
import { easeOut } from '@/lib/motion'
import { formatBillStatus } from '@/lib/payments'
import { formatCurrency, formatDate } from '@/utils/format'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CountUp } from '@/components/ui/CountUp'

interface HeroCardProps {
  bill: CurrentBill
  onDownloadInvoice?: () => void
}

export function HeroCard({ bill, onDownloadInvoice }: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easeOut }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-800 text-primary-foreground shadow-soft dark:from-emerald-500 dark:via-emerald-600 dark:to-emerald-900">
        <CardContent className="relative p-6 sm:p-8">
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-12 left-1/4 h-36 w-36 rounded-full bg-accent/25 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">
                  Current Bill
                  {bill.propertyLabel ? ` · ${bill.propertyLabel}` : ''}
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {bill.month}
                </h1>
              </div>
              <Badge
                variant="secondary"
                className="border-0 bg-white/15 capitalize text-primary-foreground backdrop-blur-md"
              >
                {formatBillStatus(bill.status)}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-primary-foreground/75">Remaining</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                <CountUp value={bill.balance} currency={bill.currency} />
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-md">
                  <p className="text-xs text-primary-foreground/70">Bill Amount</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {formatCurrency(bill.billAmount, bill.currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-md">
                  <p className="text-xs text-primary-foreground/70">Paid</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {formatCurrency(bill.totalPaid, bill.currency)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-2 backdrop-blur-md">
                  <p className="text-xs text-primary-foreground/70">Progress</p>
                  <p className="mt-0.5 text-sm font-medium">
                    {bill.paymentPercentage.toFixed(0)}%
                  </p>
                </div>
              </div>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-primary-foreground/90 backdrop-blur-md">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span>Due {formatDate(bill.dueDate)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-emerald-900 hover:bg-white/90"
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
                aria-label="Download invoice"
                className="border-white/25 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
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
