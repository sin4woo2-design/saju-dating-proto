# /saju/chart 오행 집계 규칙 (현재 구현)

- 대상: `backend/provider-python/app/services/lunar_chart.py`
- 입력: lunar-python `EightChar`에서 추출한 4개 천간 + 4개 지지

집계 규칙:
1. 천간 4개에 가중치 `1.6` 부여
2. 지지 4개에 가중치 `1.0` 부여
3. 오행별 합산 후 전체 합을 100으로 정규화
4. 반올림 오차는 최강 오행에 보정

신호 규칙:
- strongest element -> `{ELEMENT}_STRONG`
- weakest element -> `{ELEMENT}_WEAK`
- lunar 계산 경로 사용 표시 -> `LUNAR_PILLARS_APPLIED`
- 출생시간 미상 -> warning `PROVIDER_PARTIAL_DATA`

왜곡 가능성/한계:
- 지장간 미반영
- 월지/일간 비중 차등 미반영
- 계절력(왕상휴수사) 미반영
- 십성/용신/희신 기반 보정 없음
- 음력 입력 윤달 여부 미처리(현재 스키마에 leap month 정보 없음)

조정 포인트(우선순위):
1. 월지 가중치 상향
2. 지장간 분해 반영
3. 일간 중심 강약 보정
4. 계절 보정 계수 도입
5. signals 체계(합/충/형/파/해) 확장
