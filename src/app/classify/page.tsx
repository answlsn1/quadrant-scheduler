import { redirect } from 'next/navigation'

/**
 * 분류 탭은 홈으로 통합됐다 (2026-08-03 사장님 결정).
 * 캡처 직후 패널과 홈 상단 인박스 버튼이 그 역할을 한다.
 * 설치된 앱·즐겨찾기의 진입점을 깨뜨리지 않으려고 주소는 남기고 홈으로 보낸다.
 */
export default function ClassifyPage() {
  redirect('/')
}
