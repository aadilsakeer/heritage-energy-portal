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
import { motion } from 'framer-motion'
import { BreakdownCard } from '@/components/invoice/BreakdownCard'
import { BreakdownRow } from '@/components/invoice/BreakdownRow'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionTitle } from '@/components/layout/SectionTitle'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BILL_BREAKDOWN, CURRENT_BILL } from '@/constants'
import { formatCurrency, formatEnergy } from '@/utils/format'

export function BillPage() {
  const energyCards = [
    {
      label: 'Generation',
      value: formatEnergy(BILL_BREAKDOWN.generation, BILL_BREAKDOWN.unit),
      icon: Sun,
      accent: 'primary' as const,
    },
    {
      label: 'Import',
      value: formatEnergy(BILL_BREAKDOWN.gridImport, BILL_BREAKDOWN.unit),
      icon: ArrowDownToLine,
      accent: 'accent' as const,
    },
    {
      label: 'Export',
      value: formatEnergy(BILL_BREAKDOWN.export, BILL_BREAKDOWN.unit),
      icon: ArrowUpFromLine,
      accent: 'primary' as const,
    },
    {
      label: 'Consumption',
      value: formatEnergy(BILL_BREAKDOWN.consumption, BILL_BREAKDOWN.unit),
      icon: PlugZap,
      accent: 'accent' as const,
    },
  ]

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">Bill Breakdown</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {CURRENT_BILL.month}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Transparent view of energy flow and charges
          </p>
        </div>

        <section>
          <SectionTitle title="Energy Flow" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {energyCards.map((card, index) => (
              <BreakdownCard
                key={card.label}
                label={card.label}
                value={card.value}
                icon={card.icon}
                accent={card.accent}
                delay={index * 0.05}
              />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="Charges" />
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Calculation Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <BreakdownRow
                  label="Energy Charge"
                  value={formatCurrency(
                    BILL_BREAKDOWN.energyCharge,
                    BILL_BREAKDOWN.currency,
                  )}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Zap className="h-3.5 w-3.5" />
                  Grid import billed at utility rates
                </div>

                <BreakdownRow
                  label="Solar Discount"
                  value={`−${formatCurrency(
                    BILL_BREAKDOWN.discount,
                    BILL_BREAKDOWN.currency,
                  )}`}
                  muted
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgePercent className="h-3.5 w-3.5" />
                  Credit from exported generation
                </div>

                <BreakdownRow
                  label="Fixed Charge"
                  value={formatCurrency(
                    BILL_BREAKDOWN.fixedCharge,
                    BILL_BREAKDOWN.currency,
                  )}
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  Connection and service fee
                </div>

                <BreakdownRow
                  label="Total Payable"
                  value={formatCurrency(
                    BILL_BREAKDOWN.total,
                    BILL_BREAKDOWN.currency,
                  )}
                  emphasize
                />
              </CardContent>
            </Card>
          </motion.div>
        </section>
      </div>
    </PageContainer>
  )
}
