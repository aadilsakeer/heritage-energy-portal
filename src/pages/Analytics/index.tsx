import { lazy, Suspense } from 'react'
import { BarChart3 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChartCard } from '@/components/cards/ChartCard'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { StatCard } from '@/components/cards/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { CountUp } from '@/components/ui/CountUp'
import { useProperty } from '@/context/PropertyContext'
import { useRefresh } from '@/context/RefreshContext'
import { useAsync } from '@/hooks/useAsync'
import { pagePanel } from '@/lib/motion'
import { fetchAnalytics } from '@/services/analyticsService'
import { formatCurrency, formatEnergy, formatDate } from '@/utils/format'

const MonthlyBarChart = lazy(() =>
  import('@/components/charts/MonthlyBarChart').then((module) => ({
    default: module.MonthlyBarChart,
  })),
)

const MonthlyLineChart = lazy(() =>
  import('@/components/charts/MonthlyLineChart').then((module) => ({
    default: module.MonthlyLineChart,
  })),
)

function ChartFallback() {
  return <LoadingSkeleton variant="chart" />
}

export function AnalyticsPage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const { refreshSignal } = useRefresh()

  const analyticsQuery = useAsync(
    async () => {
      if (!propertyId) {
        return {
          monthlyBills: [],
          monthlySavings: [],
          solarGeneration: [],
          consumption: [],
          summary: {
            highestBill: 0,
            lowestBill: 0,
            averageBill: 0,
            averageConsumption: 0,
            lifetimeSavings: 0,
            lifetimeSolarGeneration: 0,
            outstandingCredits: 0,
            creditsUsed: 0,
            totalCreditsGiven: 0,
            accountOutstanding: 0,
            pendingBills: 0,
            lastPaymentAmount: null,
            nextDue: null,
          },
        }
      }
      return fetchAnalytics(propertyId)
    },
    [propertyId, refreshSignal],
    Boolean(propertyId),
    propertyId ? `analytics:${propertyId}` : undefined,
  )

  const isLoading =
    propertiesLoading || (analyticsQuery.isLoading && !analyticsQuery.isRefreshing)
  const error = propertiesError ?? analyticsQuery.error
  const data = analyticsQuery.data

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
            void analyticsQuery.reload()
          }}
        />
      </PageContainer>
    )
  }

  const hasData = (data?.monthlyBills.length ?? 0) > 0
  const summary = data?.summary
  const emptyCharts = {
    monthlyBills: data?.monthlyBills ?? [],
    monthlySavings: data?.monthlySavings ?? [],
    consumption: data?.consumption ?? [],
    solarGeneration: data?.solarGeneration ?? [],
  }

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
          <header>
            <p className="text-caption text-primary">Analytics</p>
            <h1 className="text-display mt-2">Energy Insights</h1>
            <p className="text-caption mt-2">
              Live trends for {property?.label ?? 'property'}
            </p>
          </header>

          {!hasData ? (
            <EmptyState
              branded
              icon={BarChart3}
              title="Upload your first bill to see analytics"
              description="Charts and insights appear after a bill is published."
            />
          ) : null}

          {hasData && summary ? (
            <section>
              <SectionHeader title="Summary" />
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                <StatCard
                  label="Highest Bill"
                  value={formatCurrency(summary.highestBill)}
                  delay={0.02}
                />
                <StatCard
                  label="Lowest Bill"
                  value={formatCurrency(summary.lowestBill)}
                  delay={0.04}
                />
                <StatCard
                  label="Average Bill"
                  value={formatCurrency(summary.averageBill)}
                  delay={0.06}
                />
                <StatCard
                  label="Average Consumption"
                  value={formatEnergy(summary.averageConsumption)}
                  delay={0.08}
                />
                <StatCard
                  label="Lifetime Savings"
                  value={formatCurrency(summary.lifetimeSavings)}
                  delay={0.1}
                />
                <StatCard
                  label="Lifetime Solar Generation"
                  value={formatEnergy(summary.lifetimeSolarGeneration)}
                  delay={0.12}
                />
                <StatCard
                  label="Outstanding"
                  value={formatCurrency(summary.accountOutstanding ?? 0)}
                  delay={0.14}
                />
                <StatCard
                  label="Pending Bills"
                  value={String(summary.pendingBills ?? 0)}
                  delay={0.15}
                />
                <StatCard
                  label="Credits"
                  value={formatCurrency(summary.outstandingCredits)}
                  delay={0.16}
                />
                <StatCard
                  label="Last Payment"
                  value={
                    summary.lastPaymentAmount != null
                      ? formatCurrency(summary.lastPaymentAmount)
                      : '—'
                  }
                  delay={0.17}
                />
                <StatCard
                  label="Next Due"
                  value={
                    summary.nextDue
                      ? formatDate(summary.nextDue)
                      : '—'
                  }
                  delay={0.18}
                />
                <StatCard
                  label="Outstanding Credits"
                  value={formatCurrency(summary.outstandingCredits)}
                  delay={0.19}
                />
                <StatCard
                  label="Credits Used"
                  value={formatCurrency(summary.creditsUsed)}
                  delay={0.2}
                />
                <StatCard
                  label="Total Credits Given"
                  value={formatCurrency(summary.totalCreditsGiven)}
                  delay={0.21}
                />
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Lifetime savings:{' '}
                <CountUp
                  value={summary.lifetimeSavings}
                  currency="₹"
                  className="font-semibold text-foreground"
                />
              </p>
            </section>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Monthly Bills"
              description="Amount payable over published months"
              delay={0.04}
            >
              <Suspense fallback={<ChartFallback />}>
                <MonthlyBarChart data={emptyCharts.monthlyBills} unit="₹" />
              </Suspense>
            </ChartCard>
            <ChartCard
              title="Monthly Savings"
              description="Discount applied from solar"
              delay={0.08}
            >
              <Suspense fallback={<ChartFallback />}>
                <MonthlyBarChart
                  data={emptyCharts.monthlySavings}
                  color="var(--color-chart-3)"
                  unit="₹"
                />
              </Suspense>
            </ChartCard>
            <ChartCard
              title="Monthly Consumption"
              description="Calculated household usage"
              delay={0.12}
            >
              <Suspense fallback={<ChartFallback />}>
                <MonthlyLineChart
                  data={emptyCharts.consumption}
                  color="var(--color-accent)"
                  unit="kWh"
                />
              </Suspense>
            </ChartCard>
            <ChartCard
              title="Solar Generation"
              description="Energy produced by your panels"
              delay={0.16}
            >
              <Suspense fallback={<ChartFallback />}>
                <MonthlyLineChart
                  data={emptyCharts.solarGeneration}
                  color="var(--color-primary)"
                  unit="kWh"
                />
              </Suspense>
            </ChartCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default AnalyticsPage
