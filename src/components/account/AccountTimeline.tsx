import { useMemo, useState } from 'react'
import {
  Banknote,
  Bell,
  FileCheck2,
  FileText,
  Gift,
  Lock,
  SlidersHorizontal,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { LedgerEntry, LedgerTransactionType } from '@/lib/account'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/lib/utils'

const TYPE_FILTERS: Array<{ value: LedgerTransactionType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'bill_published', label: 'Bills' },
  { value: 'payment', label: 'Payments' },
  { value: 'credit', label: 'Credits' },
  { value: 'credit_applied', label: 'Applied' },
  { value: 'adjustment', label: 'Adjustments' },
  { value: 'manual_credit', label: 'Manual' },
  { value: 'reminder', label: 'Reminders' },
  { value: 'bill_closed', label: 'Closed' },
]

const TYPE_ICON: Record<LedgerTransactionType, typeof FileText> = {
  bill_published: FileText,
  payment: Banknote,
  credit: Gift,
  credit_applied: Sparkles,
  adjustment: SlidersHorizontal,
  manual_credit: Wallet,
  carry_forward: FileCheck2,
  reminder: Bell,
  bill_closed: Lock,
}

interface AccountTimelineProps {
  entries: LedgerEntry[]
  maxVisible?: number
}

export function AccountTimeline({
  entries,
  maxVisible = 80,
}: AccountTimelineProps) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState<LedgerTransactionType | 'all'>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return entries.filter((entry) => {
      if (type !== 'all' && entry.type !== type) return false
      if (!q) return true
      return `${entry.description} ${entry.reference ?? ''} ${entry.type}`
        .toLowerCase()
        .includes(q)
    })
  }, [entries, search, type])

  const visible = filtered.slice(0, maxVisible)

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search timeline…"
        aria-label="Search timeline"
        className="sm:max-w-sm"
      />
      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setType(filter.value)}
            className={cn(
              'min-h-9 rounded-full px-3.5 py-1.5 text-xs font-semibold tracking-tight transition-colors duration-150',
              type === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Card className="surface-card overflow-hidden">
        <CardContent className="p-0">
          {visible.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No timeline entries match your filters.
            </p>
          ) : (
            <ul className="timeline-rail space-y-0 py-4 pr-4">
              {visible.map((entry) => {
                const Icon = TYPE_ICON[entry.type] ?? FileText
                const isPartialPayment =
                  entry.type === 'payment' && entry.runningBalance > 0
                const typeLabel = isPartialPayment
                  ? 'Partial Payment'
                  : entry.type.replace(/_/g, ' ')
                return (
                  <li key={entry.id} className="relative pb-5 last:pb-0">
                    <span className="absolute left-0 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 bg-card text-primary shadow-soft">
                      <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                    </span>
                    <div className="ml-2 rounded-2xl border border-border/50 bg-muted/20 px-4 py-3.5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold tracking-tight">
                              {isPartialPayment
                                ? entry.description.replace(
                                    /^Payment/,
                                    'Partial Payment',
                                  )
                                : entry.description}
                            </p>
                            <Badge
                              variant={isPartialPayment ? 'accent' : 'outline'}
                              className="capitalize"
                            >
                              {typeLabel}
                            </Badge>
                          </div>
                          <p className="text-caption">
                            {formatDate(entry.date)}
                            {entry.reference ? ` · Ref ${entry.reference}` : ''}
                          </p>
                        </div>
                        <div className="text-right text-sm tabular-nums">
                          {entry.debit > 0 ? (
                            <p className="font-semibold">
                              {formatCurrency(entry.debit)}
                            </p>
                          ) : null}
                          {entry.credit > 0 ? (
                            <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                              −{formatCurrency(entry.credit)}
                            </p>
                          ) : null}
                          <p className="text-caption mt-1">
                            Bal {formatCurrency(entry.runningBalance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {filtered.length > maxVisible ? (
            <p className="border-t border-border/40 px-4 py-2.5 text-xs text-muted-foreground">
              Showing {maxVisible} of {filtered.length} entries
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
