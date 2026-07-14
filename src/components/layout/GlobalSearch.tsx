import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useProperty } from '@/context/PropertyContext'
import {
  searchPropertyAccount,
  type SearchResult,
} from '@/services/searchService'
import { cn } from '@/lib/utils'

export function GlobalSearch({ className }: { className?: string }) {
  const { propertyId } = useProperty()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const trimmed = query.trim()
  const canSearch = Boolean(propertyId) && trimmed.length >= 2

  useEffect(() => {
    if (!canSearch || !propertyId) return

    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      void searchPropertyAccount(propertyId, trimmed)
        .then((items) => {
          if (!cancelled) {
            setResults(items)
            setOpen(true)
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 220)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [canSearch, propertyId, trimmed])

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [])

  const visibleResults = canSearch ? results : []

  return (
    <div ref={rootRef} className={cn('relative w-full max-w-xs', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => {
            const next = event.target.value
            setQuery(next)
            if (next.trim().length < 2) {
              setResults([])
              setOpen(false)
              setLoading(false)
            }
          }}
          onFocus={() => {
            if (visibleResults.length > 0) setOpen(true)
          }}
          placeholder="Search bills, payments…"
          aria-label="Global search"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={open}
          className="h-11 pl-10"
        />
      </div>
      {open && (loading || visibleResults.length > 0 || canSearch) ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-auto rounded-2xl border border-border/70 bg-card p-1.5 shadow-elevated"
        >
          {loading ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : visibleResults.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No matches</p>
          ) : (
            visibleResults.map((result) => (
              <Link
                key={result.id}
                role="option"
                to={result.href}
                onClick={() => {
                  setOpen(false)
                  setQuery('')
                  setResults([])
                }}
                className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/70"
              >
                <p className="text-sm font-semibold tracking-tight">{result.title}</p>
                <p className="text-caption mt-0.5">
                  {result.type} · {result.subtitle}
                </p>
              </Link>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
