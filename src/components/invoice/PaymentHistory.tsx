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
import type { CustomerCredit, Payment } from '@/types'
import { billStatusVariant } from '@/lib/billStatus'
import type { BillStatus } from '@/types'
import { formatCreditStatus } from '@/lib/credits'
import { formatCurrency, formatDate, formatDateTime } from '@/utils/format'

interface PaymentHistoryProps {
  status: BillStatus
  summary: PaymentSummary
  payments: Payment[]
  credits?: CustomerCredit[]
}

export function PaymentHistory({
  status,
  summary,
  payments,
  credits = [],
}: PaymentHistoryProps) {
  return (
    <section aria-label="Payment summary" className="space-y-4">
      <SectionHeader title="Payments" description="Bill amount, credits, and remaining balance" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Bill Amount</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.billAmount)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Credit Applied</p>
            <p className="mt-1 text-xl font-semibold text-accent">
              {formatCurrency(summary.creditApplied)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
          <CardContent className="p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">Final Amount</p>
            <p className="mt-1 text-xl font-semibold">
              {formatCurrency(summary.finalAmount)}
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
            <div className="mt-2">
              <Badge variant={billStatusVariant[status]} className="capitalize">
                {formatBillStatus(status)}
              </Badge>
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
                  <p className="font-medium">{formatCurrency(payment.amount)}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(payment.paymentDate)} ·{' '}
                    {formatPaymentMethod(payment.paymentMethod)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <SectionHeader title="Credit History" />
      {credits.length === 0 ? (
        <EmptyState
          title="No credits for this bill"
          description="Credits created from overpayments appear here."
        />
      ) : (
        <div className="space-y-3">
          {credits.map((credit, index) => (
            <motion.div
              key={credit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <Card className="border-muted/50 bg-muted/20 shadow-soft backdrop-blur-xl">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{formatCurrency(credit.amount)}</p>
                    <Badge variant="outline">{formatCreditStatus(credit.status)}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{credit.reason}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Remaining {formatCurrency(credit.remainingAmount)} ·{' '}
                    {formatDateTime(credit.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  )
}
