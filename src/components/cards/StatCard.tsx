import type { LucideIcon } from 'lucide-react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { easeOut } from '@/lib/motion'
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
  size?: 'default' | 'large'
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
  size = 'default',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(delay, 0.2), ease: easeOut }}
      className={className}
    >
      <Card className="surface-card h-full transition-shadow duration-200 hover:shadow-elevated">
        <CardContent
          className={cn(
            'flex h-full flex-col gap-5',
            size === 'large' ? 'p-6 sm:p-7' : 'p-5',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="kpi-label">{label}</p>
            {Icon ? (
              <span
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-xl',
                  accent === 'primary'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/15 text-accent-foreground',
                )}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </span>
            ) : null}
          </div>

          <div className="mt-auto space-y-2">
            <p
              className={cn(
                'tracking-tight tabular-nums text-foreground',
                size === 'large' ? 'text-money-sm' : 'text-xl font-semibold sm:text-2xl',
              )}
            >
              {value}
            </p>
            {trend ? (
              <div
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  trendUp
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-muted-foreground',
                )}
              >
                {trendUp ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{trend}</span>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
