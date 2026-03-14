# Compatibility User Scenario Report

generated: 2026-03-14 03:47 UTC

실사용 관점에서 대표 입력 케이스를 빠르게 검증한 결과입니다.

| scenario | score | confidence | subScores | warnings | ruleVersion |
|---|---:|---|---|---|---|
| real-01-balanced-known | 77 | high | b:-6/s:0/e:3/d:1/r:0 | - | compat-v2-basis |
| real-02-partial-time | 69 | low | b:-4/s:-2/e:1/d:1/r:-7 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-03-both-unknown | 65 | low | b:2/s:0/e:1/d:3/r:-10 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-04-midnight-edge | 77 | high | b:-1/s:0/e:3/d:1/r:0 | - | compat-v2-basis |
| real-05-utc-case | 70 | low | b:-2/s:2/e:3/d:1/r:-7 | PROVIDER_PARTIAL_DATA | compat-v2-basis |

해석 기준:
- score는 참고 지표이며 confidence/warnings를 함께 본다.
- reliability(subScores.r)가 큰 음수면 시간 미상 영향이 큼.