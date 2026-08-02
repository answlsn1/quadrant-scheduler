# 1주 실사용 회고

**운영 개시 = 1주 실사용.** 기능을 더 만들기 전에 이 도구가 실제로 쓰였는지부터 본다.
자가도구의 최대 리스크는 버그가 아니라 본인 이탈이다 (작업지시서 6장).

- 개시일: `____-__-__`
- 회고일: 개시 + 7일

회고 데이터가 모이면 CTO 세션에서 v1.1 여부를 정한다.
**질문 3개 모두 "숫자"로 답한다.** 느낌으로 답하면 회고가 아니라 감상이 된다.

---

## 질문 1 — 하루 평균 캡처가 몇 건이었나

도구가 실제로 쓰였는지 보는 지표다. 0에 가까우면 기능 문제가 아니라 습관 문제다.

```sql
select
  date(created_at at time zone 'Asia/Seoul') as 날짜,
  count(*) as 캡처
from public.tasks
where created_at >= now() - interval '7 days'
group by 1
order by 1;
```

- 하루 평균: `___건`
- 가장 많은 날 / 없는 날: `___` / `___`
- **판단 기준**: 캡처가 없는 날이 3일 이상이면 도구가 아니라 진입 경로를 의심한다.

## 질문 2 — 3번 박제가 지켜졌나

이 앱의 승부처다. 미배치 3번이 줄지 않았다면 앱이 문제를 못 풀고 있는 것이다.

```sql
select
  count(*) filter (where quadrant = 3 and status = 'active' and scheduled_date is null) as 미배치_3번,
  count(*) filter (where quadrant = 3 and status = 'active' and scheduled_date < current_date) as 지난_3번,
  count(*) filter (where quadrant = 3 and status = 'done') as 완료한_3번,
  count(*) filter (where quadrant = 3 and status = 'dropped') as 버린_3번
from public.tasks;
```

- 미배치 3번 추이 (주 시작 → 주 끝): `___ → ___`
- 3번 완료 건수: `___`
- **판단 기준**: 미배치가 늘기만 했다면 분류 화면의 "건너뛰기"가 너무 쉬운 것이다.

## 질문 3 — 열지 않게 된 화면은 무엇인가

제거 후보를 찾는 질문이다. 안 쓰는 화면은 유지 비용만 든다.

화면별 사용을 자동으로 기록하지 않는다(통계는 스코프 아웃). **기억으로 답한다.**

| 화면 | 일주일간 몇 번쯤 열었나 | 없어도 되나 |
|---|---|---|
| 오늘 | | |
| 분류 | | |
| 보드 | | |
| 기록 | | |

- **판단 기준**: 한 주에 한 번도 안 연 화면은 v1.1에서 뺀다.

---

## 참고 — 사분면 분포

어느 칸에 인생이 몰려 있는지 본다. 4번이 많으면 그 자체가 수확이다.

```sql
select
  quadrant as 사분면,
  count(*) as 전체,
  count(*) filter (where status = 'done') as 완료,
  count(*) filter (where status = 'dropped') as 버림
from public.tasks
where quadrant is not null
group by 1
order by 1;
```

---

## 결론

- [ ] v1으로 충분하다 — 그대로 쓴다
- [ ] v1.1을 만든다 — 백로그에서 가져올 항목:
- [ ] 접는다 — 이유:
