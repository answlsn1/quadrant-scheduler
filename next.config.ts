import type { NextConfig } from "next";

/*
 * 이 배포를 식별하는 값.
 *
 * 폴백 체인인 이유: VERCEL_DEPLOYMENT_ID는 문서에서 확증하지 못했고,
 * VERCEL_GIT_COMMIT_SHA는 git 배포에서 확실히 존재한다. 하나가 없어도 다음이 받는다.
 * 로컬에서는 'dev'로 고정되어 갱신 확인이 항상 통과(= 아무 일도 안 함)한다.
 */
const buildId =
  process.env.VERCEL_DEPLOYMENT_ID ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  "dev";

const nextConfig: NextConfig = {
  /*
   * Next 내장 버전 스큐 보호를 켠다.
   * 클라이언트가 옛 배포의 식별자를 들고 있으면 클라이언트 내비게이션 대신
   * 하드 리로드로 전환해, 옛 코드와 새 서버가 섞이는 걸 막는다.
   */
  deploymentId: buildId,

  // 클라이언트 번들에 인라인된다. /api/build가 주는 값과 비교해 갱신을 감지한다.
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },
};

export default nextConfig;
