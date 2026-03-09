from __future__ import annotations

from app.schemas import PersonInput
from app.services.fake_engine import calculate_compatibility_signals


def derive_score_from_signals(signals: list[str]) -> int:
    """
    임시 점수화 로직(신호 기반):
    - 실제 전환 시 provider raw signals 중심 계산으로 대체될 영역
    """
    base = 70
    for s in signals:
        if s.startswith("HAP"):
            base += 7
        if s.startswith("CHUNG"):
            base -= 6
        if s.startswith("COMPLEMENT"):
            base += 4
    return max(40, min(96, base))


def get_compatibility(me: PersonInput, partner: PersonInput):
    signals, latency_ms, warnings = calculate_compatibility_signals(me, partner)
    score = derive_score_from_signals(signals)
    return score, signals, latency_ms, warnings
