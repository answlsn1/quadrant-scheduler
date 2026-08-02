import { InstallView } from './install-view'

export const metadata = {
  title: '설치 · 사분면',
  description: '사분면 스케줄러를 폰에 앱으로 설치하는 방법',
}

/**
 * 지인들에게 공유하는 설치 안내. 로그인 없이 열린다 (proxy 공개 경로).
 * 이 주소가 곧 "다운로드 링크"다:
 * https://quadrant-scheduler.vercel.app/install
 */
export default function InstallPage() {
  return <InstallView />
}
