import React from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a query client for data fetching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Simple fallback components to avoid complex dependencies
const HomePage = () => (
  <div>
    {/* Hero Section */}
    <section style={{ 
      background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
      color: "white",
      padding: "4rem 2rem",
      textAlign: "center" as const
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ 
          fontSize: "3.5rem", 
          fontWeight: "bold", 
          marginBottom: "1.5rem",
          lineHeight: "1.1"
        }}>
          Secure Land Verification for Kenya
        </h1>
        <p style={{ 
          fontSize: "1.25rem", 
          marginBottom: "2rem",
          opacity: 0.9,
          maxWidth: "600px",
          margin: "0 auto 2rem"
        }}>
          Protect your property investments with comprehensive verification using government records, 
          community intelligence, and expert assessments.
        </p>
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/properties" style={{ 
            padding: "1rem 2rem", 
            backgroundColor: "white", 
            color: "#14b8a6", 
            textDecoration: "none",
            borderRadius: "0.5rem",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}>
            Browse Properties
          </a>
          <a href="/auth/register" style={{ 
            padding: "1rem 2rem", 
            backgroundColor: "transparent", 
            color: "white", 
            textDecoration: "none",
            borderRadius: "0.5rem",
            border: "2px solid white",
            fontWeight: "600",
            fontSize: "1.1rem"
          }}>
            Get Started Free
          </a>
        </div>
      </div>
    </section>

    {/* Stats Section */}
    <section style={{ padding: "3rem 2rem", backgroundColor: "white" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "2rem",
          textAlign: "center" as const
        }}>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#14b8a6", marginBottom: "0.5rem" }}>
              1,000+
            </div>
            <p style={{ color: "#6b7280" }}>Properties Verified</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#14b8a6", marginBottom: "0.5rem" }}>
              500+
            </div>
            <p style={{ color: "#6b7280" }}>Trusted Users</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#14b8a6", marginBottom: "0.5rem" }}>
              99.9%
            </div>
            <p style={{ color: "#6b7280" }}>Accuracy Rate</p>
          </div>
          <div>
            <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#14b8a6", marginBottom: "0.5rem" }}>
              24/7
            </div>
            <p style={{ color: "#6b7280" }}>Expert Support</p>
          </div>
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section style={{ padding: "4rem 2rem", backgroundColor: "#f8fafc" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ textAlign: "center" as const, marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "2.5rem", color: "#1f2937", marginBottom: "1rem" }}>
            Why Choose TripleCheck?
          </h2>
          <p style={{ fontSize: "1.1rem", color: "#6b7280", maxWidth: "600px", margin: "0 auto" }}>
            Our comprehensive verification system combines multiple data sources to give you complete confidence in your property transactions.
          </p>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
          <div style={{ 
            padding: "2rem", 
            backgroundColor: "white", 
            borderRadius: "0.75rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              backgroundColor: "#dcfce7", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "1.5rem"
            }}>
              🔍
            </div>
            <h3 style={{ color: "#1f2937", marginBottom: "1rem", fontSize: "1.25rem" }}>
              Multi-Source Verification
            </h3>
            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Combines government records, community intelligence, expert assessments, and AI analysis for comprehensive land verification.
            </p>
          </div>

          <div style={{ 
            padding: "2rem", 
            backgroundColor: "white", 
            borderRadius: "0.75rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              backgroundColor: "#fef3c7", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "1.5rem"
            }}>
              🛡️
            </div>
            <h3 style={{ color: "#1f2937", marginBottom: "1rem", fontSize: "1.25rem" }}>
              Advanced Fraud Detection
            </h3>
            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Machine learning algorithms continuously monitor for suspicious patterns and fraudulent activities to protect your investments.
            </p>
          </div>

          <div style={{ 
            padding: "2rem", 
            backgroundColor: "white", 
            borderRadius: "0.75rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              backgroundColor: "#dbeafe", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "1.5rem"
            }}>
              📄
            </div>
            <h3 style={{ color: "#1f2937", marginBottom: "1rem", fontSize: "1.25rem" }}>
              Document Authentication
            </h3>
            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Multi-modal document verification for title deeds, sale agreements, and government certificates with digital forensics.
            </p>
          </div>

          <div style={{ 
            padding: "2rem", 
            backgroundColor: "white", 
            borderRadius: "0.75rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              backgroundColor: "#f3e8ff", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "1.5rem"
            }}>
              🤝
            </div>
            <h3 style={{ color: "#1f2937", marginBottom: "1rem", fontSize: "1.25rem" }}>
              Expert Coordination
            </h3>
            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Seamless collaboration with legal experts, surveyors, and local authorities for comprehensive property assessment.
            </p>
          </div>

          <div style={{ 
            padding: "2rem", 
            backgroundColor: "white", 
            borderRadius: "0.75rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              backgroundColor: "#fce7f3", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "1.5rem"
            }}>
              🏘️
            </div>
            <h3 style={{ color: "#1f2937", marginBottom: "1rem", fontSize: "1.25rem" }}>
              Community Intelligence
            </h3>
            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Leverage local community knowledge and historical data to provide comprehensive property insights and risk assessment.
            </p>
          </div>

          <div style={{ 
            padding: "2rem", 
            backgroundColor: "white", 
            borderRadius: "0.75rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #e5e7eb"
          }}>
            <div style={{ 
              width: "60px", 
              height: "60px", 
              backgroundColor: "#ecfdf5", 
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
              fontSize: "1.5rem"
            }}>
              ⛓️
            </div>
            <h3 style={{ color: "#1f2937", marginBottom: "1rem", fontSize: "1.25rem" }}>
              Blockchain Records
            </h3>
            <p style={{ color: "#6b7280", lineHeight: "1.6" }}>
              Immutable record keeping for verification history, ensuring transparency and preventing tampering with property records.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* CTA Section */}
    <section style={{ 
      padding: "4rem 2rem", 
      backgroundColor: "#1f2937",
      color: "white",
      textAlign: "center" as const
    }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>
          Ready to Secure Your Property Investment?
        </h2>
        <p style={{ fontSize: "1.1rem", marginBottom: "2rem", opacity: 0.9 }}>
          Join thousands of Kenyans who trust TripleCheck for their land verification needs.
        </p>
        <a href="/auth/register" style={{ 
          padding: "1rem 2rem", 
          backgroundColor: "#14b8a6", 
          color: "white", 
          textDecoration: "none",
          borderRadius: "0.5rem",
          fontWeight: "600",
          fontSize: "1.1rem",
          display: "inline-block"
        }}>
          Start Verification Today
        </a>
      </div>
    </section>
  </div>
);

