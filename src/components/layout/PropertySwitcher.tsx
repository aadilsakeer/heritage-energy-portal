import type { KeyboardEvent } from 'react'
import { Building2, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { useProperty } from '@/context/PropertyContext'
import { cn } from '@/lib/utils'
import { springSegment } from '@/lib/motion'
import { Skeleton } from '@/components/ui/skeleton'

const propertyMeta: Record<
  string,
  { Icon: typeof Home; emoji: string }
> = {
  home: { Icon: Home, emoji: '🏠' },
  heritage: { Icon: Building2, emoji: '🏢' },
}

export function PropertySwitcher() {
  const { properties, propertyId, setPropertyId, isLoading } = useProperty()

  if (isLoading) {
    return (
      <Skeleton
        className="h-[52px] w-full rounded-2xl"
        aria-label="Loading properties"
      />
    )
  }

  if (properties.length === 0) {
    return null
  }

  return (
    <div
      role="tablist"
      aria-label="Select property"
      className="relative grid grid-cols-2 gap-1.5 rounded-2xl border border-border/50 bg-muted/50 p-1.5 shadow-soft backdrop-blur-xl"
    >
      {properties.map((property) => {
        const isActive = property.id === propertyId
        const meta = propertyMeta[property.slug] ?? propertyMeta.heritage
        const Icon = meta.Icon

        return (
          <button
            key={property.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`property-panel-${property.id}`}
            id={`property-tab-${property.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setPropertyId(property.id)}
            onKeyDown={(event) =>
              handleKeyDown(
                event,
                property.id,
                properties.map((item) => item.id),
                setPropertyId,
              )
            }
            className={cn(
              'relative z-10 flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="property-segment"
                className="absolute inset-0 rounded-xl border border-primary/10 bg-card shadow-soft"
                transition={springSegment}
                aria-hidden="true"
              />
            ) : null}
            <span className="relative z-10 text-base leading-none" aria-hidden="true">
              {meta.emoji}
            </span>
            <Icon className="relative z-10 hidden h-4 w-4 sm:block" aria-hidden="true" />
            <span className="relative z-10 truncate">
              <span className="sm:hidden">{property.shortLabel}</span>
              <span className="hidden sm:inline">{property.label}</span>
            </span>
          </button>
        )
      })}
    </div>
  )
}

function handleKeyDown(
  event: KeyboardEvent<HTMLButtonElement>,
  currentId: string,
  ids: string[],
  setPropertyId: (id: string) => void,
) {
  const index = ids.indexOf(currentId)
  if (index < 0) return

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    const next = ids[(index + 1) % ids.length]
    setPropertyId(next)
    document.getElementById(`property-tab-${next}`)?.focus()
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    const prev = ids[(index - 1 + ids.length) % ids.length]
    setPropertyId(prev)
    document.getElementById(`property-tab-${prev}`)?.focus()
  }
}
