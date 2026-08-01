/**
 * 임시 PWA 아이콘 생성기 (작업지시서 1단계 5항 — "임시 아이콘").
 * 본 아이콘은 3단계 디자인 확정 후 교체한다.
 *
 * 실행: node scripts/make-icons.mjs
 * sharp는 Next.js가 이미 끌고 오는 의존성이라 별도 설치가 없다.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = path.join(ROOT, 'public', 'icons')

const BG = '#0b0b0d'
const FG = '#ededed'

/**
 * 2×2 사분면 그리드.
 * 배치는 참고 슬라이드와 동일 — 좌상 1, 우상 3, 좌하 2, 우하 4.
 * 1번(지금 한다)과 3번(일정에 박제)을 밝게 둔다. 3번이 이 앱의 승부처다.
 */
function gridSvg({ size, inset }) {
  const span = size - inset * 2
  const gap = Math.round(span * 0.055)
  const cell = Math.round((span - gap) / 2)
  const r = Math.round(cell * 0.16)
  const stroke = Math.max(2, Math.round(cell * 0.075))

  const x1 = inset
  const x2 = inset + cell + gap
  const y1 = inset
  const y2 = inset + cell + gap

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BG}"/>
  <rect x="${x1}" y="${y1}" width="${cell}" height="${cell}" rx="${r}" fill="${FG}"/>
  <rect x="${x2}" y="${y1}" width="${cell}" height="${cell}" rx="${r}" fill="${FG}" fill-opacity="0.72"/>
  <rect x="${x1}" y="${y2}" width="${cell}" height="${cell}" rx="${r}" fill="${FG}" fill-opacity="0.3"/>
  <rect x="${x2 + stroke / 2}" y="${y2 + stroke / 2}" width="${cell - stroke}" height="${cell - stroke}" rx="${r}" fill="none" stroke="${FG}" stroke-opacity="0.35" stroke-width="${stroke}"/>
</svg>`
}

async function render(svg, size, filename) {
  const file = path.join(OUT_DIR, filename)
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file)
  return filename
}

await mkdir(OUT_DIR, { recursive: true })

// 일반 아이콘 — 여백 좁게 꽉 차게
const full = gridSvg({ size: 512, inset: 84 })
// maskable — 안드로이드가 원형/스퀘어클 등으로 잘라내므로 안전영역(중앙 80%) 안에 넣는다
const maskable = gridSvg({ size: 512, inset: 140 })

const written = await Promise.all([
  render(full, 512, 'icon-512.png'),
  render(full, 192, 'icon-192.png'),
  render(full, 180, 'apple-touch-icon.png'),
  render(maskable, 512, 'icon-maskable-512.png'),
])

// 소스 SVG도 남겨둔다 — 3단계에서 교체할 때 기준점이 된다
await writeFile(path.join(OUT_DIR, 'icon.svg'), full, 'utf8')

console.log(`생성 완료 → public/icons/: ${written.join(', ')}, icon.svg`)
