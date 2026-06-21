// Generate the PWA / app icons from an inline SVG (run: `node scripts/generate-icons.mjs`).
// A bold indigo tile with the Tally tally-mark glyph — works full-bleed for maskable + any.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const svg = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
      <stop stop-color="#9C9CF0"/>
      <stop offset="1" stop-color="#7A7AE0"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g stroke="#0D0D11" stroke-width="34" stroke-linecap="round">
    <line x1="176" y1="172" x2="176" y2="344"/>
    <line x1="232" y1="172" x2="232" y2="344"/>
    <line x1="288" y1="172" x2="288" y2="344"/>
    <line x1="344" y1="172" x2="344" y2="344"/>
    <line x1="150" y1="356" x2="362" y2="152"/>
  </g>
</svg>`

const buf = Buffer.from(svg)
const targets = [
  ['pwa-192x192.png', 192],
  ['pwa-512x512.png', 512],
  ['pwa-maskable-512x512.png', 512],
  ['apple-touch-icon.png', 180],
]

for (const [name, size] of targets) {
  await sharp(buf).resize(size, size).png().toFile(join(out, name))
  console.log('wrote', name)
}
