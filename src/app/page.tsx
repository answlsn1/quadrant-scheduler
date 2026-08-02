import { HomeView } from './home-view'

/*
 * 서버에서 데이터를 읽지 않는다 — 그래야 이 페이지가 정적으로 미리 렌더되어
 * CDN에서 즉시 내려오고, 입력창이 서버 왕복 없이 바로 뜬다. 5초 룰의 핵심이다.
 * 목록은 입력창이 뜬 뒤에 클라이언트에서 채운다.
 */
export default function HomePage() {
  return <HomeView />
}
