import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AccountCreditCard } from '@/components/cards/AccountCreditCard'
import { AccountMetricsGrid } from '@/components/cards/AccountMetricsGrid'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { AccountTimeline } from '@/components/account/AccountTimeline'
import { OutstandingBillsTable } from '@/components/account/OutstandingBillsTable'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProperty } from '@/context/PropertyContext'
import { useRefresh } from '@/context/RefreshContext'
import { useAsync } from '@/hooks/useAsync'
import { pagePanel } from '@/lib/motion'
import {
  fetchCustomerLedger,
  fetchPropertyAccount,
} from '@/services/accountService'
import { fetchCreditsForProperty } from '@/services/creditService'
import { fetchPayments } from '@/services/paymentService'
import {
  exportCollectionReport,
  exportCreditReport,
  exportLedgerReport,
  exportOutstandingReport,
} from '@/services/reportService'
import { generateStatementPdf } from '@/services/statementService'
import { prepareRemindersForProperty } from '@/services/reminderService'
import { notify } from '@/lib/toast'
import { formatCurrency, formatDate, formatMonthLabel } from '@/utils/format'
import { useMemo, useState } from 'react'

export function AccountPage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()
  const { refreshSignal } = useRefresh()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const accountQuery = useAsync(
    async () => {
      if (!propertyId) return null
      const [account, ledger, credits] = await Promise.all([
        fetchPropertyAccount(propertyId),
        fetchCustomerLedger(propertyId),
        fetchCreditsForProperty(propertyId),
      ])
      const paymentBillId = account.currentBill?.id
      const payments = paymentBillId
        ? await fetchPayments(paymentBillId)
        : account.lastPayment
          ? [account.lastPayment]
          : []
      return { account, ledger, credits, payments }
    },
    [propertyId, refreshSignal],
    Boolean(propertyId),
    propertyId ? `account:${propertyId}` : undefined,
  )

  const isLoading =
    propertiesLoading ||
    (accountQuery.isLoading && !accountQuery.isRefreshing)
  const error = propertiesError ?? accountQuery.error

  const filteredLedger = useMemo(() => {
    const entries = accountQuery.data?.ledger.entries ?? []
    return entries.filter((entry) => {
      if (fromDate && entry.date < fromDate) return false
      if (toDate && entry.date > toDate) return false
      return true
    })
  }, [accountQuery.data?.ledger.entries, fromDate, toDate])

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton variant="page" />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer>
        <ErrorState
          message={error}
          onRetry={() => {
            void refreshProperties()
            void accountQuery.reload()
          }}
        />
      </PageContainer>
    )
  }

  const data = accountQuery.data
  if (!data || !property) {
    return (
      <PageContainer>
        <EmptyState
          branded
          icon={FileText}
          title="No account data"
          description="Publish a bill to open the property account."
        />
      </PageContainer>
    )
  }

  const { account, credits, payments } = data

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        <motion.div
          key={propertyId}
          {...pagePanel}
          className="space-y-6 sm:space-y-8"
        >
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Property Account</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {property.label}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {property.consumerNumber
                  ? `Consumer ${property.consumerNumber}`
                  : 'One account for bills, payments, and credits'}
              </p>
            </div>
            <Badge
              className={
                account.collectionStatus === 'Critical'
                  ? 'border-0 bg-red-600/20 text-red-800 dark:text-red-200'
                  : account.collectionStatus === 'Overdue'
                    ? 'border-0 bg-red-500/15 text-red-700 dark:text-red-300'
                    : account.collectionStatus === 'Clear'
                      ? 'border-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                      : 'border-0 bg-amber-500/15 text-amber-700 dark:text-amber-300'
              }
            >
              Collection: {account.collectionStatus}
            </Badge>
          </header>

          <AccountMetricsGrid
            account={account}
            title="Account Summary"
            description="Outstanding and collection status"
            variant="admin"
          />

          <section className="space-y-3">
            <SectionHeader
              title="Outstanding Bills"
              description="Unpaid bills are never hidden"
            />
            <OutstandingBillsTable rows={account.unpaidBills} />
          </section>

          <section className="space-y-3">
            <SectionHeader title="Payments" description="Recent payments on account" />
            <Card className="surface-card">
              <CardContent className="space-y-2 p-4">
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No payments yet</p>
                ) : (
                  payments.slice(0, 8).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(payment.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.paymentDate)} ·{' '}
                          {payment.paymentMethod.replace(/_/g, ' ')}
                        </p>
                      </div>
                      {payment.reference ? (
                        <span className="text-xs text-muted-foreground">
                          {payment.reference}
                        </span>
                      ) : null}
                    </div>
                  ))
                )}
                {account.lastPayment ? (
                  <p className="pt-1 text-xs text-muted-foreground">
                    Last payment {formatCurrency(account.lastPayment.amount)} on{' '}
                    {formatDate(account.lastPayment.paymentDate)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <AccountCreditCard balance={account.credits} />

          <section className="space-y-3">
            <SectionHeader title="Credits" description="Active and applied credits" />
            <Card className="surface-card">
              <CardContent className="space-y-2 p-4">
                {credits.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No credits</p>
                ) : (
                  credits.slice(0, 10).map((credit) => (
                    <div
                      key={credit.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted/20 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(credit.remainingAmount || credit.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {credit.reason} · {credit.status}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <SectionHeader
              title="Timeline"
              description="Chronological account ledger"
            />
            <div className="flex flex-wrap gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                aria-label="From date"
                className="w-auto"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                aria-label="To date"
                className="w-auto"
              />
            </div>
            <AccountTimeline entries={filteredLedger} />
          </section>

          <section className="space-y-3">
            <SectionHeader title="Statement & Reports" />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void generateStatementPdf(property, {
                    fromDate: fromDate || null,
                    toDate: toDate || null,
                  })
                    .then(() => notify.success('Statement downloaded'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Download failed',
                      ),
                    )
                }}
              >
                <Download className="h-4 w-4" />
                Statement PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void exportOutstandingReport(property, 'csv')
                    .then(() => notify.success('Outstanding report exported'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Export failed',
                      ),
                    )
                }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Outstanding CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void exportCollectionReport(property, 'excel')
                    .then(() => notify.success('Collection report exported'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Export failed',
                      ),
                    )
                }}
              >
                Collection Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void exportLedgerReport(property, 'csv', {
                    fromDate: fromDate || undefined,
                    toDate: toDate || undefined,
                  })
                    .then(() => notify.success('Ledger exported'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Export failed',
                      ),
                    )
                }}
              >
                Ledger CSV
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void exportCreditReport(property, 'csv')
                    .then(() => notify.success('Credits exported'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Export failed',
                      ),
                    )
                }}
              >
                Credits CSV
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  void prepareRemindersForProperty(property.id)
                    .then((rows) =>
                      notify.success(
                        `Prepared ${rows.length} reminder record(s)`,
                      ),
                    )
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Reminder prep failed',
                      ),
                    )
                }}
              >
                Prepare Reminders
              </Button>
            </div>
          </section>

          {account.currentBill ? (
            <p className="text-sm text-muted-foreground">
              Current bill {formatMonthLabel(account.currentBill.billingMonth)} ·
              Next due{' '}
              {account.nextDue ? formatDate(account.nextDue) : '—'} · Status{' '}
              {account.status}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default AccountPage
