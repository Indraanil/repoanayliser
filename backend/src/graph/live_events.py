from __future__ import annotations

import json
import logging
import urllib.request
from typing import Any

logger = logging.getLogger(__name__)


def notify_web_backend(event: dict[str, Any]) -> bool:
    """Notify the running ARCHITECH web backend about graph update events."""
    try:
        url = "http://127.0.0.1:8000/api/live-events"
        data = json.dumps(event).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=0.5) as resp:
            return resp.status == 200
    except Exception:
        return False
