import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { easeOut } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface BreakdownCardProps {
  label: string
  value: string
  icon: LucideIcon
  accent?: 'primary' | 'accent' | 'muted' | 'total'
  description?: string
  delay?: number
}

const accentStyles = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-muted text-muted-foreground',
  total: 'bg-primary text-primary-foreground',
} as const

export function BreakdownCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  description,
  delay = 0,
}: BreakdownCardProps) {
  const isTotal = accent === 'total'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: easeOut }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={cn(
          'h-full border-border/50 bg-card/80 shadow-soft backdrop-blur-xl',
          isTotal && 'border-primary/20 bg-primary/5 dark:bg-primary/10',
        )}
      >
        <CardContent className="flex items-start gap-4 p-5 sm:p-6">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              accentStyles[accent],
            )}
            aria-hidden="true"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p
              className={cn(
                'mt-1 font-semibold tracking-tight text-foreground',
                isTotal ? 'text-2xl text-primary' : 'text-xl',
              )}
            >
              {value}
            </p>
            {description ? (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
