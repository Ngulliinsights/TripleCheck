import React from "react";
import { Routes, Route } from "react-router-dom";

// Simple components without lazy loading
const HomePage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "green" }}>TripleCheck - Home Page</h1>
    <p>Welcome to TripleCheck Land Verification System</p>
    <nav style={{ marginTop: "20px" }}>
      <a href="/features" style={{ marginRight: "20px", color: "blue" }}>Features</a>
      <a href="/pricing" style={{ marginRight: "20px", color: "blue" }}>Pricing</a>
      <a href="/dashboard" style={{ marginRight: "20px", color: "blue" }}>Dashboard</a>
    </nav>
  </div>
);

const FeaturesPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "blue" }}>Features</h1>
    <p>Land verification features coming soon...</p>
    <a href="/" style={{ color: "green" }}>← Back to Home</a>
  </div>
);

const PricingPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "purple" }}>Pricing</h1>
    <p>Affordable land verification pricing...</p>
    <a href="/" style={{ color: "green" }}>← Back to Home</a>
  </div>
);

const DashboardPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "orange" }}>Dashboard</h1>
    <p>Your land verification dashboard...</p>
    <a href="/" style={{ color: "green" }}>← Back to Home</a>
  </div>
);

const NotFoundPage = () => (
  <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
    <h1 style={{ color: "red" }}>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/" style={{ color: "green" }}>← Back to Home</a>
  </div>
);

export function SimpleApp() {
  console.log("SimpleApp rendering...");
  
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