# 사분면 스케줄러

캡처 → 사분면 분류 → **실행**으로 연결되는 우선순위 도구.
분류하고 끝나는 도구가 아니라, 사분면마다 강제 동사가 붙는다.
구글 로그인으로 각자 자기 보드를 갖는다 (사용자 간 공유 없음).

- 앱: https://quadrant-scheduler.vercel.app
- 설치 안내(공유용): https://quadrant-scheduler.vercel.app/install

| 번호 | 정의 | 강제 동사 |
|---|---|---|
| 1 | 중요 O / 급함 O | 지금 한다 |
| 2 | 중요 X / 급함 O | 몰아서 처리 |
| 3 | 중요 O / 급함 X | 일정에 박제 |
| 4 | 중요 X / 급함 X | 버린다 |

> 2번과 3번은 표준 아이젠하워 매트릭스와 반대다. 의도된 것이니 교정하지 말 것.
> 자세한 규칙은 [AGENTS.md](AGENTS.md).

## 스택

Next.js 16 (App Router) · TypeScript · Tailwind v4 · Supabase (Google OAuth + Postgres + RLS) · Vercel · PWA

인증은 구글 로그인 전용이고 회원가입은 없다. 허용 계정 1개를 앱(`src/lib/auth.ts`)과
DB(`public.is_allowed_user()`) 양쪽에서 대조한다.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # Supabase URL/publishable 키 채우기
npm run dev
```

임시 PWA 아이콘 재생성: `node scripts/make-icons.mjs`

## 문서

- [AGENTS.md](AGENTS.md) — 작업 규칙, 절대 건드리지 말 것, 스코프 아웃
- [DECISIONS.md](DECISIONS.md) — 결정 로그
- [BACKLOG.md](BACKLOG.md) — v1에서 뺀 것들
- [QA.md](QA.md) — 실기기 점검 체크리스트
- [RETRO.md](RETRO.md) — 1주 실사용 회고 (질문 3개 + 측정 SQL)

## 진행 상황

- [x] 1단계 — 기반 다지기 (스캐폴딩 · DB + RLS · 구글 로그인 · PWA)
- [x] 2단계 — 뼈대 (캡처 · 분류 · 홈 · 보드 · 기록)
- [x] 3단계 — 살 붙이기 (다크 팔레트 · 사분면 컬러 코딩 · 하단 캡처창)
- [x] 4단계 — 완공 (JSON 내보내기 · QA 체크리스트 · 회고 문서)
- [ ] **운영 개시** — 1주 실사용 후 [RETRO.md](RETRO.md) 작성 → v1.1 여부 결정
