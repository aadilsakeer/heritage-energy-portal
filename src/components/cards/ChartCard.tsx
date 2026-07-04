import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { easeOut } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  children: ReactNode
  delay?: number
  className?: string
  action?: ReactNode
}

export function ChartCard({
  title,
  description,
  children,
  delay = 0,
  className,
  action,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: easeOut }}
      className={className}
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card/80 shadow-soft backdrop-blur-xl">
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </CardHeader>
        <CardContent className={cn('pt-0')}>{children}</CardContent>
      </Card>
    </motion.div>
  )
}
