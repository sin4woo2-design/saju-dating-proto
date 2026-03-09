from __future__ import annotations

"""
lunar-python 실연동 준비용 모듈 (아직 미구현)

목표:
- /saju/chart를 fake -> real로 전환할 때 라우트 변경 없이
  이 모듈만 채워 넣도록 인터페이스를 선확정한다.
"""

from app.schemas import PersonInput


def calculate_chart_with_lunar(_person: PersonInput):
    """
    반환 형태(예정):
    (five_elements: dict[str,int], pillars: dict[str,str], signals: list[str], warnings: list[str])

    TODO(lunar-python 연결 시):
    1) birthDate/birthTime/timezone/calendarType 입력을 lunar-python 입력으로 변환
    2) 사주 원국(연/월/일/시) 계산
    3) 오행 비중 산출 및 0~100 정규화
    4) signals 도출 규칙(강/약, 편중 등) 정리
    """
    raise NotImplementedError("LUNAR_CHART_NOT_IMPLEMENTED")
