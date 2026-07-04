import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { PROPERTIES, PROPERTY_DATA } from '@/constants'
import type { Property, PropertyData, PropertyId } from '@/types'

interface PropertyContextValue {
  propertyId: PropertyId
  property: Property
  data: PropertyData
  setPropertyId: (id: PropertyId) => void
}

const PropertyContext = createContext<PropertyContextValue | null>(null)

interface PropertyProviderProps {
  children: ReactNode
}

export function PropertyProvider({ children }: PropertyProviderProps) {
  const [propertyId, setPropertyIdState] = useState<PropertyId>('home')

  const setPropertyId = useCallback((id: PropertyId) => {
    setPropertyIdState(id)
  }, [])

  const value = useMemo<PropertyContextValue>(() => {
    const property =
      PROPERTIES.find((item) => item.id === propertyId) ?? PROPERTIES[0]

    return {
      propertyId,
      property,
      data: PROPERTY_DATA[propertyId],
      setPropertyId,
    }
  }, [propertyId, setPropertyId])

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
