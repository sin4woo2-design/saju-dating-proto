# Provider VM + Vercel 배포 연결 가이드

이 문서는 `backend/provider-python`를 VM에서 상시 실행하고, Vercel 프론트와 실연동하기 위한 최소 절차를 정리한다.

## 1) VM에서 provider 상시 실행 (systemd)

### 파일
- 서비스 유닛: `backend/provider-python/deploy/systemd/saju-provider.service`
- 환경변수 예시: `backend/provider-python/deploy/env/provider.env.example`
- 실행 스크립트: `backend/provider-python/scripts/run-provider.sh`

### 설치 절차
```bash
cd /home/sin4woo2/saju-dating-proto
cp backend/provider-python/deploy/env/provider.env.example backend/provider-python/deploy/env/provider.env

cd backend/provider-python
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt

sudo cp deploy/systemd/saju-provider.service /etc/systemd/system/saju-provider.service
sudo systemctl daemon-reload
sudo systemctl enable --now saju-provider
sudo systemctl status saju-provider
```

### 서비스 로그
```bash
journalctl -u saju-provider -f
```

---

## 2) 외부 공개 URL 구성 (권장: Caddy reverse proxy + TLS)

provider는 로컬 루프백(`127.0.0.1:8081`)에서만 열고, Caddy가 HTTPS 공개를 담당한다.

### Caddy 예시
```caddy
provider.saju.your-domain.com {
  reverse_proxy 127.0.0.1:8081
}
```

### 적용
```bash
sudo apt-get update && sudo apt-get install -y caddy
sudo nano /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

### 방화벽
- 80, 443 허용
- 8081은 외부에 직접 오픈하지 않음

---

## 3) 환경변수

### provider 서버용 (`backend/provider-python/deploy/env/provider.env`)
- `PROVIDER_VERSION=fake-python-provider-v0`
- `ENGINE_VERSION=chart-engine-v0.3`
- `CHART_ENGINE_MODE=lunar-prep`
- `CHART_RULE_VERSION=v2-month-branch-boost`
- `CHART_HIDDEN_STEM_BLEND=0.5`
- `CHART_EARTH_DAMPENING_ENABLED=false`
- `CHART_EARTH_DAMPENING_STRENGTH=0.7`
- `CORS_ALLOW_ORIGINS=http://localhost:5173,https://saju-dating-proto.vercel.app`

### Vercel 프론트용
- `VITE_SAJU_ENGINE_MODE=real-provider`
- `VITE_SAJU_PROVIDER_BASE_URL=https://provider.saju.your-domain.com`
- `VITE_SAJU_PROVIDER_TIMEOUT_MS=2500`

---

## 4) 상태 구분 (UI/로그)

- `mock`
  - 의미: 앱이 mock 엔진 모드로 동작 중 (provider 호출 안 함)
- `provider`
  - 의미: real-provider 모드 + provider 호출 성공
- `mock-fallback`
  - 의미: real-provider 모드에서 provider 호출 실패 후 mock으로 대체

---

## 5) 배포 후 검증 체크리스트

1. VM 서비스 상태
   - `systemctl status saju-provider`가 active(running)
2. provider health
   - `curl -s https://provider.saju.your-domain.com/health`
   - `mode`가 기대값(`lunar-prep`)인지 확인
3. CORS
   - 브라우저에서 `/saju/chart` 호출 시 CORS 오류 없음
4. Vercel env 반영
   - redeploy 이후 번들에 `localhost:8081`이 남지 않았는지 확인
5. 앱 화면 상태
   - 정상 입력에서 `실계산 사용` 표시 (`provider`)
   - provider 중단 테스트 시 `fallback 사용` 표시 (`mock-fallback`)
6. 에러 코드 확인
   - `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`, `PROVIDER_BAD_RESPONSE`가 의도대로 노출되는지 확인
