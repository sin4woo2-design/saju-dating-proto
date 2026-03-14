# Analytics Event Schema (v1)

작성일: 2026-03-14 (UTC)
목적: 온보딩/결제/리텐션 핵심 퍼널 계측

## 공통 속성
- `event_time` (ISO8601)
- `user_id` (익명/회원 식별자)
- `session_id`
- `app_version`
- `platform` (web/android/ios)
- `locale`

## 핵심 퍼널 이벤트

### 1) Onboarding
- `onboarding_started`
  - props: `entry_route`, `has_previous_profile`
- `onboarding_step_completed`
  - props: `step_name`, `step_index`, `elapsed_ms`
- `onboarding_completed`
  - props: `total_steps`, `total_elapsed_ms`, `input_count`

### 2) Core Value Exposure
- `home_viewed`
  - props: `has_profile`
- `compatibility_requested`
  - props: `target_profile_source` (mock/manual/import)
- `compatibility_result_viewed`
  - props: `score_total`, `score_band` (low/mid/high), `render_ms`
- `report_shared`
  - props: `channel` (kakao/link/copy/etc), `result_type`

### 3) Paywall / Purchase
- `paywall_viewed`
  - props: `trigger_point` (result_end/button/locked_section)
- `purchase_started`
  - props: `product_id`, `plan_type` (monthly/yearly/one_time), `price`, `currency`
- `purchase_succeeded`
  - props: `product_id`, `plan_type`, `price`, `currency`, `is_restore`
- `purchase_failed`
  - props: `product_id`, `reason_code`, `gateway`
- `purchase_restore_attempted`
  - props: `platform`
- `purchase_restored`
  - props: `product_id`, `plan_type`

### 4) Retention
- `daily_fortune_viewed`
  - props: `fortune_date`, `topic` (love/work/health)
- `return_visit`
  - props: `days_since_last_visit`
- `notification_opened`
  - props: `campaign_id`, `campaign_type`

## KPI 정의 (대시보드)
1. 온보딩 완료율 = `onboarding_completed / onboarding_started`
2. 결과 조회율 = `compatibility_result_viewed / onboarding_completed`
3. 결제 진입률 = `purchase_started / paywall_viewed`
4. 결제 성공률 = `purchase_succeeded / purchase_started`
5. 복구 성공률 = `purchase_restored / purchase_restore_attempted`
6. D1 리텐션 = Day+1 `return_visit` 사용자 비율
7. D7 리텐션 = Day+7 `return_visit` 사용자 비율

## 구현 우선순위
- 1차(필수): onboarding_completed, compatibility_result_viewed, paywall_viewed, purchase_started, purchase_succeeded, purchase_failed
- 2차: report_shared, purchase_restored, return_visit
- 3차: notification_opened, 세부 step 이벤트
