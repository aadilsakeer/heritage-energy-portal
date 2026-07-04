import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'

interface StatCardProps {
  label: string
  value: string
  trend?: string
  trendUp?: boolean
  icon?: LucideIcon
  accent?: 'primary' | 'accent'
  delay?: number
  className?: string
}

export function StatCard({
  label,
  value,
  trend,
  trendUp,
  icon: Icon,
  accent = 'primary',
  delay = 0,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card className="h-full transition-shadow hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">{label}</p>
            {Icon ? (
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-2xl',
                  accent === 'primary'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent',
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
          </div>

          <div className="mt-auto space-y-2">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {trend ? (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  trendUp
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-accent',
                )}
              >
                {trendUp ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {trend}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
