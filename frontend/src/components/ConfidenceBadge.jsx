import React from "react";

const ConfidenceBadge = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);

  const badgeStyle = () => {
    if (confidence >= 0.8) {
      return { backgroundColor: "#4CAF50" }; // green
    } else if (confidence >= 0.5) {
      return { backgroundColor: "#FFC107" }; // yellow
    } else {
      return { backgroundColor: "#F44336" }; // red
    }
  };

  return (
    <div style={{ ...styles.badge, ...badgeStyle() }}>
      AI Confidence: {percentage}%
    </div>
  );
};

const styles = {
  badge: {
    color: "#fff",
    padding: "6px 12px",
    borderRadius: "20px",
    display: "inline-block",
    fontSize: "14px",
    marginTop: "8px"
  }
};

export default ConfidenceBadge;
