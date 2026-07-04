import { Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { EmptyState } from '@/components/cards/EmptyState'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  formatBillStatus,
  formatPaymentMethod,
  type PaymentSummary,
} from '@/lib/payments'
import type { Payment } from '@/types'
import { billStatusVariant } from '@/lib/billStatus'
import type { BillStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'

interface PaymentHistoryProps {
  status: BillStatus
  summary: PaymentSummary
  payments: Payment[]
}

export function PaymentHistory({
  status,
  summary,
  payments,
}: PaymentHistoryProps) {
  return (
    <section aria-label="Payment summary" className="space-y-4">
      <SectionHeader title="Payments" description="Bill amount, paid, and remaining" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Bill Amount</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.billAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="mt-1 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(summary.totalPaid)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.balance)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Status</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={billStatusVariant[status]} className="capitalize">
                {formatBillStatus(status)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {summary.paymentPercentage.toFixed(0)}% paid
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <SectionHeader title="Payment History" />
      {payments.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payments yet"
          description="Payments recorded by admin will appear here."
        />
      ) : (
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(payment.paymentDate)} ·{' '}
                        {formatPaymentMethod(payment.paymentMethod)}
                      </p>
                      {payment.reference ? (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Ref: {payment.reference}
                        </p>
                      ) : null}
                      {payment.notes ? (
                        <p className="mt-1 text-sm text-muted-foreground">{payment.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
