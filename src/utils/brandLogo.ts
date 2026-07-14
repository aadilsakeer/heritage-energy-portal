import { BRAND } from '@/constants'

export interface BrandLogoAsset {
  dataUrl: string
  width: number
  height: number
  format: 'PNG' | 'JPEG'
}

function resolveImageFormat(
  blobType: string,
  path: string,
): 'PNG' | 'JPEG' {
  const lower = `${blobType} ${path}`.toLowerCase()
  if (lower.includes('jpeg') || lower.includes('jpg')) return 'JPEG'
  return 'PNG'
}

export async function loadBrandLogo(
  logoPath: string,
): Promise<BrandLogoAsset> {
  const path = logoPath || BRAND.logo
  const response = await fetch(path)
  if (!response.ok) throw new Error('Failed to load brand logo')

  const blob = await response.blob()
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Failed to read brand logo'))
    reader.readAsDataURL(blob)
  })

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new Image()
    element.onload = () => resolve(element)
    element.onerror = () => reject(new Error('Failed to decode brand logo'))
    element.src = dataUrl
  })

  if (!image.width || !image.height) {
    throw new Error('Brand logo has invalid dimensions')
  }

  return {
    dataUrl,
    width: image.width,
    height: image.height,
    format: resolveImageFormat(blob.type, path),
  }
}
