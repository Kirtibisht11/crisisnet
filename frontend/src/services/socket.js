let socket = null;
let listeners = {};
let heartbeatInterval = null;

const WS_URL = "ws://localhost:8000/ws";

function connect() {
  if (socket && socket.readyState === WebSocket.OPEN) return;

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("[WS] Connected");

    // 🔴 Heartbeat to keep connection alive
    heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "ping" }));
      }
    }, 15000);
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const { type, payload } = data;

      if (listeners[type]) {
        listeners[type].forEach((cb) => cb(payload));
      }
    } catch (err) {
      console.warn("[WS] Invalid message", err);
    }
  };

  socket.onclose = () => {
    console.warn("[WS] Disconnected — retrying...");
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    setTimeout(connect, 3000); // 🔁 auto reconnect
  };

  socket.onerror = (err) => {
    console.error("[WS] Error", err);
    socket.close();
  };
}

export function connectSocket() {
  connect();
  return socket;
}

export function subscribe(eventType, callback) {
  connect();

  if (!listeners[eventType]) {
    listeners[eventType] = [];
  }

  listeners[eventType].push(callback);

  // unsubscribe function
  return () => {
    listeners[eventType] = listeners[eventType].filter(
      (cb) => cb !== callback
    );
  };
}

export function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
  clearInterval(heartbeatInterval);
  heartbeatInterval = null;
  listeners = {};
}
