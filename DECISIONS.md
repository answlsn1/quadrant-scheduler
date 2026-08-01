# 결정 로그

위임 범위 내에서 스스로 내린 결정을 한 줄씩 남긴다 (사후 감사용).
게이트 회부 항목(스키마·스코프·외부 서비스·보안 모델)은 별도 표기한다.

## 2026-08-01 — 1단계

- **[게이트 승인]** 저장 경로 `E:\quadrant-scheduler`. 기존 E: 드라이브 컨벤션(daily-tarot, outdoor-index)과 동일한 영문 케밥.
- **[게이트 승인]** `status`/`quadrant` 정합성 CHECK 제약 추가. 인박스 뱃지와 홈 뷰가 어긋날 여지를 DB가 원천 차단.
- **[게이트 승인 → 변경]** Supabase 신규 프로젝트 생성이 무료 플랜 활성 2개 한도에 막힘. 사장님이 2순위로 두셨던 `outdoorcast` 프로젝트에 `tasks` 테이블 동거로 진행. RLS는 테이블 단위 독립이라 격리는 유지된다. 분리 시 마이그레이션 1회 + 환경변수 2줄 교체.
- Next.js **16.2.12** 채택 (K-RoadTrip은 14). 신규 프로젝트라 최신 메이저로 시작.
- **`middleware.ts` 대신 `proxy.ts`** — Next 16에서 middleware 파일 컨벤션은 deprecated. `node_modules/next/dist/docs`로 확인함.
- 세션 확인은 `getUser()` 대신 **`getClaims()`** — 비대칭 서명키면 네트워크 없이 로컬 검증이라 요청당 왕복이 줄어든다. 5초 룰 방어.
- 저장 경로는 **브라우저 → Supabase 직접**(`createBrowserClient`). Next 서버 액션을 경유하지 않아 Vercel 콜드스타트가 캡처 지연에 끼어들지 않는다.
- `user_id`에 **`default auth.uid()`** — 클라이언트가 남의 id를 넣어볼 여지 자체를 없앤다.
- API 키는 `sb_publishable_...` **publishable 키** 사용 (legacy anon JWT 아님). 독립 로테이션 가능. `service_role`은 쓰지 않는다.
- 로그인 성공 후 `router.replace` 대신 **`window.location.replace`** — 하드 내비게이션이라 방금 심어진 세션 쿠키를 `proxy.ts`가 확실히 본다. 로그인은 드문 경로라 전체 리로드 비용이 문제되지 않는다.
- `?next=` 리다이렉트 파라미터는 **같은 출처 절대경로만** 통과 (`safeNext`). 오픈 리다이렉트 차단.
- proxy `matcher`에서 정적 자산과 `manifest.webmanifest` 제외 — 매니페스트가 인증에 막히면 홈스크린 설치가 안 된다.
- iOS용 **`apple-mobile-web-app-capable`** 메타를 `metadata.other`로 직접 추가. Next 16은 표준 이름(`mobile-web-app-capable`)만 내보내는데 iOS Safari는 apple- 접두를 봐야 주소창 없이 뜬다. 실측으로 발견함.
- 입력 요소 `font-size: 16px` 고정 — iOS가 16px 미만 입력 포커스 시 화면을 확대해 캡처 흐름이 끊긴다. `user-scalable=no`로 막지 않는 이유는 접근성.
- DB 타입은 Supabase에서 자동 생성해 `src/types/database.ts`에 둔다. 손으로 고치지 않는다.
- `npm audit` high 3건은 전부 Next.js가 끌고 오는 전이 의존성(postcss·sharp). `audit fix --force`는 Next를 9.3.3으로 내리므로 적용하지 않는다. 공격자가 준 CSS·이미지를 처리하는 앱이 아니라 실질 노출이 없다.

## 미결 (사장님 액션 대기)

- Supabase Auth 계정 시드 — 비밀번호는 내가 생성·입력하지 않는다. 대시보드에서 직접 설정한다.
- GitHub 저장소 생성 + Vercel 임포트 — 둘 다 브라우저 인증이 필요하다.
