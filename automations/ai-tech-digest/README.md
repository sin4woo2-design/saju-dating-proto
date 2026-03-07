# AI Tech Digest Automation

매일 아침 AI/테크 뉴스 요약을 이메일로 보내는 자동화입니다.

## 파일
- `send-tech-news-digest.mjs`: Brave 검색 + 안전 필터 + Gmail 발송
- `logs/`: 실행 로그

## 환경변수 (.env)
필수:
- `BRAVE_API_KEY`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

선택:
- `DIGEST_TO_EMAIL` (기본: `sin4woo2@gmail.com`)

## 수동 실행
```bash
cd /home/sin4woo2/saju-dating-proto
set -a; source .env; set +a
node automations/ai-tech-digest/send-tech-news-digest.mjs
```

## 드라이런(메일 미발송)
```bash
cd /home/sin4woo2/saju-dating-proto
set -a; source .env; set +a
node automations/ai-tech-digest/send-tech-news-digest.mjs --dry-run
```
