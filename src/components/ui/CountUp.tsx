import { motion } from 'framer-motion'
import { formatCurrency } from '@/utils/format'

interface CountUpProps {
  value: number
  currency?: string
  className?: string
}

export function CountUp({ value, currency, className }: CountUpProps) {
  const label = currency
    ? formatCurrency(value, currency)
    : value.toLocaleString('en-IN', { maximumFractionDigits: 2 })

  return (
    <motion.span
      key={label}
      initial={{ opacity: 0.35, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={className}
    >
      {label}
    </motion.span>
  )
}
