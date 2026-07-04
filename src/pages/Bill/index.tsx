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
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { BreakdownCard } from '@/components/invoice/BreakdownCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { easeOut } from '@/lib/motion'
import { fetchLatestPublishedBill } from '@/services/billService'
import { formatCurrency, formatEnergy, formatMonthLabel } from '@/utils/format'
import { toBillBreakdown } from '@/utils/mappers'

export function BillPage() {
  const {
    property,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const billQuery = useAsync(
    async () => {
      if (!propertyId) return null
      return fetchLatestPublishedBill(propertyId)
    },
    [propertyId],
    Boolean(propertyId),
  )

  const isLoading = propertiesLoading || billQuery.isLoading
  const error = propertiesError ?? billQuery.error

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
            void billQuery.reload()
          }}
        />
      </PageContainer>
    )
  }

  const bill = billQuery.data

  if (!bill) {
    return (
      <PageContainer>
        <EmptyState
          icon={Receipt}
          title="No bill available"
          description={`Publish a bill for ${property?.label ?? 'this property'} to see the breakdown.`}
        />
      </PageContainer>
    )
  }

  const breakdown = toBillBreakdown(bill)

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
      description: 'Generation − (Export − Import)',
    },
    {
      label: 'Energy Charge',
      value: formatCurrency(breakdown.energyCharge, breakdown.currency),
      icon: Zap,
      accent: 'muted' as const,
      description: 'Consumption × Rate',
    },
    {
      label: 'Discount',
      value: `−${formatCurrency(breakdown.discount, breakdown.currency)}`,
      icon: BadgePercent,
      accent: 'primary' as const,
      description: 'Energy × Discount %',
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
      description: 'Energy − Discount + Fixed Charge',
    },
  ]

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        <motion.div
          key={propertyId ?? bill.id}
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
            <p className="text-sm font-medium text-primary">Bill Breakdown</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              {formatMonthLabel(bill.billingMonth)}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Latest published bill for {property?.label ?? 'property'}
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
