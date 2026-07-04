import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BadgePercent,
  Building2,
  Download,
  PlugZap,
  Receipt,
  Sun,
  Zap,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { BreakdownCard } from '@/components/invoice/BreakdownCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { Button } from '@/components/ui/button'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/toast'
import { easeOut } from '@/lib/motion'
import {
  fetchBillById,
  fetchLatestPublishedBill,
} from '@/services/billService'
import { fetchPayments } from '@/services/paymentService'
import { computePaymentSummary, formatBillStatus } from '@/lib/payments'
import { PaymentHistory } from '@/components/invoice/PaymentHistory'
import { billStatusVariant } from '@/lib/billStatus'
import { Badge } from '@/components/ui/badge'
import { downloadInvoice } from '@/utils/downloadInvoice'

import { formatCurrency, formatEnergy, formatMonthLabel } from '@/utils/format'
import { toBillBreakdown } from '@/utils/mappers'

export function BillPage() {
  const { billId } = useParams()
  const {
    property,
    properties,
    propertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const billQuery = useAsync(
    async () => {
      if (billId) {
        const bill = await fetchBillById(billId)
        if (!bill) return null
        const payments = await fetchPayments(bill.id)
        return {
          bill,
          payments,
          summary: computePaymentSummary(bill.tenantTotal ?? 0, payments),
        }
      }
      if (!propertyId) return null
      const bill = await fetchLatestPublishedBill(propertyId)
      if (!bill) return null
      const payments = await fetchPayments(bill.id)
      return {
        bill,
        payments,
        summary: computePaymentSummary(bill.tenantTotal ?? 0, payments),
      }
    },
    [billId, propertyId],
    Boolean(billId || propertyId),
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

  const bill = billQuery.data?.bill ?? null
  const payments = billQuery.data?.payments ?? []
  const paymentSummary = billQuery.data?.summary
  const billProperty =
    properties.find((item) => item.id === bill?.propertyId) ?? property

  if (!bill) {
    return (
      <PageContainer>
        <EmptyState
          icon={Receipt}
          title="No published bill."
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
          key={bill.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="space-y-6 sm:space-y-8"
        >
          <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-primary">Bill Breakdown</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatMonthLabel(bill.billingMonth)}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {billProperty?.label ?? 'Property'} ·{' '}
                <Badge
                  variant={billStatusVariant[bill.status]}
                  className="ml-1 capitalize"
                >
                  {formatBillStatus(bill.status)}
                </Badge>
              </p>
            </div>
            {billProperty ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void downloadInvoice(bill, billProperty)
                    .then(() => notify.success('Invoice downloaded'))
                    .catch((err: unknown) =>
                      notify.error(
                        err instanceof Error ? err.message : 'Download failed',
                      ),
                    )
                }}

              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            ) : null}
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

          <section aria-label="Owner paid amounts">
            <SectionHeader
              title="Owner Paid"
              description="Not included in tenant bill"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BreakdownCard
                label="Security Deposit"
                value={formatCurrency(breakdown.securityDeposit)}
                icon={Building2}
                accent="muted"
              />
              <BreakdownCard
                label="Arrears"
                value={formatCurrency(breakdown.arrears)}
                icon={Receipt}
                accent="muted"
              />
            </div>
          </section>

          {paymentSummary ? (
            <PaymentHistory
              status={bill.status}
              summary={paymentSummary}
              payments={payments}
            />
          ) : null}
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default BillPage
