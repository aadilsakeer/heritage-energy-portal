import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { HistoryItem } from '@/types'
import { easeOut } from '@/lib/motion'
import { formatCurrency } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface HistoryCardProps {
  item: HistoryItem
  index?: number
  onClick?: () => void
}

export function HistoryCard({ item, index = 0, onClick }: HistoryCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: easeOut }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      aria-label={`View bill for ${item.month}, ${formatCurrency(item.amount, item.currency)}, ${item.status}`}
      className="w-full rounded-3xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="border-border/50 bg-card/80 shadow-soft backdrop-blur-xl transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-medium text-foreground">{item.month}</p>
              <Badge variant="success" className="capitalize">
                {item.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Monthly invoice</p>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-base font-semibold tracking-tight text-foreground">
              {formatCurrency(item.amount, item.currency)}
            </p>
            <ChevronRight
              className="h-4 w-4 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
        </CardContent>
      </Card>
    </motion.button>
  )
}
