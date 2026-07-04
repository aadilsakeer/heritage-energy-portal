import {
  Activity,
  ArrowDownToLine,
  Gauge,
  Leaf,
  Receipt,
  Sparkles,
  Sun,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { AccountCreditCard } from '@/components/cards/AccountCreditCard'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { HeroCard } from '@/components/cards/HeroCard'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { StatCard } from '@/components/cards/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { easeOut } from '@/lib/motion'
import {
  buildQuickStats,
  buildSavingsSummary,
} from '@/services/analyticsService'
import {
  fetchBillHistory,
  fetchLatestPublishedBill,
} from '@/services/billService'
import { fetchPayments } from '@/services/paymentService'
import { fetchPropertyCreditBalance } from '@/services/creditService'
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

  const latestQuery = useAsync(
    async () => {
      if (!propertyId) return null
      const [bill, accountCredit] = await Promise.all([
        fetchLatestPublishedBill(propertyId),
        fetchPropertyCreditBalance(propertyId),
      ])
      if (!bill) {
        return { bill: null, summary: null, accountCredit }
      }
      const payments = await fetchPayments(bill.id)
      return {
        bill,
        summary: computePaymentSummary(bill, payments),
        accountCredit,
      }
    },
    [propertyId],
    Boolean(propertyId),
  )

  const historyQuery = useAsync(
    async () => {
      if (!propertyId) return []
      return fetchBillHistory(propertyId)
    },
    [propertyId],
    Boolean(propertyId),
  )

  const isLoading =
    propertiesLoading || latestQuery.isLoading || historyQuery.isLoading
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
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="space-y-6 sm:space-y-8"
        >
          {latestBill ? (
            <HeroCard
              bill={toCurrentBill(
                latestBill,
                property?.label,
                latestSummary ?? undefined,
                accountCredit,
              )}
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
          ) : (
            <EmptyState
              icon={Receipt}
              title="No bill has been published yet."
              description={`Publish a bill for ${property?.label ?? 'this property'} to see amounts and savings.`}
            />
          )}

          <AccountCreditCard balance={accountCredit} />

          <section aria-label="Savings">
            <SectionHeader
              title="Savings"
              description={`Impact for ${property?.label ?? 'property'}`}
            />
            {!savings ? (
              <EmptyState
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
