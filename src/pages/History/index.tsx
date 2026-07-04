import { Receipt } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/cards/EmptyState'
import { HistoryCard } from '@/components/cards/HistoryCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { ROUTES } from '@/constants'
import { useProperty } from '@/context/PropertyContext'
import { easeOut } from '@/lib/motion'

export function HistoryPage() {
  const navigate = useNavigate()
  const { propertyId, property, data } = useProperty()
  const items = data.history

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
            <p className="text-sm font-medium text-primary">History</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Billing Timeline
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Past invoices for {property.label}
            </p>
          </header>

          {items.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No bills yet"
              description="Published invoices for this property will appear here."
            />
          ) : (
            <div className="space-y-3" role="list" aria-label="Bill history">
              {items.map((item, index) => (
                <div key={item.id} role="listitem">
                  <HistoryCard
                    item={item}
                    index={index}
                    onClick={() => navigate(ROUTES.bill)}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </PageContainer>
  )
}

export default HistoryPage
