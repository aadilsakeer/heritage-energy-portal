/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [propertyId, setPropertyIdState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshProperties = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const rows = await fetchProperties()
      setProperties(rows)
      setPropertyIdState((current) => {
        if (current && rows.some((row) => row.id === current)) return current
        return rows[0]?.id ?? null
      })
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
