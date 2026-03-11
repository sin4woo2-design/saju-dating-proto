# Engine Release Checklist

배포 전 최소 점검 항목:

- [ ] `/saju/chart` provider 성공률 확인 (최근 배포 구간)
- [ ] `providerState`가 `mock-fallback/mock`으로 치우치지 않는지 확인
- [ ] Home/Persona provenance line에서 `source/rule` 기대값 확인
- [ ] Compatibility 점수 ruleVersion이 `compat-v1-rawsignals`로 들어오는지 확인
- [ ] 경고 코드(`PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, `PROVIDER_PARTIAL_DATA`) 집계 확인
- [ ] 핵심 페이지 빌드/렌더 스모크 체크 (Home/MySaju/Compatibility/Persona)

참고:
- 프론트 런타임에서 20회 이상 호출 시 non-provider 비율이 5% 초과하면 콘솔 경고가 발생한다.
