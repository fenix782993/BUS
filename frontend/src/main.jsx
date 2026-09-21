import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app.jsx";
import "./styles.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("FENIX CITY: #root not found");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
