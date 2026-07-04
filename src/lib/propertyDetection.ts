import type { Property } from '@/types'

export const CONSUMER_NUMBER_MAP = {
  '1155442007288': 'home',
  '1155446031429': 'heritage',
} as const

export function normalizeConsumerNumber(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\D/g, '')
}

export function resolvePropertyFromConsumerNumber(
  consumerNumber: string | null | undefined,
  properties: Property[],
): Property | null {
  const normalized = normalizeConsumerNumber(consumerNumber)
  if (!normalized) return null

  const byColumn = properties.find(
    (property) => normalizeConsumerNumber(property.consumerNumber) === normalized,
  )
  if (byColumn) return byColumn

  const slug = CONSUMER_NUMBER_MAP[normalized as keyof typeof CONSUMER_NUMBER_MAP]
  if (!slug) return null

  return properties.find((property) => property.slug === slug) ?? null
}

export function propertyIcon(slug: string): string {
  if (slug === 'home') return '🏠'
  if (slug === 'heritage') return '🏢'
  return '❓'
}
