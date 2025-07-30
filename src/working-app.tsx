import React from "react";
import { Routes, Route, Link, useLocation } from "react-router-dom";

// Simple components that should work with proper React Router bundling
const HomePage = () => {
  const location = useLocation();
  
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "green" }}>TripleCheck - Home Page</h1>
      <p>Welcome to TripleCheck Land Verification System</p>
      <p>Environment: {import.meta.env.MODE}</p>
      <p>Current URL: {window.location.href}</p>
      <p>React Router Location: {location.pathname}</p>
      
      <nav style={{ marginTop: "20px" }}>
        <Link 
          to="/features" 
          style={{ 
            marginRight: "20px", 
            padding: "10px 15px", 
            backgroundColor: "blue", 
            color: "white", 
            textDecoration: "none",
            borderRadius: "5px",
            display: "inline-block"
          }}
        >
          Features
        </Link>
        <Link 
          to="/pricing" 
          style={{ 
            marginRight: "20px", 
            padding: "10px 15px", 
            backgroundColor: "purple", 
            color: "white", 
            textDecoration: "none",
            borderRadius: "5px",
            display: "inline-block"
          }}
        >
          Pricing
        </Link>
        <Link 
          to="/dashboard" 
          style={{ 
            marginRight: "20px", 
            padding: "10px 15px", 
            backgroundColor: "orange", 
            color: "white", 
            textDecoration: "none",
            borderRadius: "5px",
            display: "inline-block"
          }}
        >
          Dashboard
        </Link>
      </nav>
    </div>
  );
};

const FeaturesPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "blue" }}>Features</h1>
    <p>🔍 Land Verification Engine</p>
    <p>🛡️ Advanced Fraud Detection</p>
    <p>📄 Document Authentication</p>
    <p>🤝 Trust & Reputation System</p>
    <p>💬 Communication Platform</p>
    <Link to="/" style={{ color: "green", textDecoration: "none", fontSize: "16px" }}>
      ← Back to Home
    </Link>
  </div>
);

const PricingPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "purple" }}>Pricing</h1>
    <div style={{ marginTop: "20px" }}>
      <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "5px" }}>
        <h3>Basic Verification</h3>
        <p>KES 500 per property</p>
        <p>✓ Document verification</p>
        <p>✓ Basic fraud checks</p>
      </div>
      <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "5px" }}>
        <h3>Premium Verification</h3>
        <p>KES 1,500 per property</p>
        <p>✓ Full land verification</p>
        <p>✓ Expert coordination</p>
        <p>✓ Community intelligence</p>
      </div>
    </div>
    <Link to="/" style={{ color: "green", textDecoration: "none", fontSize: "16px" }}>
      ← Back to Home
    </Link>
  </div>
);

const DashboardPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "orange" }}>Dashboard</h1>
    <p>Your land verification dashboard</p>
    <div style={{ marginTop: "20px" }}>
      <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "5px" }}>
        <h3>Recent Verifications</h3>
        <p>No verifications yet</p>
      </div>
      <div style={{ border: "1px solid #ccc", padding: "15px", marginBottom: "15px", borderRadius: "5px" }}>
        <h3>Trust Score</h3>
        <p>Building your reputation...</p>
      </div>
    </div>
    <Link to="/" style={{ color: "green", textDecoration: "none", fontSize: "16px" }}>
      ← Back to Home
    </Link>
  </div>
);

const NotFoundPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "red" }}>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/" style={{ color: "green", textDecoration: "none", fontSize: "16px" }}>
      ← Back to Home
    </Link>
  </div>
);

export function WorkingApp() {
  console.log("WorkingApp rendering with React Router...");
  
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}