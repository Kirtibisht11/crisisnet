from enum import Enum
from typing import Dict, Any

class EventType(str, Enum):
    NEW_CRISIS = "NEW_CRISIS"
    UPDATE_CRISIS = "UPDATE_CRISIS"
    ALERT = "ALERT"

def build_event(event_type: EventType, payload: Dict[str, Any], target: str = "all") -> Dict[str, Any]:
    return {
        "type": event_type,
        "payload": payload,
        "target": target
    }