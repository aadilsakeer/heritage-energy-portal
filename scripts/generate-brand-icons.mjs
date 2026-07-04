import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import toIco from 'to-ico'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const iconsDir = join(root, 'public', 'icons')
const publicDir = join(root, 'public')
const source = join(iconsDir, 'logo.png')

const BRAND_GREEN = '#004d2c'
const SPLASH_BG = '#ffffff'

async function createSquareIcon(size, innerScale, background) {
  const innerMax = Math.round(size * innerScale)
  const resized = await sharp(source)
    .resize({
      width: innerMax,
      height: innerMax,
      fit: 'inside',
      withoutEnlargement: false,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toBuffer()

  const resizedMeta = await sharp(resized).metadata()
  const left = Math.round((size - (resizedMeta.width || size)) / 2)
  const top = Math.round((size - (resizedMeta.height || size)) / 2)

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer()
}

async function main() {
  const metadata = await sharp(source).metadata()

  const icon192 = await createSquareIcon(192, 0.82, SPLASH_BG)
  const icon512 = await createSquareIcon(512, 0.82, SPLASH_BG)
  const appleTouch = await createSquareIcon(180, 0.82, SPLASH_BG)
  const maskable512 = await createSquareIcon(512, 0.62, BRAND_GREEN)
  const maskable192 = await createSquareIcon(192, 0.62, BRAND_GREEN)
  const favicon16 = await createSquareIcon(16, 0.9, SPLASH_BG)
  const favicon32 = await createSquareIcon(32, 0.9, SPLASH_BG)
  const favicon48 = await createSquareIcon(48, 0.9, SPLASH_BG)

  writeFileSync(join(iconsDir, 'icon-192.png'), icon192)
  writeFileSync(join(iconsDir, 'icon-512.png'), icon512)
  writeFileSync(join(iconsDir, 'apple-touch-icon.png'), appleTouch)
  writeFileSync(join(iconsDir, 'icon-maskable-192.png'), maskable192)
  writeFileSync(join(iconsDir, 'icon-maskable-512.png'), maskable512)

  const ico = await toIco([favicon16, favicon32, favicon48])
  writeFileSync(join(publicDir, 'favicon.ico'), ico)
  writeFileSync(join(iconsDir, 'favicon-32.png'), favicon32)

  console.log('Generated Heritage Solar brand icons from public/icons/logo.png')
  console.log(`Source dimensions: ${metadata.width}x${metadata.height}`)
}

await main()
