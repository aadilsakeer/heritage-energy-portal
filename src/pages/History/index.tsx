import { useNavigate } from 'react-router-dom'
import { HistoryCard } from '@/components/cards/HistoryCard'
import { PageContainer } from '@/components/layout/PageContainer'
import { HISTORY_ITEMS, ROUTES } from '@/constants'

export function HistoryPage() {
  const navigate = useNavigate()

  return (
    <PageContainer>
      <div className="space-y-6 sm:space-y-8">
        <div>
          <p className="text-sm font-medium text-primary">History</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Billing Timeline
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Past invoices and publication status
          </p>
        </div>

        <div className="relative space-y-3">
          {HISTORY_ITEMS.map((item, index) => (
            <HistoryCard
              key={item.id}
              item={item}
              index={index}
              onClick={() => navigate(ROUTES.bill)}
            />
          ))}
        </div>
      </div>
    </PageContainer>
  )
}
