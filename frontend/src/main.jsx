import React from "react";
import ReactDOM from "react-dom/client";

const root = document.getElementById("root");

root.innerHTML = "<h1 style='color:red'>HTML is rendering</h1>";

ReactDOM.createRoot(root).render(
  <h1 style={{ color: "green" }}>React is rendering</h1>
);
