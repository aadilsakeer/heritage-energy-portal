import { AlertCircle, Clock, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { billStatusColorClass } from '@/lib/billStatus'
import { formatBillStatus } from '@/lib/payments'
import type { CurrentBill, CustomerCredit, Payment } from '@/types'
import type { PaymentSummary } from '@/lib/payments'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatPaymentMethod } from '@/lib/payments'

interface AccountSummaryCardProps {
  bill: CurrentBill
  summary: PaymentSummary
  payments: Payment[]
  credits: CustomerCredit[]
  hasPendingVerification?: boolean
}

export function AccountSummaryCard({
  bill,
  summary,
  payments,
  credits,
  hasPendingVerification,
}: AccountSummaryCardProps) {
  const activeCredits = credits.filter((credit) => credit.status === 'active')
  const appliedCredits = credits.filter(
    (credit) => credit.billId === bill.id && credit.status === 'used',
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <Card className="surface-card overflow-hidden">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-primary">Account Summary</p>
              <h2 className="mt-1 text-xl font-semibold">{bill.month}</h2>
            </div>
            <Badge className={billStatusColorClass[bill.status]}>
              {formatBillStatus(bill.status)}
            </Badge>
          </div>

          {hasPendingVerification ? (
            <div className="flex items-start gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3">
              <Clock className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="font-medium text-orange-800 dark:text-orange-200">
                  Payment pending verification
                </p>
                <p className="mt-1 text-sm text-orange-700/80 dark:text-orange-300/80">
                  Your payment request is awaiting admin approval.
                </p>
              </div>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <SummaryTile label="Bill Amount" value={formatCurrency(summary.billAmount)} />
            <SummaryTile
              label="Credit Applied"
              value={formatCurrency(summary.creditApplied)}
              accent="text-blue-600 dark:text-blue-400"
            />
            <SummaryTile label="Amount Paid" value={formatCurrency(summary.totalPaid)} accent="text-emerald-600 dark:text-emerald-400" />
            <SummaryTile label="Remaining" value={formatCurrency(summary.balance)} />
            <SummaryTile
              label="Current Credit"
              value={formatCurrency(bill.accountCredit)}
              accent="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryTile label="Final Amount" value={formatCurrency(summary.finalAmount)} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payment progress</span>
              <span className="font-medium">{summary.paymentPercentage.toFixed(0)}%</span>
            </div>
            <Progress value={summary.paymentPercentage} className="h-2.5" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <HistoryBlock
              title="Payment History"
              icon={Wallet}
              empty="No payments recorded yet"
              items={payments.slice(0, 4).map((payment) => ({
                id: payment.id,
                primary: formatCurrency(payment.amount),
                secondary: `${formatDate(payment.paymentDate)} · ${formatPaymentMethod(payment.paymentMethod)}`,
              }))}
            />
            <HistoryBlock
              title="Credit History"
              icon={AlertCircle}
              empty="No credits on this account"
              items={[
                ...appliedCredits.slice(0, 2).map((credit) => ({
                  id: credit.id,
                  primary: formatCurrency(credit.amount),
                  secondary: `Applied · ${credit.reason}`,
                  badge: 'Applied',
                })),
                ...activeCredits.slice(0, 2).map((credit) => ({
                  id: credit.id,
                  primary: formatCurrency(credit.remainingAmount),
                  secondary: credit.reason,
                  badge: 'Available',
                })),
              ]}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function SummaryTile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/20 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-base font-semibold ${accent ?? ''}`}>{value}</p>
    </div>
  )
}

function HistoryBlock({
  title,
  icon: Icon,
  empty,
  items,
}: {
  title: string
  icon: typeof Wallet
  empty: string
  items: Array<{
    id: string
    primary: string
    secondary: string
    badge?: string
  }>
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-muted/10 p-3">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-2 rounded-xl bg-background/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{item.primary}</p>
                <p className="text-xs text-muted-foreground">{item.secondary}</p>
              </div>
              {item.badge ? (
                <Badge
                  variant="outline"
                  className={
                    item.badge === 'Applied'
                      ? 'border-0 bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      : 'border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  }
                >
                  {item.badge}
                </Badge>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
