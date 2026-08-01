import type { MetadataRoute } from 'next'

/**
 * PWA 매니페스트. /manifest.webmanifest 로 서빙된다.
 * 홈스크린에서 바로 열리는 것이 이 도구의 이탈 방지 장치다 (6장 리스크).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '사분면 스케줄러',
    short_name: '사분면',
    description: '캡처 → 분류 → 실행. 1인용 우선순위 도구.',
    lang: 'ko',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0b0d',
    theme_color: '#0b0b0d',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
