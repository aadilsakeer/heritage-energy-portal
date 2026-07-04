/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { fetchProperties } from '@/services/propertyService'
import type { Property } from '@/types'

interface PropertyContextValue {
  properties: Property[]
  property: Property | null
  propertyId: string | null
  setPropertyId: (id: string) => void
  isLoading: boolean
  error: string | null
  refreshProperties: () => Promise<void>
}

const PropertyContext = createContext<PropertyContextValue | null>(null)

interface PropertyProviderProps {
  children: ReactNode
}

export function PropertyProvider({ children }: PropertyProviderProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [propertyId, setPropertyIdState] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('heritage:propertyId')
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoaded = useRef(false)

  const refreshProperties = useCallback(async () => {
    if (!hasLoaded.current) {
      setIsLoading(true)
    }
    setError(null)

    try {
      const rows = await fetchProperties()
      setProperties(rows)
      setPropertyIdState((current) => {
        const next =
          current && rows.some((row) => row.id === current)
            ? current
            : (rows[0]?.id ?? null)
        try {
          if (next) sessionStorage.setItem('heritage:propertyId', next)
        } catch {
          // ignore storage errors
        }
        return next
      })
      hasLoaded.current = true
    } catch (err) {
      setProperties([])
      setPropertyIdState(null)
      setError(err instanceof Error ? err.message : 'Failed to load properties')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshProperties()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [refreshProperties])

  const setPropertyId = useCallback((id: string) => {
    setPropertyIdState(id)
    try {
      sessionStorage.setItem('heritage:propertyId', id)
    } catch {
      // ignore storage errors
    }
  }, [])

  const property = useMemo(
    () => properties.find((item) => item.id === propertyId) ?? null,
    [properties, propertyId],
  )

  const value = useMemo<PropertyContextValue>(
    () => ({
      properties,
      property,
      propertyId,
      setPropertyId,
      isLoading,
      error,
      refreshProperties,
    }),
    [
      properties,
      property,
      propertyId,
      setPropertyId,
      isLoading,
      error,
      refreshProperties,
    ],
  )

  return (
    <PropertyContext.Provider value={value}>{children}</PropertyContext.Provider>
  )
}

export function useProperty() {
  const context = useContext(PropertyContext)

  if (!context) {
    throw new Error('useProperty must be used within PropertyProvider')
  }

  return context
}

export function usePropertyId() {
  return useProperty().propertyId
}

export function usePropertyLabel() {
  return useProperty().property?.label
}
