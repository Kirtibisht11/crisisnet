/**
 * SimulateCrisis.jsx
 * ------------------
 * This is a DEMO-ONLY component.
 *
 * Judges and mentors need a single click
 * to see the entire system come alive.
 *
 * Clicking this button:
 * 1. Calls the backend simulation endpoint
 * 2. Triggers Telegram alerts
 * 3. Updates frontend state so dashboards react instantly
 */

/*import { simulateCrisis } from "../services/api";
import { useAgentStore } from "../state/agentStore";
*/
export default function SimulateCrisis() {
  const setAlert = useAgentStore((state) => state.setAlert);

  const handleSimulate = async () => {
    try {
      // Trigger backend logic (Telegram alerts)
      await simulateCrisis();

      // Update frontend state so UI reflects the crisis
      setAlert({
        type: "Flood",
        location: "Sector 18",
        severity: "High",
      });
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  return (
    <button
      onClick={handleSimulate}
      className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800 transition"
    >
      Simulate Crisis
    </button>
  );
}
