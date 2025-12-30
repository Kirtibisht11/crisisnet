import { simulateCrisis } from "../services/api";
import { useAgentStore } from "../state/agentStore";

export default function SimulateCrisis() {
  const setAlert = useAgentStore((s) => s.setAlert);

  const handleSimulate = async () => {
    try {
      const data = await simulateCrisis();
      setAlert(data.alert || { type: "Flood", location: "Sector 18", severity: "High" });
    } catch (err) {
      console.error("Simulation failed:", err);
    }
  };

  return (
    <button
      onClick={handleSimulate}
      className="bg-black text-white px-5 py-2 rounded-md hover:bg-gray-800"
    >
      Simulate Crisis
    </button>
  );
}