const FeaturesPage = () => (
  <div style={{ padding: "2rem" }}>
    <h1 style={{ fontSize: "2.5rem", color: "#14b8a6", marginBottom: "2rem" }}>Features</h1>
    <div style={{ display: "grid", gap: "2rem" }}>
      <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>🏠 Property Management</h3>
        <p>Advanced property listings with verification status and detailed analytics.</p>
      </div>
      <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>🤝 Trust & Reputation</h3>
        <p>Community-based trust scoring and transparent reputation management.</p>
      </div>
      <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>💬 Communication Platform</h3>
        <p>Secure messaging and expert coordination for seamless transactions.</p>
      </div>
    </div>
  </div>
);

const PricingPage = () => (
  <div style={{ padding: "2rem" }}>
    <h1 style={{ fontSize: "2.5rem", color: "#14b8a6", marginBottom: "2rem", textAlign: "center" as const }}>Pricing</h1>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" as const }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>Basic Verification</h3>
        <div style={{ fontSize: "2rem", color: "#14b8a6", marginBottom: "1rem" }}>KES 500</div>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>per property</p>
        <ul style={{ textAlign: "left" as const, color: "#374151" }}>
          <li>✓ Document verification</li>
          <li>✓ Basic fraud checks</li>
          <li>✓ Government record search</li>
        </ul>
      </div>
      <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" as const, border: "2px solid #14b8a6" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>Premium Verification</h3>
        <div style={{ fontSize: "2rem", color: "#14b8a6", marginBottom: "1rem" }}>KES 1,500</div>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>per property</p>
        <ul style={{ textAlign: "left" as const, color: "#374151" }}>
          <li>✓ Full land verification</li>
          <li>✓ Expert coordination</li>
          <li>✓ Community intelligence</li>
          <li>✓ Physical verification</li>
          <li>✓ Blockchain records</li>
        </ul>
      </div>
      <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", textAlign: "center" as const }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>Enterprise</h3>
        <div style={{ fontSize: "2rem", color: "#14b8a6", marginBottom: "1rem" }}>Custom</div>
        <p style={{ color: "#6b7280", marginBottom: "1.5rem" }}>bulk pricing</p>
        <ul style={{ textAlign: "left" as const, color: "#374151" }}>
          <li>✓ Volume discounts</li>
          <li>✓ API access</li>
          <li>✓ Custom integrations</li>
          <li>✓ Priority support</li>
        </ul>
      </div>
    </div>
  </div>
);

