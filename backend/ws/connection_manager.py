# backend/ws/connection_manager.py

from typing import Dict, List
from fastapi import WebSocket
import json


class ConnectionManager:
    def __init__(self):
        # Store connections like:
        # {
        #   "citizen": [WebSocket, WebSocket],
        #   "authority": [WebSocket],
        #   "ngo": [WebSocket]
        # }
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, role: str):
        """
        Accept and register a websocket connection under a role
        """
        await websocket.accept()

        role = role.lower()
        if role not in self.active_connections:
            self.active_connections[role] = []

        self.active_connections[role].append(websocket)

    def disconnect(self, websocket: WebSocket, role: str):
        """
        Remove websocket from active connections
        """
        role = role.lower()
        if role in self.active_connections:
            if websocket in self.active_connections[role]:
                self.active_connections[role].remove(websocket)

            if len(self.active_connections[role]) == 0:
                del self.active_connections[role]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Send message to a single websocket client
        """
        await websocket.send_text(json.dumps(message))

    async def broadcast(self, message: dict):
        """
        Send message to ALL connected clients
        """
        for role in self.active_connections:
            for websocket in self.active_connections[role]:
                await websocket.send_text(json.dumps(message))

    async def broadcast_to_role(self, message: dict, role: str):
        """
        Send message only to a specific role
        """
        role = role.lower()
        if role not in self.active_connections:
            return

        for websocket in self.active_connections[role]:
            await websocket.send_text(json.dumps(message))

    async def broadcast_to_roles(self, message: dict, roles: List[str]):
        """
        Send message to multiple roles
        """
        for role in roles:
            await self.broadcast_to_role(message, role)

    def get_active_stats(self):
        """
        Return count of connected clients per role
        """
        return {
            role: len(connections)
            for role, connections in self.active_connections.items()
        }
manager = ConnectionManager()
