import { Link } from 'react-router-dom'
import { ROUTES } from '@/constants'
import {
  Activity,
  ArrowDownToLine,
  Download,
  FileText,
  Gauge,
  History,
  Leaf,
  Receipt,
  Sparkles,
  Sun,
  WalletCards,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AccountCreditCard } from '@/components/cards/AccountCreditCard'
import { AccountMetricsGrid } from '@/components/cards/AccountMetricsGrid'
import { AccountSummaryCard } from '@/components/cards/AccountSummaryCard'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { HeroCard } from '@/components/cards/HeroCard'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { PreviousBillsList } from '@/components/cards/PreviousBillsList'
import { StatCard } from '@/components/cards/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useProperty } from '@/context/PropertyContext'
import { useRefresh } from '@/context/RefreshContext'
import { useAsync } from '@/hooks/useAsync'
import { pagePanel } from '@/lib/motion'
import {
  buildQuickStats,
  buildSavingsSummary,
} from '@/services/analyticsService'
import {
  fetchCustomerLedger,
  fetchPropertyAccount,
} from '@/services/accountService'
import {
  fetchBillHistory,
  fetchLatestPublishedBill,
} from '@/services/billService'
import { fetchPayments } from '@/services/paymentService'
import { fetchCreditsForProperty } from '@/services/creditService'
import { fetchPendingPaymentRequest } from '@/services/paymentRequestService'
import { generateStatementPdf } from '@/services/statementService'
import { computePaymentSummary } from '@/lib/payments'
import { notify } from '@/lib/toast'
import { downloadInvoice } from '@/utils/downloadInvoice'
import { formatCurrency, formatDate, formatPercent } from '@/utils/format'
import { toCurrentBill } from '@/utils/mappers'

const quickStatIcons = {
  generation: Sun,
  consumption: Activity,
  export: ArrowDownToLine,
  efficiency: Gauge,
} as const