const DashboardPage = () => (
  <div style={{ padding: "2rem" }}>
    <h1 style={{ fontSize: "2.5rem", color: "#14b8a6", marginBottom: "2rem" }}>Dashboard</h1>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
      <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>Recent Verifications</h3>
        <p style={{ color: "#6b7280" }}>No verifications yet. Start by verifying your first property.</p>
      </div>
      <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>Trust Score</h3>
        <div style={{ fontSize: "2rem", color: "#14b8a6", marginBottom: "0.5rem" }}>Building...</div>
        <p style={{ color: "#6b7280" }}>Complete verifications to build your reputation.</p>
      </div>
      <div style={{ padding: "1.5rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <h3 style={{ color: "#1f2937", marginBottom: "1rem" }}>Quick Actions</h3>
        <button style={{ 
          padding: "0.75rem 1.5rem", 
          backgroundColor: "#14b8a6", 
          color: "white", 
          border: "none", 
          borderRadius: "0.25rem", 
          cursor: "pointer",
          marginRight: "1rem"
        }}>
          Verify Property
        </button>
      </div>
    </div>
  </div>
);

const LoginPage = () => (
  <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
    <h1 style={{ fontSize: "2.5rem", color: "#14b8a6", marginBottom: "2rem", textAlign: "center" as const }}>Login</h1>
    <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <form>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151" }}>Email</label>
          <input 
            type="email" 
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "0.25rem",
              fontSize: "1rem"
            }} 
            placeholder="Enter your email"
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151" }}>Password</label>
          <input 
            type="password" 
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "0.25rem",
              fontSize: "1rem"
            }} 
            placeholder="Enter your password"
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: "100%", 
            padding: "0.75rem", 
            backgroundColor: "#14b8a6", 
            color: "white", 
            border: "none", 
            borderRadius: "0.25rem", 
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          Sign In
        </button>
      </form>
      <p style={{ textAlign: "center" as const, marginTop: "1rem", color: "#6b7280" }}>
        Don't have an account? <a href="/auth/register" style={{ color: "#14b8a6" }}>Sign up</a>
      </p>
    </div>
  </div>
);

const RegisterPage = () => (
  <div style={{ padding: "2rem", maxWidth: "400px", margin: "0 auto" }}>
    <h1 style={{ fontSize: "2.5rem", color: "#14b8a6", marginBottom: "2rem", textAlign: "center" as const }}>Register</h1>
    <div style={{ padding: "2rem", backgroundColor: "white", borderRadius: "0.5rem", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
      <form>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151" }}>Full Name</label>
          <input 
            type="text" 
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "0.25rem",
              fontSize: "1rem"
            }} 
            placeholder="Enter your full name"
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151" }}>Email</label>
          <input 
            type="email" 
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "0.25rem",
              fontSize: "1rem"
            }} 
            placeholder="Enter your email"
          />
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem", color: "#374151" }}>Password</label>
          <input 
            type="password" 
            style={{ 
              width: "100%", 
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "0.25rem",
              fontSize: "1rem"
            }} 
            placeholder="Create a password"
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: "100%", 
            padding: "0.75rem", 
            backgroundColor: "#14b8a6", 
            color: "white", 
            border: "none", 
            borderRadius: "0.25rem", 
            fontSize: "1rem",
            cursor: "pointer"
          }}
        >
          Create Account
        </button>
      </form>
      <p style={{ textAlign: "center" as const, marginTop: "1rem", color: "#6b7280" }}>
        Already have an account? <a href="/auth/login" style={{ color: "#14b8a6" }}>Sign in</a>
      </p>
    </div>
  </div>
);

