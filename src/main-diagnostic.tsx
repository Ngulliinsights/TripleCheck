import React from "react";
import ReactDOM from "react-dom/client";
import DiagnosticApp from "./diagnostic-app";

console.log("Starting diagnostic mode...");

const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error("Root element not found!");
  throw new Error("Root element not found");
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <DiagnosticApp />
    </React.StrictMode>
  );
  console.log("Diagnostic app rendered successfully");
} catch (error) {
  console.error("Failed to render diagnostic app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: monospace;">
      <h2>Diagnostic Failed</h2>
      <p>Error: ${error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  `;
}