export function HomePage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const { refreshSignal } = useRefresh()

  const latestQuery = useAsync(
    async () => {
      if (!propertyId) return null
      const [bill, credits, account, ledger] = await Promise.all([
        fetchLatestPublishedBill(propertyId),
        fetchCreditsForProperty(propertyId),
        fetchPropertyAccount(propertyId),
        fetchCustomerLedger(propertyId),
      ])
      const accountCredit = account.credits
      if (!bill) {
        return {
          bill: null,
          summary: null,
          accountCredit,
          credits,
          pendingRequest: null,
          payments: [],
          account,
          outstanding: null,
          recentActivity: ledger.entries.slice(-6).reverse(),
        }
      }
      const [payments, pendingRequest] = await Promise.all([
        fetchPayments(bill.id),
        fetchPendingPaymentRequest(bill.id),
      ])
      return {
        bill,
        summary: computePaymentSummary(bill, payments),
        accountCredit,
        credits,
        pendingRequest,
        payments,
        account,
        outstanding: {
          totalOutstanding: account.outstanding,
          currentBillAmount: account.currentBillAmount,
          previousOutstanding: account.previousOutstanding,
          creditApplied: account.creditApplied,
          totalDue: account.totalDue,
          dueDate: bill.dueDate ?? account.nextDue,
          status: account.status,
          isOverdue: account.isOverdue,
          isCritical: account.isCritical,
          overdueDays: account.overdueDays,
          overdueStage: account.overdueStage,
          currentBillId: bill.id,
          accountCredit,
          collectionStatus: account.collectionStatus,
          lastPaymentAmount: account.lastPayment?.amount ?? null,
          pendingBills: account.pendingBills,
        },
        recentActivity: ledger.entries.slice(-6).reverse(),
      }
    },
    [propertyId, refreshSignal],
    Boolean(propertyId),
    propertyId ? `home:latest:${propertyId}` : undefined,
  )

  const historyQuery = useAsync(
    async () => {
      if (!propertyId) return []
      return fetchBillHistory(propertyId)
    },
    [propertyId, refreshSignal],
    Boolean(propertyId),
    propertyId ? `home:history:${propertyId}` : undefined,
  )

  const isLoading =
    propertiesLoading ||
    (latestQuery.isLoading && !latestQuery.isRefreshing) ||
    (historyQuery.isLoading && !historyQuery.isRefreshing)
  const error = propertiesError ?? latestQuery.error ?? historyQuery.error

  const handleRetry = () => {
    void refreshProperties()
    void latestQuery.reload()
    void historyQuery.reload()
  }

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
        <ErrorState message={error} onRetry={handleRetry} />
      </PageContainer>
    )
  }

  const latestBill = latestQuery.data?.bill ?? null
  const latestSummary = latestQuery.data?.summary
  const accountCredit = latestQuery.data?.accountCredit ?? 0
  const credits = latestQuery.data?.credits ?? []
  const payments = latestQuery.data?.payments ?? []
  const pendingRequest = latestQuery.data?.pendingRequest
  const account = latestQuery.data?.account
  const outstanding = latestQuery.data?.outstanding
  const recentActivity = latestQuery.data?.recentActivity ?? []
  const history = historyQuery.data ?? []
  const hasPublishedBill = Boolean(latestBill)
  const savings = hasPublishedBill
    ? buildSavingsSummary(history, latestBill)
    : null
  const quickStats = buildQuickStats(latestBill)

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        <motion.div
          key={propertyId ?? 'none'}
          id={propertyId ? `property-panel-${propertyId}` : undefined}
          role="tabpanel"
          aria-labelledby={
            propertyId ? `property-tab-${propertyId}` : undefined
          }
          {...pagePanel}
          className="page-stack"
        >
          {latestBill && latestSummary ? (
            <>
              <HeroCard
                bill={toCurrentBill(
                  latestBill,
                  property?.label,
                  latestSummary,
                  accountCredit,
                )}
                outstanding={outstanding}
                onDownloadInvoice={() => {
                  if (!property) return
                  void downloadInvoice(latestBill, property)
                    .then(() => notify.success('Invoice downloaded'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Download failed',
                      ),
                    )
                }}
              />
              <AccountSummaryCard
                bill={toCurrentBill(
                  latestBill,
                  property?.label,
                  latestSummary,
                  accountCredit,
                )}
                summary={latestSummary}
                payments={payments}
                credits={credits}
                hasPendingVerification={Boolean(pendingRequest)}
                outstanding={outstanding}
              />
            </>
          ) : (
            <EmptyState
              branded
              icon={Receipt}
              title="No bill has been published yet"
              description={`Publish a bill for ${property?.label ?? 'this property'} to see amounts and savings.`}
            />
          )}

          {account ? (
            <section className="section-stack" aria-label="Collection snapshot">
              <SectionHeader
                title="Collection Snapshot"
                description="Pending bills and collection health"
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard
                  label="Pending Bills"
                  value={String(account.pendingBills)}
                  icon={Receipt}
                  delay={0.02}
                />
                <StatCard
                  label="Collection %"
                  value={formatPercent(account.collectionPercent)}
                  icon={Sparkles}
                  accent="primary"
                  delay={0.04}
                />
                <StatCard
                  label="Collection Status"
                  value={account.collectionStatus}
                  delay={0.06}
                />
                <StatCard
                  label="Credits"
                  value={formatCurrency(account.credits)}
                  icon={WalletCards}
                  delay={0.08}
                />
              </div>
            </section>
          ) : null}

          {account ? (
            <AccountMetricsGrid
              account={account}
              title="Account Overview"
              description={`Balance and dues for ${property?.label ?? 'property'}`}
              variant="client"
            />
          ) : null}

          {account && account.unpaidBills.length > 0 ? (
            <PreviousBillsList rows={account.unpaidBills} />
          ) : null}

          <section className="section-stack" aria-label="Quick actions">
            <SectionHeader title="Quick Actions" />
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="default">
                <Link to={ROUTES.account}>
                  <WalletCards className="h-4 w-4" />
                  Account
                </Link>
              </Button>
              {latestBill ? (
                <Button asChild variant="outline">
                  <Link to={`${ROUTES.bill}/${latestBill.id}`}>
                    <FileText className="h-4 w-4" />
                    View Bill
                  </Link>
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to={ROUTES.history}>
                  <History className="h-4 w-4" />
                  History
                </Link>
              </Button>
              {property ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    void generateStatementPdf(property)
                      .then(() => notify.success('Statement downloaded'))
                      .catch((err: unknown) =>
                        notify.error(
                          err instanceof Error ? err.message : 'Download failed',
                        ),
                      )
                  }}
                >
                  <Download className="h-4 w-4" />
                  Statement
                </Button>
              ) : null}
              {latestBill && property ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    void downloadInvoice(latestBill, property)
                      .then(() => notify.success('Invoice downloaded'))
                      .catch((err: unknown) =>
                        notify.error(
                          err instanceof Error ? err.message : 'Download failed',
                        ),
                      )
                  }}
                >
                  <Download className="h-4 w-4" />
                  Invoice
                </Button>
              ) : null}
            </div>
          </section>

          {recentActivity.length > 0 ? (
            <section className="section-stack" aria-label="Recent activity">
              <SectionHeader
                title="Recent Activity"
                description="Latest ledger movements"
                action={
                  <Button asChild variant="ghost" size="sm">
                    <Link to={ROUTES.account}>View timeline</Link>
                  </Button>
                }
              />
              <Card className="surface-card">
                <CardContent className="divide-y divide-border/40 p-0">
                  {recentActivity.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start justify-between gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <div>
                        <p className="text-sm font-semibold tracking-tight">
                          {entry.description}
                        </p>
                        <p className="text-caption mt-1">
                          {formatDate(entry.date)}
                        </p>
                      </div>
                      <div className="text-right text-sm tabular-nums">
                        {entry.debit > 0 ? (
                          <p className="font-semibold">
                            {formatCurrency(entry.debit)}
                          </p>
                        ) : null}
                        {entry.credit > 0 ? (
                          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                            −{formatCurrency(entry.credit)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          ) : null}

          <AccountCreditCard balance={accountCredit} />

          <section aria-label="Savings">
            <SectionHeader
              title="Savings"
              description={`Impact for ${property?.label ?? 'property'}`}
            />
            {!savings ? (
              <EmptyState
                branded
                icon={Leaf}
                title="No savings yet"
                description="Savings appear after your first bill is published."
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <StatCard
                  label="Saved This Month"
                  value={formatCurrency(savings.savedThisMonth, savings.currency)}
                  icon={Leaf}
                  accent="primary"
                  size="large"
                  delay={0.04}
                />
                <StatCard
                  label="Lifetime Savings"
                  value={formatCurrency(
                    savings.lifetimeSavings,
                    savings.currency,
                  )}
                  icon={Sparkles}
                  accent="accent"
                  size="large"
                  delay={0.08}
                />
              </div>
            )}
          </section>

          <section aria-label="Quick statistics">
            <SectionHeader
              title="Energy Snapshot"
              description="Live profile for this property"
            />
            {quickStats.length === 0 ? (
              <EmptyState
                branded
                title="No statistics yet"
                description="Statistics appear after a bill is published."
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                {quickStats.map((stat, index) => (
                  <StatCard
                    key={stat.id}
                    label={stat.label}
                    value={stat.value}
                    icon={
                      quickStatIcons[stat.id as keyof typeof quickStatIcons]
                    }
                    delay={0.04 * index}
                  />
                ))}
              </div>
            )}
          </section>
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default HomePage
