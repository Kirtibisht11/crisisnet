# backend/ws/events.py

from datetime import datetime
from enum import Enum


class EventType(str, Enum):
    NEW_CRISIS = "NEW_CRISIS"
    CRISIS_UPDATE = "CRISIS_UPDATE"
    TASK_ASSIGNED = "TASK_ASSIGNED"
    RESOURCE_ASSIGNED = "RESOURCE_ASSIGNED"
    ALERT_VERIFIED = "ALERT_VERIFIED"
    ALERT_REJECTED = "ALERT_REJECTED"
    SYSTEM_MESSAGE = "SYSTEM_MESSAGE"


def build_event(
    event_type: EventType,
    payload: dict,
    target: str = "all",
):
    """
    Build a standard websocket event structure
    """

    return {
        "event": event_type.value,
        "target": target,  # all | citizen | ngo | authority
        "timestamp": datetime.utcnow().isoformat(),
        "payload": payload,
    }
