/**
 * api.js
 * -------
 * Central place for all frontend → backend API calls.
 *
 * This keeps network logic out of UI components,
 * so pages stay clean and readable.
 *
 * For now, we only expose a crisis simulation endpoint,
 * which is used during demo to trigger the entire system.
 */

const BASE_URL = "http://localhost:8000";

// Triggers a fake crisis on the backend.
// Backend then sends Telegram alerts.
export const simulateCrisis = async () => {
  const response = await fetch(`${BASE_URL}/simulate-crisis`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Failed to simulate crisis");
  }

  return response.json();
};
