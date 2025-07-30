import React, { useState } from "react";

// Simple app without React Router to test React context
export function NoRouterApp() {
  const [currentPage, setCurrentPage] = useState("home");
  
  console.log("NoRouterApp rendering...");
  
  const renderPage = () => {
    switch (currentPage) {
      case "features":
        return (
          <div>
            <h1 style={{ color: "blue" }}>Features</h1>
            <p>Land verification features coming soon...</p>
            <button onClick={() => setCurrentPage("home")} style={{ color: "green" }}>
              ← Back to Home
            </button>
          </div>
        );
      case "pricing":
        return (
          <div>
            <h1 style={{ color: "purple" }}>Pricing</h1>
            <p>Affordable land verification pricing...</p>
            <button onClick={() => setCurrentPage("home")} style={{ color: "green" }}>
              ← Back to Home
            </button>
          </div>
        );
      case "dashboard":
        return (
          <div>
            <h1 style={{ color: "orange" }}>Dashboard</h1>
            <p>Your land verification dashboard...</p>
            <button onClick={() => setCurrentPage("home")} style={{ color: "green" }}>
              ← Back to Home
            </button>
          </div>
        );
      default:
        return (
          <div>
            <h1 style={{ color: "green" }}>TripleCheck - Home Page</h1>
            <p>Welcome to TripleCheck Land Verification System</p>
            <p>Environment: {import.meta.env.MODE}</p>
            <p>Current URL: {window.location.href}</p>
            <nav style={{ marginTop: "20px" }}>
              <button 
                onClick={() => setCurrentPage("features")} 
                style={{ marginRight: "20px", padding: "10px", backgroundColor: "blue", color: "white", border: "none", cursor: "pointer" }}
              >
                Features
              </button>
              <button 
                onClick={() => setCurrentPage("pricing")} 
                style={{ marginRight: "20px", padding: "10px", backgroundColor: "purple", color: "white", border: "none", cursor: "pointer" }}
              >
                Pricing
              </button>
              <button 
                onClick={() => setCurrentPage("dashboard")} 
                style={{ marginRight: "20px", padding: "10px", backgroundColor: "orange", color: "white", border: "none", cursor: "pointer" }}
              >
                Dashboard
              </button>
            </nav>
          </div>
        );
    }
  };
  
  return (
    <div style={{ 
      minHeight: "100vh", 
      backgroundColor: "#f5f5f5", 
      padding: "20px", 
      fontFamily: "Arial, sans-serif" 
    }}>
      {renderPage()}
    </div>
  );
}