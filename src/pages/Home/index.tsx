import { Leaf, Zap, Activity, Sun, ArrowDownToLine, Gauge } from 'lucide-react'
import { HeroCard } from '@/components/cards/HeroCard'
import { StatCard } from '@/components/cards/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionTitle } from '@/components/layout/SectionTitle'
import {
  CURRENT_BILL,
  QUICK_STATS,
  SAVINGS,
} from '@/constants'
import { formatCurrency } from '@/utils/format'

const quickStatIcons = {
  generation: Sun,
  consumption: Activity,
  export: ArrowDownToLine,
  efficiency: Gauge,
} as const

export function HomePage() {
  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <HeroCard bill={CURRENT_BILL} />

        <section>
          <SectionTitle
            title="Your Savings"
            description="Impact from solar generation this month"
          />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <StatCard
              label="Solar Savings"
              value={formatCurrency(SAVINGS.solarSavings, SAVINGS.currency)}
              trend="+8% vs last month"
              trendUp
              icon={Leaf}
              accent="primary"
              delay={0.05}
            />
            <StatCard
              label="Energy Savings"
              value={formatCurrency(SAVINGS.energySavings, SAVINGS.currency)}
              trend="+5% vs last month"
              trendUp
              icon={Zap}
              accent="accent"
              delay={0.1}
            />
          </div>
        </section>

        <section>
          <SectionTitle
            title="Quick Stats"
            description="Live snapshot of your energy profile"
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {QUICK_STATS.map((stat, index) => (
              <StatCard
                key={stat.id}
                label={stat.label}
                value={stat.value}
                trend={stat.trend}
                trendUp={stat.trendUp}
                icon={quickStatIcons[stat.id as keyof typeof quickStatIcons]}
                delay={0.05 * index}
              />
            ))}
          </div>
        </section>
      </div>
    </PageContainer>
  )
}
