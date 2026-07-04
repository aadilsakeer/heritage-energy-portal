import { ChartCard } from '@/components/cards/ChartCard'
import { MonthlyBarChart } from '@/components/charts/MonthlyBarChart'
import { MonthlyLineChart } from '@/components/charts/MonthlyLineChart'
import { PageContainer } from '@/components/layout/PageContainer'
import {
  MONTHLY_BILLS,
  MONTHLY_CONSUMPTION,
  MONTHLY_SAVINGS,
  SOLAR_GENERATION,
} from '@/constants'

export function AnalyticsPage() {
  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Analytics</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Energy Insights
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monthly trends across bills, usage, savings, and generation
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Monthly Bills"
            description="Amount payable over the last 6 months"
            delay={0.05}
          >
            <MonthlyBarChart data={MONTHLY_BILLS} unit="₹" />
          </ChartCard>

          <ChartCard
            title="Monthly Consumption"
            description="Household energy usage in kWh"
            delay={0.1}
          >
            <MonthlyLineChart
              data={MONTHLY_CONSUMPTION}
              color="var(--color-accent)"
              unit="kWh"
            />
          </ChartCard>

          <ChartCard
            title="Monthly Savings"
            description="Solar-driven cost savings"
            delay={0.15}
          >
            <MonthlyBarChart
              data={MONTHLY_SAVINGS}
              color="var(--color-chart-3)"
              unit="₹"
            />
          </ChartCard>

          <ChartCard
            title="Solar Generation"
            description="Energy produced by your panels"
            delay={0.2}
          >
            <MonthlyLineChart
              data={SOLAR_GENERATION}
              color="var(--color-primary)"
              unit="kWh"
            />
          </ChartCard>
        </div>
      </div>
    </PageContainer>
  )
}
