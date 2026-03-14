# Compatibility Runtime Metrics Format (P4-3)

목적: 배포 구간에서 compatibility real-engine 전환 상태를 동일 포맷으로 수집한다.

## 1) 수집 지표
- provider success ratio (compatibility)
- non-provider ratio (compatibility)
- fallback ratio (`providerState=mock-fallback`)
- warning code aggregation
- provenance/ruleVersion 분포

## 2) 수집 방법 (브라우저 콘솔)
앱에서 궁합 계산을 여러 번 수행한 뒤 콘솔에서 실행:

```js
import("/src/lib/engine/index.ts").then(({ getEngineObserveSnapshot }) => {
  const snap = getEngineObserveSnapshot();
  console.log("ENGINE_METRICS_SNAPSHOT", snap);
});
```

운영 번들에서는 import 경로 대신 런타임 expose helper(또는 디버그 빌드)를 사용한다.

## 3) 리포트 JSON 포맷(표준)

```json
{
  "window": {
    "from": "2026-03-14T00:00:00Z",
    "to": "2026-03-14T06:00:00Z"
  },
  "compatibility": {
    "totalCalls": 120,
    "providerCalls": 112,
    "nonProviderCalls": 8,
    "nonProviderRatio": 0.0667,
    "fallbackCalls": 5,
    "fallbackRatio": 0.0417,
    "ruleVersions": {
      "compat-v2-basis": 110,
      "compat-v1-rawsignals": 10
    },
    "warnings": {
      "PROVIDER_PARTIAL_DATA": 22,
      "PROVIDER_TIMEOUT": 3,
      "PROVIDER_UNAVAILABLE": 1,
      "COMPAT_BASIS_INCOMPLETE": 0,
      "COMPAT_RULE_DEGRADED": 2
    }
  }
}
```

## 4) 임계치(초안)
- non-provider ratio > 5%: 경고
- fallback ratio > 3%: 경고
- timeout+unavailable 합계 > 2%: 경고
- `compat-v2-basis` 비중 < 90%: 전환 미완료로 판단

## 5) 체크리스트 반영 포인트
- `docs/engine-release-checklist.md` 점검 시 아래 3개를 숫자로 기록:
  1) non-provider ratio
  2) warning aggregation top3
  3) ruleVersion 분포(`compat-v2-basis` 비중)

## 6) 참고
- golden fixture 분포 리포트: `docs/compatibility-distribution-report.md`
- 기준 계약: `docs/compatibility-real-engine-conversion-checklist.md`
