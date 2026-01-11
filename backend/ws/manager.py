from fastapi import WebSocket
from typing import List, Dict

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        if role not in self.active_connections:
            self.active_connections[role] = []
        self.active_connections[role].append(websocket)

    def disconnect(self, websocket: WebSocket, role: str):
        if role in self.active_connections:
            if websocket in self.active_connections[role]:
                self.active_connections[role].remove(websocket)

    async def broadcast(self, message: str, role: str = None):
        if role:
            if role in self.active_connections:
                for connection in self.active_connections[role]:
                    try:
                        await connection.send_text(message)
                    except:
                        pass
        else:
            for connections in self.active_connections.values():
                for connection in connections:
                    try:
                        await connection.send_text(message)
                    except:
                        pass

manager = ConnectionManager()