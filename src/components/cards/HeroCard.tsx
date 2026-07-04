import { Download, Calculator, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { CurrentBill } from '@/types'
import { ROUTES } from '@/constants'
import { formatCurrency, formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface HeroCardProps {
  bill: CurrentBill
}

export function HeroCard({ bill }: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-emerald-700 text-primary-foreground shadow-soft dark:from-primary dark:via-emerald-600 dark:to-emerald-800">
        <CardContent className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />

          <div className="relative space-y-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-primary-foreground/80">
                  Current Bill
                </p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                  {bill.month}
                </h1>
              </div>
              <Badge
                variant="secondary"
                className="border-0 bg-white/15 text-primary-foreground capitalize backdrop-blur-sm"
              >
                {bill.status}
              </Badge>
            </div>

            <div>
              <p className="text-sm text-primary-foreground/75">Amount Due</p>
              <p className="mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
                {formatCurrency(bill.amountDue, bill.currency)}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-sm text-primary-foreground/90 backdrop-blur-sm">
                <CalendarDays className="h-4 w-4" />
                Due {formatDate(bill.dueDate)}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                variant="secondary"
                className="bg-white text-emerald-800 hover:bg-white/90"
              >
                <Link to={ROUTES.bill}>
                  <Calculator className="h-4 w-4" />
                  View Calculation
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/25 bg-white/10 text-primary-foreground hover:bg-white/15 hover:text-primary-foreground"
              >
                <Download className="h-4 w-4" />
                Download Invoice
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
