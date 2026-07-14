import { useMemo, useState } from 'react'
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
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search timeline…"
          aria-label="Search timeline"
          className="sm:max-w-xs"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TYPE_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setType(filter.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              type === filter.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <Card className="surface-card">
        <CardContent className="space-y-0 p-0">
          {visible.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No timeline entries match your filters.
            </p>
          ) : (
            <ul className="divide-y divide-border/40">
              {visible.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{entry.description}</p>
                      <Badge variant="outline" className="capitalize">
                        {entry.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                      {entry.reference ? ` · Ref ${entry.reference}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-sm tabular-nums">
                    {entry.debit > 0 ? (
                      <p className="font-medium">{formatCurrency(entry.debit)}</p>
                    ) : null}
                    {entry.credit > 0 ? (
                      <p className="font-medium text-emerald-600 dark:text-emerald-400">
                        −{formatCurrency(entry.credit)}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted-foreground">
                      Bal {formatCurrency(entry.runningBalance)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > maxVisible ? (
            <p className="border-t border-border/40 px-4 py-2 text-xs text-muted-foreground">
              Showing {maxVisible} of {filtered.length} entries
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
