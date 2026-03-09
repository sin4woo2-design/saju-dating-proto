from __future__ import annotations

import hashlib
import json


def deterministic_request_id(scope: str, payload: dict) -> str:
    canonical = json.dumps(payload, sort_keys=True, ensure_ascii=False, separators=(",", ":"))
    digest = hashlib.sha256(f"{scope}:{canonical}".encode("utf-8")).hexdigest()[:16]
    return f"req_{digest}"
