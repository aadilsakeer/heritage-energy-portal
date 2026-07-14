import {
  Activity,
  ArrowDownToLine,
  Download,
  Gauge,
  Leaf,
  Receipt,
  Sparkles,
  Sun,
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
import { useProperty } from '@/context/PropertyContext'
import { useRefresh } from '@/context/RefreshContext'
import { useAsync } from '@/hooks/useAsync'
import { pagePanel } from '@/lib/motion'
import {
  buildQuickStats,
  buildSavingsSummary,
} from '@/services/analyticsService'
import { fetchPropertyAccount } from '@/services/accountService'
import {
  fetchBillHistory,
  fetchLatestPublishedBill,
} from '@/services/billService'
import { fetchPayments } from '@/services/paymentService'
import {
  fetchCreditsForProperty,
} from '@/services/creditService'
import { fetchPendingPaymentRequest } from '@/services/paymentRequestService'
import { generateStatementPdf } from '@/services/statementService'
import { computePaymentSummary } from '@/lib/payments'
import { notify } from '@/lib/toast'
import { downloadInvoice } from '@/utils/downloadInvoice'
import { formatCurrency } from '@/utils/format'
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
      const [bill, credits, account] = await Promise.all([
        fetchLatestPublishedBill(propertyId),
        fetchCreditsForProperty(propertyId),
        fetchPropertyAccount(propertyId),
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
          overdueDays: account.overdueDays,
          currentBillId: bill.id,
          accountCredit,
        },
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
          className="space-y-6 sm:space-y-8"
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

          <AccountCreditCard balance={accountCredit} />

          {property ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
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
                Statement of Account
              </Button>
            </div>
          ) : null}

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
              title="Quick Statistics"
              description="Live snapshot of your energy profile"
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
