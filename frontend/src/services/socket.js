// frontend/src/services/socket.js

let socket = null;
let listeners = [];

/**
 * Connect to backend WebSocket
 * @param {string} role - citizen | volunteer | authority | ngo
 */
export function connectSocket(role = "citizen") {
  if (socket && socket.readyState === WebSocket.OPEN) {
    return socket;
  }

  const WS_URL = `ws://localhost:8000/ws?role=${role}`;

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("🔌 WebSocket connected:", role);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("📡 WebSocket event:", data);

      // Notify all listeners
      listeners.forEach((cb) => cb(data));
    } catch (err) {
      console.error("WebSocket parse error:", err);
    }
  };

  socket.onclose = () => {
    console.warn("⚠️ WebSocket disconnected. Reconnecting...");
    socket = null;

    // Auto-reconnect after 3 seconds
    setTimeout(() => connectSocket(role), 3000);
  };

  socket.onerror = (err) => {
    console.error("WebSocket error:", err);
    socket?.close();
  };

  return socket;
}

/**
 * Subscribe to WebSocket events
 * @param {(data: any) => void} callback
 */
export function subscribe(callback) {
  listeners.push(callback);

  // Return unsubscribe function
  return () => {
    listeners = listeners.filter((cb) => cb !== callback);
  };
}

/**
 * Close WebSocket manually
 */
export function disconnectSocket() {
  if (socket) {
    socket.close();
    socket = null;
    listeners = [];
  }
}
