import { AnimatePresence, motion } from 'framer-motion'
import { ChartCard } from '@/components/cards/ChartCard'
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart'
import { MonthlyLineChart } from '@/components/charts/MonthlyLineChart'
import { PageContainer } from '@/components/layout/PageContainer'
import { useProperty } from '@/context/PropertyContext'
import { easeOut } from '@/lib/motion'

export function AnalyticsPage() {
  const { propertyId, property, data } = useProperty()

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        <motion.div
          key={propertyId}
          id={`property-panel-${propertyId}`}
          role="tabpanel"
          aria-labelledby={`property-tab-${propertyId}`}
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
              Monthly trends for {property.label}
            </p>
          </header>

          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard
              title="Monthly Bills"
              description="Amount payable over the last 6 months"
              delay={0.04}
            >
              <MonthlyBarChart data={data.monthlyBills} unit="₹" />
            </ChartCard>

            <ChartCard
              title="Monthly Savings"
              description="Solar-driven cost savings"
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
              description="Household energy usage in kWh"
              delay={0.16}
            >
              <MonthlyLineChart
                data={data.monthlyConsumption}
                color="var(--color-accent)"
                unit="kWh"
              />
            </ChartCard>
          </div>
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default AnalyticsPage
