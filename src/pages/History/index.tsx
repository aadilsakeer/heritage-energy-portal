import { useMemo, useState } from 'react'
import { Download, Receipt, Search } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/cards/EmptyState'
import { ErrorState } from '@/components/cards/ErrorState'
import { HistoryCard } from '@/components/cards/HistoryCard'
import { LoadingSkeleton } from '@/components/cards/LoadingSkeleton'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROUTES } from '@/constants'
import { useProperty } from '@/context/PropertyContext'
import { useAsync } from '@/hooks/useAsync'
import { notify } from '@/lib/toast'
import { easeOut } from '@/lib/motion'
import { fetchBillById, fetchBillHistory } from '@/services/billService'
import { downloadInvoice } from '@/utils/downloadInvoice'
import { toHistoryItem } from '@/utils/mappers'


export function HistoryPage() {
  const navigate = useNavigate()
  const {
    properties,
    property,
    propertyId,
    setPropertyId,
    isLoading: propertiesLoading,
    error: propertiesError,
    refreshProperties,
  } = useProperty()

  const [search, setSearch] = useState('')
  const [filterPropertyId, setFilterPropertyId] = useState<string>('all')

  const historyQuery = useAsync(async () => {
    if (filterPropertyId === 'all') return fetchBillHistory()
    return fetchBillHistory(filterPropertyId)
  }, [filterPropertyId])

  const isLoading = propertiesLoading || historyQuery.isLoading
  const error = propertiesError ?? historyQuery.error

  const items = useMemo(() => {
    const propertyMap = new Map(properties.map((item) => [item.id, item.label]))
    return (historyQuery.data ?? [])
      .map((bill) => toHistoryItem(bill, propertyMap.get(bill.propertyId)))
      .filter((item) =>
        item.month.toLowerCase().includes(search.trim().toLowerCase()),
      )
  }, [historyQuery.data, properties, search])

  const rawBills = historyQuery.data ?? []
  const isFilteredEmpty = rawBills.length > 0 && items.length === 0

  const handleDownload = async (billId: string) => {
    try {
      const bill = await fetchBillById(billId)
      if (!bill) throw new Error('Bill not found')
      const billProperty =
        properties.find((item) => item.id === bill.propertyId) ?? property
      if (!billProperty) throw new Error('Property not found')
      await downloadInvoice(bill, billProperty)
      notify.success('Invoice downloaded')

    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Download failed')
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingSkeleton variant="list" count={4} />
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
            void historyQuery.reload()
          }}
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${filterPropertyId}-${search}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: easeOut }}
          className="space-y-6 sm:space-y-8"
        >
          <header>
            <p className="text-sm font-medium text-primary">History</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Billing Timeline
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Newest bills first
            </p>
          </header>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search month"
                aria-label="Search month"
                className="pl-9"
              />
            </div>
            <label className="sr-only" htmlFor="history-property-filter">
              Property filter
            </label>
            <select
              id="history-property-filter"
              value={filterPropertyId}
              onChange={(event) => {
                const value = event.target.value
                setFilterPropertyId(value)
                if (value !== 'all') setPropertyId(value)
              }}
              className="h-11 rounded-2xl border border-input bg-background px-3 text-sm shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="all">All properties</option>
              {properties.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title={isFilteredEmpty ? 'No matching bills' : 'No bills available.'}
              description={
                isFilteredEmpty
                  ? 'Try a different month or property filter.'
                  : 'Published bills will appear here once uploaded.'
              }
            />
          ) : (
            <div className="space-y-3" role="list" aria-label="Bill history">
              {items.map((item, index) => (
                <div key={item.id} role="listitem" className="space-y-2">
                  <HistoryCard
                    item={item}
                    index={index}
                    onClick={() => navigate(`${ROUTES.bill}/${item.id}`)}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDownload(item.id)}
                      aria-label={`Download invoice for ${item.month}`}
                    >
                      <Download className="h-4 w-4" />
                      Download Invoice
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {propertyId ? (
            <p className="text-xs text-muted-foreground">
              Dashboard property: {property?.label}
            </p>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default HistoryPage
