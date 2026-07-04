import { Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { easeOut } from '@/lib/motion'
import { formatCurrency } from '@/utils/format'
import { Card, CardContent } from '@/components/ui/card'

interface AccountCreditCardProps {
  balance: number
}

export function AccountCreditCard({ balance }: AccountCreditCardProps) {
  if (balance <= 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: easeOut }}
    >
      <Card className="border-emerald-500/20 bg-emerald-500/10 shadow-soft backdrop-blur-xl">
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Account Credit
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-900 dark:text-emerald-100">
                {formatCurrency(balance)}
              </p>
              <p className="mt-2 text-sm text-emerald-800/80 dark:text-emerald-200/80">
                This credit will automatically reduce your next bill.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
