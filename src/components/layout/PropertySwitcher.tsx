import type { KeyboardEvent } from 'react'
import { Building2, Home } from 'lucide-react'
import { motion } from 'framer-motion'
import { PROPERTIES } from '@/constants'
import { useProperty } from '@/context/PropertyContext'
import type { PropertyId } from '@/types'
import { cn } from '@/lib/utils'

const icons = {
  home: Home,
  heritage: Building2,
} as const

export function PropertySwitcher() {
  const { propertyId, setPropertyId } = useProperty()

  return (
    <div
      role="tablist"
      aria-label="Select property"
      className="relative grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-muted/60 p-1 shadow-soft backdrop-blur-xl"
    >
      {PROPERTIES.map((property) => {
        const isActive = property.id === propertyId
        const Icon = icons[property.id]

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
              handleKeyDown(event, property.id, setPropertyId)
            }
            className={cn(
              'relative z-10 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="property-segment"
                className="absolute inset-0 rounded-xl bg-card shadow-soft"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                aria-hidden="true"
              />
            ) : null}
            <Icon className="relative z-10 h-4 w-4" aria-hidden="true" />
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
  currentId: PropertyId,
  setPropertyId: (id: PropertyId) => void,
) {
  const index = PROPERTIES.findIndex((item) => item.id === currentId)
  if (index < 0) return

  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
    event.preventDefault()
    const next = PROPERTIES[(index + 1) % PROPERTIES.length]
    setPropertyId(next.id)
    document.getElementById(`property-tab-${next.id}`)?.focus()
  }

  if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
    event.preventDefault()
    const prev = PROPERTIES[(index - 1 + PROPERTIES.length) % PROPERTIES.length]
    setPropertyId(prev.id)
    document.getElementById(`property-tab-${prev.id}`)?.focus()
  }
}
