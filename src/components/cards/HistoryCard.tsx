import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { HistoryItem } from '@/types'
import { formatCurrency } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full text-left"
    >
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4 sm:p-5">
          <div className="relative flex flex-col items-center">
            <span
              className={cn(
                'h-3 w-3 rounded-full bg-primary ring-4 ring-primary/15',
              )}
            />
            <span className="absolute top-5 h-full w-px bg-border" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
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
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </motion.button>
  )
}
