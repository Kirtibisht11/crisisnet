
from fastapi import WebSocket
from typing import List, Dict
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "citizen": [],
            "volunteer": [],
            "authority": [],
            "ngo": []
        }
    
    async def connect(self, websocket: WebSocket, role: str = "citizen"):
        await websocket.accept()
        
        if role not in self.active_connections:
            role = "citizen"
        
        self.active_connections[role].append(websocket)
        logger.info(f" WebSocket connected | Role: {role} | Total {role}s: {len(self.active_connections[role])}")
    
    def disconnect(self, websocket: WebSocket, role: str = "citizen"):
        if role in self.active_connections:
            if websocket in self.active_connections[role]:
                self.active_connections[role].remove(websocket)
                logger.info(f" WebSocket disconnected | Role: {role} | Remaining: {len(self.active_connections[role])}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending personal message: {e}")
    
    async def broadcast_to_role(self, message: dict, role: str):
        if role not in self.active_connections:
            return
        
        connections = self.active_connections[role].copy()
        disconnected = []
        
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting to {role}: {e}")
                disconnected.append(connection)
        
        for conn in disconnected:
            self.disconnect(conn, role)
    
    async def broadcast_alert(self, alert: dict):
        crisis_type = alert.get('crisis_type', 'other')
        severity = alert.get('severity', 'low')
        location = alert.get('location', 'Unknown')
        
        citizen_message = {
            "type": "new_alert",
            "alert": {
                "id": alert.get('alert_id'),
                "crisis_type": crisis_type,
                "severity": severity,
                "location": location,
                "message": alert.get('message', ''),
                "timestamp": alert.get('timestamp'),
                "trust_score": alert.get('trust_score', 0.5)
            },
            "notification": f" {severity.upper()} {crisis_type} alert in {location}"
        }
        
        volunteer_message = {
            **citizen_message,
            "action_required": True if severity in ['high', 'critical'] else False,
            "coordinates": {
                "lat": alert.get('lat'),
                "lon": alert.get('lon')
            }
        }

        authority_message = {
            **volunteer_message,
            "decision": alert.get('decision', 'REVIEW'),
            "verified": alert.get('verified', False),
            "trust_breakdown": alert.get('components', {})
        }
    
        await self.broadcast_to_role(citizen_message, "citizen")
        await self.broadcast_to_role(volunteer_message, "volunteer")
        await self.broadcast_to_role(authority_message, "authority")
        await self.broadcast_to_role(authority_message, "ngo")
        
        logger.info(f"Broadcasted alert {alert.get('alert_id')} to all roles")
    
    async def broadcast_system_update(self, update: dict):
        message = {
            "type": "system_update",
            "update": update
        }
        
        for role in self.active_connections:
            await self.broadcast_to_role(message, role)
    
    def get_connection_stats(self) -> dict:
        return {
            role: len(connections)
            for role, connections in self.active_connections.items()
        }