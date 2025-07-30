import React from "react";

// Minimal debug app to test if React is working
export function DebugApp() {
  console.log("DebugApp rendering...");
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "green" }}>TripleCheck Debug App</h1>
      <p>If you can see this, React is working!</p>
      <p>Environment: {import.meta.env.MODE}</p>
      <p>Base URL: {import.meta.env.BASE_URL}</p>
      <p>Current URL: {window.location.href}</p>
      <button onClick={() => alert("Button works!")}>Test Button</button>
    </div>
  );
}