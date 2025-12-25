import React from "react";
import ConfidenceBadge from "./ConfidenceBadge";

const AlertCard = ({ alert }) => {
  return (
    <div style={styles.card}>
      <h3 style={styles.title}>🚨 {alert.event_type} Alert</h3>

      <p><strong>📍 Location:</strong> {alert.location}</p>
      <p><strong>⏰ Time:</strong> {alert.timestamp}</p>
      <p>
        <strong>🔥 Severity:</strong>{" "}
        <span style={severityStyle(alert.severity)}>
          {alert.severity}
        </span>
      </p>

      <ConfidenceBadge confidence={alert.confidence} />

      <p style={styles.status}>Status: Detected</p>
    </div>
  );
};

const severityStyle = (severity) => {
  switch (severity) {
    case "High":
      return { color: "red", fontWeight: "bold" };
    case "Medium":
      return { color: "orange", fontWeight: "bold" };
    default:
      return { color: "green", fontWeight: "bold" };
  }
};

const styles = {
  card: {
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "16px",
    backgroundColor: "#fff",
    boxShadow: "0px 2px 6px rgba(0,0,0,0.1)"
  },
  title: {
    marginBottom: "10px"
  },
  status: {
    marginTop: "10px",
    fontStyle: "italic",
    color: "#555"
  }
};

export default AlertCard;
