# 검증 기록 — 2026-10-27

- `npm test`: 8개 통과, 실패 0.
- `node --check`: server.mjs, lib/evidence.mjs, public/app.js 통과.
- `npm run export:static`: dist에 정적 픽스처 3건과 상대경로 UI 생성 성공.
- 실API: Extract HTTP 200 / 9크레딧, Decide HTTP 200 / 1크레딧, grounding HTTP 200 / 10크레딧. 총20크레딧. 모델 clocked-1.0.
- 실API 출력: eligibility needs_review(확신도0.9365), deadline open(확신도0.9899), 최종hold. 실제 결과는 live-review.json. 픽스처의 ready를 실API 결과로 주장하지 않는다.
- 브라우저 자동 QA: Playwright 패키지는 확인했으나 기본 headless 브라우저 바이너리가 없어서 실행 미완료. 메인 에이전트가 공유 브라우저 단일 레인으로 육안/브라우저 검증 담당. 설치·공유 브라우저 조작을 하지 않았다.
- 키 보안: 키 파일은 이 저장소 바깥에서 PowerShell 프로세스 환경변수로만 읽었다. 값 출력·복사·커밋 없음. 서버 로그는 모드와URL, 스모크 로그는 HTTP상태·모델·비용·판정만 포함.

이 기록의 테스트 수와 브라우저 검증 여부는 실행 당시 기준이다.
