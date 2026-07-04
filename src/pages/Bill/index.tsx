import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgePercent,
  Building2,
  PlugZap,
  Receipt,
  Sun,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { BreakdownCard } from '@/components/invoice/BreakdownCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { useProperty } from '@/context/PropertyContext'
import { easeOut } from '@/lib/motion'
import { formatCurrency, formatEnergy } from '@/utils/format'

export function BillPage() {
  const { propertyId, property, data } = useProperty()
  const { breakdown, bill } = data

  const cards = [
    {
      label: 'Generation',
      value: formatEnergy(breakdown.generation, breakdown.unit),
      icon: Sun,
      accent: 'primary' as const,
      description: 'Solar produced',
    },
    {
      label: 'Import',
      value: formatEnergy(breakdown.gridImport, breakdown.unit),
      icon: ArrowDownToLine,
      accent: 'accent' as const,
      description: 'Drawn from grid',
    },
    {
      label: 'Export',
      value: formatEnergy(breakdown.export, breakdown.unit),
      icon: ArrowUpFromLine,
      accent: 'primary' as const,
      description: 'Sent to grid',
    },
    {
      label: 'Consumption',
      value: formatEnergy(breakdown.consumption, breakdown.unit),
      icon: PlugZap,
      accent: 'accent' as const,
      description: 'Net usage',
    },
    {
      label: 'Energy Charge',
      value: formatCurrency(breakdown.energyCharge, breakdown.currency),
      icon: Zap,
      accent: 'muted' as const,
      description: 'Utility energy cost',
    },
    {
      label: 'Discount',
      value: `−${formatCurrency(breakdown.discount, breakdown.currency)}`,
      icon: BadgePercent,
      accent: 'primary' as const,
      description: 'Solar credit',
    },
    {
      label: 'Fixed Charge',
      value: formatCurrency(breakdown.fixedCharge, breakdown.currency),
      icon: Building2,
      accent: 'muted' as const,
      description: 'Service fee',
    },
    {
      label: 'Total',
      value: formatCurrency(breakdown.total, breakdown.currency),
      icon: Receipt,
      accent: 'total' as const,
      description: 'Amount payable',
    },
  ]

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
            <p className="text-sm font-medium text-primary">Bill Breakdown</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {bill.month}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Transparent charges for {property.label}
            </p>
          </header>

          <section aria-label="Energy and charges">
            <SectionHeader title="Breakdown" />
            <div className="grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
              {cards.map((card, index) => (
                <BreakdownCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  icon={card.icon}
                  accent={card.accent}
                  description={card.description}
                  delay={index * 0.04}
                />
              ))}
            </div>
          </section>
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default BillPage
