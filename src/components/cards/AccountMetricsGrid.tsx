import {
  AlertTriangle,
  BadgePercent,
  CircleDollarSign,
  Clock3,
  PiggyBank,
  Receipt,
  Timer,
  Wallet,
} from 'lucide-react'
import { StatCard } from '@/components/cards/StatCard'
import { SectionHeader } from '@/components/layout/SectionHeader'
import type { PropertyAccountSummary } from '@/lib/account'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'

interface AccountMetricsGridProps {
  account: PropertyAccountSummary
  title?: string
  description?: string
  variant?: 'admin' | 'client'
}

export function AccountMetricsGrid({
  account,
  title = 'Account',
  description,
  variant = 'client',
}: AccountMetricsGridProps) {
  if (variant === 'admin') {
    return (
      <section aria-label="Admin account metrics" className="space-y-3">
        <SectionHeader
          title={title}
          description={
            description ?? 'Collection and outstanding for this property'
          }
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard
            label="Outstanding"
            value={formatCurrency(account.outstanding)}
            icon={CircleDollarSign}
            accent="accent"
            delay={0.02}
          />
          <StatCard
            label="Collected"
            value={formatCurrency(account.collected)}
            icon={PiggyBank}
            accent="primary"
            delay={0.04}
          />
          <StatCard
            label="Collection %"
            value={`${formatPercent(account.collectionPercent)}`}
            icon={BadgePercent}
            accent="primary"
            delay={0.06}
          />
          <StatCard
            label="Pending Bills"
            value={String(account.pendingBills)}
            icon={Receipt}
            delay={0.08}
          />
          <StatCard
            label="Overdue"
            value={formatCurrency(account.overdueAmount)}
            icon={AlertTriangle}
            delay={0.1}
          />
          <StatCard
            label="Critical"
            value={formatCurrency(account.criticalAmount)}
            icon={AlertTriangle}
            accent="accent"
            delay={0.12}
          />
          <StatCard
            label="Credits Outstanding"
            value={formatCurrency(account.creditsOutstanding)}
            icon={Wallet}
            delay={0.14}
          />
          <StatCard
            label="Avg Payment Delay"
            value={`${account.averagePaymentDelayDays.toFixed(0)}d`}
            icon={Timer}
            delay={0.16}
          />
        </div>
      </section>
    )
  }

  return (
    <section aria-label="Account overview" className="space-y-3">
      <SectionHeader
        title={title}
        description={description ?? 'Property account snapshot'}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Outstanding"
          value={formatCurrency(account.outstanding)}
          icon={CircleDollarSign}
          accent="accent"
          delay={0.02}
        />
        <StatCard
          label="Pending Bills"
          value={String(account.pendingBills)}
          icon={Receipt}
          delay={0.04}
        />
        <StatCard
          label="Credits"
          value={formatCurrency(account.credits)}
          icon={Wallet}
          accent="primary"
          delay={0.06}
        />
        <StatCard
          label="Last Payment"
          value={
            account.lastPayment
              ? formatCurrency(account.lastPayment.amount)
              : '—'
          }
          icon={PiggyBank}
          delay={0.08}
        />
        <StatCard
          label="Next Due"
          value={account.nextDue ? formatDate(account.nextDue) : '—'}
          icon={Clock3}
          delay={0.1}
        />
        <StatCard
          label="Collection"
          value={account.collectionStatus}
          icon={BadgePercent}
          delay={0.12}
        />
      </div>
    </section>
  )
}
