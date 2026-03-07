# Saju Dating Proto

사주 기반 소개팅 앱의 React + TypeScript MVP 프로토타입입니다.

현재는 **mock 데이터 + 단순 규칙 기반 계산**으로 화면 흐름과 UX를 검증하는 단계입니다.

## Tech Stack
- Vite
- React 19
- TypeScript
- React Router

## 실행 방법
```bash
npm install
npm run dev
```

기본 개발 URL: `http://localhost:5173`

## 빌드 확인
```bash
npm run build
```

## 현재 MVP 기능 범위
- 온보딩 입력 (이름/생년월일/출생시간/성별)
- 홈 인연 카드 리스트(mock)
- 내 사주 결과(mock 오행/요약)
- 궁합 점수 및 강점/주의(mock 규칙)
- 이상형 페르소나 카드(mock)
- 결과 공유(Web Share + 클립보드 fallback)
- 온보딩 입력값 localStorage 복구

## 폴더 개요
- `src/pages`: 온보딩/홈/내사주/궁합/페르소나 화면
- `src/components`: 폼/카드 등 재사용 UI
- `src/lib`: 사주/궁합 계산 로직(현재 mock)
- `src/data`: mock 데이터
- `src/types`: 도메인 타입

## 현재 한계 (mock 상태)
- 실제 명리 계산 엔진 미적용
- 백엔드/DB/인증 미연동
- 추천/매칭 알고리즘은 데모 수준

## 다음 단계
1. 실제 명리 계산 엔진 스펙 확정 및 교체
2. 사용자 데이터 저장용 API/DB 연결
3. 배포 환경별 설정(dev/prod) 정리