// Properties page with sample data
const PropertiesPage = () => {
  const sampleProperties = [
    {
      id: 1,
      title: "Modern 3BR Apartment in Kilimani",
      location: "Kilimani, Nairobi",
      price: "KES 25,000,000",
      verificationStatus: "verified",
      image: "/placeholder-property.jpg",
      features: ["3 Bedrooms", "2 Bathrooms", "Parking", "Security"]
    },
    {
      id: 2,
      title: "Family Home in Karen",
      location: "Karen, Nairobi",
      price: "KES 45,000,000",
      verificationStatus: "pending",
      image: "/placeholder-property.jpg",
      features: ["4 Bedrooms", "3 Bathrooms", "Garden", "Staff Quarters"]
    },
    {
      id: 3,
      title: "Commercial Plot in Westlands",
      location: "Westlands, Nairobi",
      price: "KES 35,000,000",
      verificationStatus: "verified",
      image: "/placeholder-property.jpg",
      features: ["0.5 Acres", "Commercial Zone", "Road Access", "Utilities"]
    }
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.5rem", color: "#1f2937", marginBottom: "0.5rem" }}>Properties</h1>
        <p style={{ color: "#6b7280" }}>Browse verified properties in Kenya</p>
      </div>

      {/* Search and filters */}
      <div style={{ 
        backgroundColor: "white", 
        padding: "1.5rem", 
        borderRadius: "0.5rem", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "2rem"
      }}>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input 
            type="text" 
            placeholder="Search properties..." 
            style={{ 
              flex: 1,
              minWidth: "300px",
              padding: "0.75rem", 
              border: "1px solid #d1d5db", 
              borderRadius: "0.25rem",
              fontSize: "1rem"
            }} 
          />
          <select style={{ 
            padding: "0.75rem", 
            border: "1px solid #d1d5db", 
            borderRadius: "0.25rem",
            fontSize: "1rem"
          }}>
            <option>All Locations</option>
            <option>Nairobi</option>
            <option>Mombasa</option>
            <option>Kisumu</option>
          </select>
          <select style={{ 
            padding: "0.75rem", 
            border: "1px solid #d1d5db", 
            borderRadius: "0.25rem",
            fontSize: "1rem"
          }}>
            <option>All Types</option>
            <option>Apartment</option>
            <option>House</option>
            <option>Land</option>
            <option>Commercial</option>
          </select>
          <button style={{ 
            padding: "0.75rem 1.5rem", 
            backgroundColor: "#14b8a6", 
            color: "white", 
            border: "none", 
            borderRadius: "0.25rem",
            cursor: "pointer"
          }}>
            Search
          </button>
        </div>
      </div>

      {/* Property grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", 
        gap: "2rem" 
      }}>
        {sampleProperties.map(property => (
          <div key={property.id} style={{ 
            backgroundColor: "white", 
            borderRadius: "0.5rem", 
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            overflow: "hidden",
            transition: "transform 0.2s",
            cursor: "pointer"
          }}>
            <div style={{ 
              height: "200px", 
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6b7280"
            }}>
              🏠 Property Image
            </div>
            <div style={{ padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, color: "#1f2937", fontSize: "1.25rem" }}>{property.title}</h3>
                <span style={{ 
                  padding: "0.25rem 0.75rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "500",
                  backgroundColor: property.verificationStatus === "verified" ? "#dcfce7" : "#fef3c7",
                  color: property.verificationStatus === "verified" ? "#166534" : "#92400e"
                }}>
                  {property.verificationStatus === "verified" ? "✓ Verified" : "⏳ Pending"}
                </span>
              </div>
              <p style={{ color: "#6b7280", marginBottom: "0.5rem" }}>📍 {property.location}</p>
              <p style={{ color: "#14b8a6", fontWeight: "bold", fontSize: "1.25rem", marginBottom: "1rem" }}>
                {property.price}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
                {property.features.map((feature, index) => (
                  <span key={index} style={{ 
                    padding: "0.25rem 0.5rem",
                    backgroundColor: "#f3f4f6",
                    borderRadius: "0.25rem",
                    fontSize: "0.875rem",
                    color: "#374151"
                  }}>
                    {feature}
                  </span>
                ))}
              </div>
              <button style={{ 
                width: "100%",
                padding: "0.75rem", 
                backgroundColor: "#14b8a6", 
                color: "white", 
                border: "none", 
                borderRadius: "0.25rem",
                cursor: "pointer",
                fontSize: "1rem"
              }}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced layout component with proper navigation
const EnhancedLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column" }}>
    <header style={{ 
      backgroundColor: "#14b8a6", 
      color: "white", 
      padding: "1rem 2rem",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      position: "sticky" as const,
      top: 0,
      zIndex: 50
    }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div style={{ 
            width: "32px", 
            height: "32px", 
            backgroundColor: "white", 
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#14b8a6",
            fontWeight: "bold"
          }}>
            ✓
          </div>
          <h1 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold" }}>
            TripleCheck
          </h1>
        </div>
        <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a href="/" style={{ 
            color: "white", 
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            transition: "background-color 0.2s"
          }}>
            Home
          </a>
          <a href="/features" style={{ 
            color: "white", 
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem"
          }}>
            Features
          </a>
          <a href="/pricing" style={{ 
            color: "white", 
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem"
          }}>
            Pricing
          </a>
          <a href="/properties" style={{ 
            color: "white", 
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem"
          }}>
            Properties
          </a>
          <a href="/dashboard" style={{ 
            color: "white", 
            textDecoration: "none",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem"
          }}>
            Dashboard
          </a>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <a href="/auth/login" style={{ 
              color: "white", 
              textDecoration: "none",
              padding: "0.5rem 1rem",
              border: "1px solid white",
              borderRadius: "0.25rem"
            }}>
              Login
            </a>
            <a href="/auth/register" style={{ 
              backgroundColor: "white", 
              color: "#14b8a6", 
              textDecoration: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              fontWeight: "500"
            }}>
              Sign Up
            </a>
          </div>
        </nav>
      </div>
    </header>
    <main style={{ flex: 1, padding: "0" }}>
      {children}
    </main>
    <footer style={{ 
      backgroundColor: "#1f2937", 
      color: "white", 
      padding: "3rem 2rem 2rem",
      marginTop: "auto"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "2rem",
          marginBottom: "2rem"
        }}>
          <div>
            <h3 style={{ color: "#14b8a6", marginBottom: "1rem" }}>TripleCheck</h3>
            <p style={{ color: "#9ca3af", lineHeight: "1.6" }}>
              Secure land verification platform for Kenya, combining government records, 
              community intelligence, and expert assessments.
            </p>
          </div>
          <div>
            <h4 style={{ marginBottom: "1rem" }}>Services</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <a href="/services/verification" style={{ color: "#9ca3af", textDecoration: "none" }}>Land Verification</a>
              <a href="/services/fraud-detection" style={{ color: "#9ca3af", textDecoration: "none" }}>Fraud Detection</a>
              <a href="/services/document-auth" style={{ color: "#9ca3af", textDecoration: "none" }}>Document Authentication</a>
            </div>
          </div>
          <div>
            <h4 style={{ marginBottom: "1rem" }}>Support</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <a href="/help" style={{ color: "#9ca3af", textDecoration: "none" }}>Help Center</a>
              <a href="/contact" style={{ color: "#9ca3af", textDecoration: "none" }}>Contact Us</a>
              <a href="/privacy" style={{ color: "#9ca3af", textDecoration: "none" }}>Privacy Policy</a>
            </div>
          </div>
        </div>
        <div style={{ 
          borderTop: "1px solid #374151", 
          paddingTop: "2rem", 
          textAlign: "center" as const,
          color: "#9ca3af"
        }}>
          <p>&copy; 2024 TripleCheck - Secure Land Verification for Kenya</p>
        </div>
      </div>
    </footer>
  </div>
);

// Simple error boundary
class SimpleErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TripleCheck Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SimpleLayout>
          <div style={{ 
            padding: "2rem", 
            backgroundColor: "#fee2e2", 
            border: "1px solid #fecaca",
            borderRadius: "0.5rem",
            color: "#991b1b"
          }}>
            <h2>Something went wrong</h2>
            <p>We're sorry, but something went wrong. Please try refreshing the page.</p>
            <details style={{ marginTop: "1rem" }}>
              <summary>Error details</summary>
              <pre style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
                {this.state.error?.message}
              </pre>
            </details>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer"
              }}
            >
              Refresh Page
            </button>
          </div>
        </SimpleLayout>
      );
    }

    return this.props.children;
  }
}

// Simple 404 component
const NotFoundPage = () => (
  <div style={{ textAlign: "center" as const, padding: "4rem 2rem" }}>
    <h1 style={{ fontSize: "3rem", color: "#dc2626", marginBottom: "1rem" }}>404</h1>
    <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Page Not Found</h2>
    <p style={{ marginBottom: "2rem", color: "#6b7280" }}>
      The page you're looking for doesn't exist.
    </p>
    <a 
      href="/" 
      style={{
        display: "inline-block",
        padding: "0.75rem 1.5rem",
        backgroundColor: "#14b8a6",
        color: "white",
        textDecoration: "none",
        borderRadius: "0.5rem",
        fontWeight: "500"
      }}
    >
      Go Home
    </a>
  </div>
);

export function SimpleTripleCheckApp() {
  console.log("SimpleTripleCheckApp rendering...");
  
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleErrorBoundary>
        <EnhancedLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/properties" element={<PropertiesPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </EnhancedLayout>
      </SimpleErrorBoundary>
    </QueryClientProvider>
  );
}