import type { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface BreakdownCardProps {
  label: string
  value: string
  icon: LucideIcon
  accent?: 'primary' | 'accent' | 'muted'
  delay?: number
}

const accentStyles = {
  primary: 'bg-primary/10 text-primary',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-muted text-muted-foreground',
} as const

export function BreakdownCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  delay = 0,
}: BreakdownCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-start gap-4 p-5">
          <span
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
              accentStyles[accent],
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
