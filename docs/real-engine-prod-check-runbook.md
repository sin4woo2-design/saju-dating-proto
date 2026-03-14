# Real Engine 운영 점검 런북

작성일: 2026-03-14 UTC

실엔진 운영 잠금(E1) 확인용 최소 절차.

## 1) provider 헬스/룰/소스 일괄 점검

```bash
./scripts/check-provider-health.sh https://provider.saju.your-domain.com
```

기본 기대값:
- mode: `lunar-prep`
- ruleVersion: `v2-month-branch-boost`
- calculationSource: `provider-lunar-python`

성공 시:
- `[ok] provider mode/rule/source all matched`

## 2) 실패 시 즉시 확인

### mode mismatch
- 운영 env의 `CHART_ENGINE_MODE` 확인
- systemd 서비스 재시작 후 `/health` 재확인

### ruleVersion mismatch
- 운영 env의 `CHART_RULE_VERSION` 확인
- 값 반영 후 서비스 재시작

### source mismatch
- `provider-lunar-python` 대신 `mock`/`mock-fallback`이면
  - mode가 fake인지 확인
  - lunar 계산 의존 패키지/런타임 오류 로그 확인 (`journalctl -u saju-provider -f`)

## 3) 운영 반영 체크

```bash
sudo systemctl restart saju-provider
sudo systemctl status saju-provider
```

```bash
journalctl -u saju-provider -n 200 --no-pager
```

## 4) 참고
- 로컬 fake 모드 검증이 필요하면:
```bash
EXPECTED_MODE=fake EXPECTED_RULE=v1-current ./scripts/check-provider-health.sh http://localhost:8081
```
