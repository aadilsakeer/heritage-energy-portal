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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: easeOut }}
      whileHover={{ y: -2 }}
      className={className}
    >
      <Card className="surface-card h-full transition-shadow hover:shadow-md">
        <CardContent
          className={cn(
            'flex h-full flex-col gap-4',
            size === 'large' ? 'p-6 sm:p-8' : 'p-5 sm:p-6',
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-caption">{label}</p>
            {Icon ? (
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl',
                  accent === 'primary'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-accent/10 text-accent',
                )}
                aria-hidden="true"
              >
                <Icon className="h-4 w-4" />
              </span>
            ) : null}
          </div>

          <div className="mt-auto space-y-2">
            <p
              className={cn(
                'font-semibold tracking-tight tabular-nums text-foreground',
                size === 'large' ? 'text-money-sm sm:text-3xl' : 'text-2xl',
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
                    : 'text-accent',
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
