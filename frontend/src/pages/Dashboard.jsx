import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../state/userStore";
import { connectSocket } from "../services/socket";

export default function Dashboard() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const role = (user.role || "citizen").toLowerCase();

    // 🔥 NEW: Initialize WebSocket connection once
    connectSocket(role);

    // 🔁 Existing role-based routing (unchanged)
    if (role === "volunteer") {
      navigate("/volunteer");
    } else if (role === "admin" || role === "authority") {
      navigate("/authority");
    } else {
      navigate("/citizen");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
