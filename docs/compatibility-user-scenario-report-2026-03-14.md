# Compatibility User Scenario Report

generated: 2026-03-14 07:04 UTC

실사용 관점에서 대표 입력 케이스를 빠르게 검증한 결과입니다.

- scenarios: **15**
- score range: **64 ~ 86**
- avg score: **73.27**
- confidence: high 9 / medium 0 / low 6

| scenario | score | confidence | subScores | warnings | ruleVersion |
|---|---:|---|---|---|---|
| real-01-balanced-known | 77 | high | b:-6/s:0/e:3/d:1/r:0 | - | compat-v2-basis |
| real-02-partial-time | 69 | low | b:-4/s:-2/e:1/d:1/r:-7 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-03-both-unknown | 65 | low | b:2/s:0/e:1/d:3/r:-10 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-04-midnight-edge | 77 | high | b:-1/s:0/e:3/d:1/r:0 | - | compat-v2-basis |
| real-05-utc-case | 70 | low | b:-2/s:2/e:3/d:1/r:-7 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-06-known-known-2 | 86 | high | b:-1/s:4/e:1/d:3/r:0 | - | compat-v2-basis |
| real-07-known-unknown-2 | 70 | low | b:-2/s:0/e:3/d:1/r:-7 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-08-known-known-utc | 79 | high | b:2/s:4/e:-2/d:3/r:0 | - | compat-v2-basis |
| real-09-other-gender | 77 | high | b:-2/s:-2/e:3/d:1/r:0 | - | compat-v2-basis |
| real-10-midnight-edge-2 | 71 | high | b:-1/s:0/e:-2/d:1/r:0 | - | compat-v2-basis |
| real-11-season-edge-1 | 76 | high | b:0/s:0/e:1/d:1/r:0 | - | compat-v2-basis |
| real-12-season-edge-2 | 72 | high | b:-1/s:0/e:-2/d:3/r:0 | - | compat-v2-basis |
| real-13-unknown-known-utc | 69 | low | b:-1/s:2/e:1/d:3/r:-7 | PROVIDER_PARTIAL_DATA | compat-v2-basis |
| real-14-symmetric-known | 77 | high | b:-3/s:0/e:3/d:3/r:0 | - | compat-v2-basis |
| real-15-symmetric-unknown | 64 | low | b:-5/s:2/e:3/d:3/r:-10 | PROVIDER_PARTIAL_DATA | compat-v2-basis |

해석 기준:
- score는 참고 지표이며 confidence/warnings를 함께 본다.
- reliability(subScores.r)가 큰 음수면 시간 미상 영향이 큼.