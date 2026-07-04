import {
  Activity,
  ArrowDownToLine,
  Gauge,
  Leaf,
  Sparkles,
  Sun,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { HeroCard } from '@/components/cards/HeroCard'
import { StatCard } from '@/components/cards/StatCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { useProperty } from '@/context/PropertyContext'
import { easeOut } from '@/lib/motion'
import { formatCurrency } from '@/utils/format'

const quickStatIcons = {
  generation: Sun,
  consumption: Activity,
  export: ArrowDownToLine,
  efficiency: Gauge,
} as const

export function HomePage() {
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
          <HeroCard bill={data.bill} />

          <section aria-label="Savings">
            <SectionHeader
              title="Savings"
              description={`Impact for ${property.label}`}
            />
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <StatCard
                label="Saved This Month"
                value={formatCurrency(
                  data.savings.savedThisMonth,
                  data.savings.currency,
                )}
                trend="+8% vs last month"
                trendUp
                icon={Leaf}
                accent="primary"
                size="large"
                delay={0.04}
              />
              <StatCard
                label="Lifetime Savings"
                value={formatCurrency(
                  data.savings.lifetimeSavings,
                  data.savings.currency,
                )}
                trend="Since install"
                trendUp
                icon={Sparkles}
                accent="accent"
                size="large"
                delay={0.08}
              />
            </div>
          </section>

          <section aria-label="Quick statistics">
            <SectionHeader
              title="Quick Statistics"
              description="Live snapshot of your energy profile"
            />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {data.quickStats.map((stat, index) => (
                <StatCard
                  key={stat.id}
                  label={stat.label}
                  value={stat.value}
                  trend={stat.trend}
                  trendUp={stat.trendUp}
                  icon={quickStatIcons[stat.id as keyof typeof quickStatIcons]}
                  delay={0.04 * index}
                />
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default HomePage
