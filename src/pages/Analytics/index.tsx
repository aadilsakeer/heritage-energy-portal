import { BarChart3 } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChartCard } from '@/components/cards/ChartCard'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart'
import { MonthlyLineChart } from '@/components/charts/MonthlyLineChart'
import { PageContainer } from '@/components/layout/PageContainer'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { easeOut } from '@/lib/motion'
import { fetchAnalytics } from '@/services/analyticsService'

export function AnalyticsPage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const analyticsQuery = useAsync(
    async () => {
      if (!propertyId) {
        return {
          monthlyBills: [],
          monthlySavings: [],
          solarGeneration: [],
          consumption: [],
        }
      }
      return fetchAnalytics(propertyId)
    },
    [propertyId],
    Boolean(propertyId),
  )

  const isLoading = propertiesLoading || analyticsQuery.isLoading
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
          <header>
            <p className="text-sm font-medium text-primary">Analytics</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Energy Insights
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Monthly trends for {property?.label ?? 'property'}
            </p>
          </header>

          {!hasData || !data ? (
            <EmptyState
              icon={BarChart3}
              title="No analytics yet"
              description="Published bills will populate charts automatically."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard
                title="Monthly Bills"
                description="Amount payable over published months"
                delay={0.04}
              >
                <MonthlyBarChart data={data.monthlyBills} unit="₹" />
              </ChartCard>

              <ChartCard
                title="Monthly Savings"
                description="Discount applied from solar"
                delay={0.08}
              >
                <MonthlyBarChart
                  data={data.monthlySavings}
                  color="var(--color-chart-3)"
                  unit="₹"
                />
              </ChartCard>

              <ChartCard
                title="Solar Generation"
                description="Energy produced by your panels"
                delay={0.12}
              >
                <MonthlyLineChart
                  data={data.solarGeneration}
                  color="var(--color-primary)"
                  unit="kWh"
                />
              </ChartCard>

              <ChartCard
                title="Consumption"
                description="Calculated household usage"
                delay={0.16}
              >
                <MonthlyLineChart
                  data={data.consumption}
                  color="var(--color-accent)"
                  unit="kWh"
                />
              </ChartCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default AnalyticsPage
