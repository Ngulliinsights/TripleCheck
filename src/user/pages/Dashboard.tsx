import React, { useState, useCallback, useMemo } from "react";
import { useLocation } from "wouter";

interface DashboardStats {
  totalProperties: number;
  verifiedProperties: number;
  totalViews: number;
  totalInquiries: number;
  trustScore: number;
  pendingVerifications: number;
}

interface User {
  id: string;
  username: string;
  email: string;
  membershipTier: "basic" | "premium" | "enterprise";
}

interface Property {
  id: number;
  title: string;
  price: number;
  location: string;
  verificationStatus: "verified" | "pending" | "draft";
  imageUrls?: string[];
}

interface ActivityItem {
  id: string;
  type: "success" | "info" | "warning" | "inquiry";
  title: string;
  description: string;
  timestamp: string;
  actionRequired?: boolean;
}

export function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "properties" | "analytics">("overview");
  const [filterStatus, setFilterStatus] = useState<"all" | "verified" | "pending" | "draft">("all");

  // Mock data - in real app, this would come from API
  const user: User = {
    id: "demo",
    username: "Demo User",
    email: "demo@triplecheck.com",
    membershipTier: "basic",
  };

  const properties: Property[] = [
    {
      id: 1,
      title: "Modern Apartment in Westlands",
      price: 150000,
      location: "Westlands, Nairobi",
      verificationStatus: "verified",
      imageUrls: ["/placeholder-property.jpg"],
    },
    {
      id: 2,
      title: "Villa in Karen",
      price: 350000,
      location: "Karen, Nairobi",
      verificationStatus: "pending",
      imageUrls: ["/placeholder-property-2.jpg"],
    },
    {
      id: 3,
      title: "Office Space in CBD",
      price: 200000,
      location: "CBD, Nairobi",
      verificationStatus: "draft",
      imageUrls: ["/placeholder-property-3.jpg"],
    },
  ];

  const computedData = useMemo(() => {
    const verified = properties.filter(p => p.verificationStatus === "verified");
    const pending = properties.filter(p => p.verificationStatus === "pending");
    const draft = properties.filter(p => p.verificationStatus === "draft");

    const dashboardStats: DashboardStats = {
      totalProperties: properties.length,
      verifiedProperties: verified.length,
      totalViews: 12450,
      totalInquiries: 89,
      trustScore: 85,
      pendingVerifications: pending.length,
    };

    const filteredProperties = 
      filterStatus === "all" ? properties :
      filterStatus === "verified" ? verified :
      filterStatus === "pending" ? pending : draft;

    return {
      verifiedProperties: verified,
      pendingProperties: pending,
      draftProperties: draft,
      dashboardStats,
      filteredProperties,
    };
  }, [filterStatus]);

  const recentActivity: ActivityItem[] = [
    {
      id: "1",
      type: "success",
      title: "Property Verified",
      description: "Modern Apartment in Westlands completed verification process",
      timestamp: "2 hours ago",
      actionRequired: false,
    },
    {
      id: "2",
      type: "inquiry",
      title: "New Inquiry",
      description: "Someone is interested in your Karen property",
      timestamp: "3 hours ago",
      actionRequired: true,
    },
    {
      id: "3",
      type: "warning",
      title: "Documents Needed",
      description: "Villa in Karen requires additional documents",
      timestamp: "5 hours ago",
      actionRequired: true,
    },
  ];

  const handleListProperty = useCallback(() => {
    setLocation("/services/list-property");
  }, [setLocation]);

  const handleVerifyProperty = useCallback(() => {
    setLocation("/services/basic-checks");
  }, [setLocation]);

  const handleViewProperty = useCallback((propertyId: number) => {
    setLocation(`/property/${propertyId}`);
  }, [setLocation]);

  const StatsCard = ({ 
    title, 
    value, 
    description, 
    icon 
  }: { 
    title: string; 
    value: string | number; 
    description: string; 
    icon: string;
  }) => (
    <div className="bg-white p-6 rounded-lg border hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );

  const PropertyCard = ({ property }: { property: Property }) => (
    <div className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-video bg-gray-200 relative">
        <img
          src={property.imageUrls?.[0] || "/placeholder-property.jpg"}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            property.verificationStatus === 'verified' 
              ? 'bg-green-100 text-green-800' 
              : property.verificationStatus === 'pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {property.verificationStatus === 'verified' ? '✓ Verified' : 
             property.verificationStatus === 'pending' ? '⏳ Pending' : '📝 Draft'}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">{property.title}</h3>
        <p className="text-gray-600 text-sm mb-2">📍 {property.location}</p>
        <p className="text-lg font-bold text-blue-600 mb-3">
          KES {property.price.toLocaleString()}
        </p>
        <div className="flex gap-2">
          <button
            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700 transition-colors"
            onClick={() => handleViewProperty(property.id)}
          >
            👁️ View
          </button>
          <button className="flex-1 border border-gray-300 py-2 px-3 rounded text-sm hover:bg-gray-50 transition-colors">
            ✏️ Edit
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Welcome back, {user.username}!</h1>
            <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
              {user.membershipTier.charAt(0).toUpperCase() + user.membershipTier.slice(1)}
            </span>
          </div>
          <p className="text-gray-600">
            Manage your properties, track performance, and grow your real estate portfolio
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="relative border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            🔔 Notifications
            {computedData.dashboardStats.pendingVerifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {computedData.dashboardStats.pendingVerifications}
              </span>
            )}
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            onClick={handleListProperty}
          >
            ➕ List Property
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Properties"
          value={computedData.dashboardStats.totalProperties}
          description={`${computedData.verifiedProperties.length} verified`}
          icon="🏠"
        />
        <StatsCard
          title="Total Views"
          value={computedData.dashboardStats.totalViews.toLocaleString()}
          description={`${computedData.dashboardStats.totalInquiries} inquiries`}
          icon="👁️"
        />
        <StatsCard
          title="Trust Score"
          value={computedData.dashboardStats.trustScore}
          description="Based on verification & activity"
          icon="🏆"
        />
        <StatsCard
          title="Pending Verifications"
          value={computedData.dashboardStats.pendingVerifications}
          description="Require attention"
          icon="⏳"
        />
      </div>

      {/* Progress Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            🎯 Portfolio Health
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Verification Progress</span>
                <span className="font-medium">
                  {Math.round((computedData.verifiedProperties.length / computedData.dashboardStats.totalProperties) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ 
                    width: `${Math.round((computedData.verifiedProperties.length / computedData.dashboardStats.totalProperties) * 100)}%` 
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📊 Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                <span className="text-lg">
                  {activity.type === 'success' ? '✅' : 
                   activity.type === 'inquiry' ? '💬' : '⚠️'}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{activity.title}</p>
                    {activity.actionRequired && (
                      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-xs">
                        Action Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'properties', label: 'Properties', icon: '🏠' },
            { id: 'analytics', label: 'Analytics', icon: '📈' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ⚡ Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                onClick={handleListProperty}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>➕</span>
                  <span className="font-medium">List New Property</span>
                </div>
                <span className="text-xs text-gray-600">Add a new property to your portfolio</span>
              </button>
              <button
                className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-left"
                onClick={handleVerifyProperty}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>🛡️</span>
                  <span className="font-medium">Verify Properties</span>
                </div>
                <span className="text-xs text-gray-600">Complete verification for pending listings</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">📈 Performance Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Views</span>
                <span className="font-medium">{computedData.dashboardStats.totalViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Inquiries</span>
                <span className="font-medium">{computedData.dashboardStats.totalInquiries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Trust Score</span>
                <span className="font-medium text-green-600">{computedData.dashboardStats.trustScore}/100</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'properties' && (
        <div className="bg-white rounded-lg border">
          <div className="p-6 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                🏠 Your Properties ({computedData.filteredProperties.length})
              </h3>
              <div className="flex items-center gap-2">
                {(['all', 'verified', 'pending', 'draft'] as const).map((status) => (
                  <button
                    key={status}
                    className={`px-3 py-1 rounded text-sm ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6">
            {computedData.filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {computedData.filteredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-xl font-semibold mb-2">No properties found</h3>
                <p className="text-gray-600 mb-6">
                  {filterStatus === "all" 
                    ? "Start building your portfolio by listing your first property."
                    : `No ${filterStatus} properties found. Try a different filter.`
                  }
                </p>
                <button
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  onClick={handleListProperty}
                >
                  ➕ List Your First Property
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              📊 Property Performance
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Views</span>
                <span className="font-medium text-blue-600">{computedData.dashboardStats.totalViews.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Inquiries</span>
                <span className="font-medium text-green-600">{computedData.dashboardStats.totalInquiries}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Listings</span>
                <span className="font-medium text-purple-600">{computedData.verifiedProperties.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🎯 Goals & Targets
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Verification Target</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ 
                      width: `${Math.round((computedData.verifiedProperties.length / computedData.dashboardStats.totalProperties) * 100)}%` 
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Trust Score Goal</span>
                  <span>90+</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full"
                    style={{ width: `${computedData.dashboardStats.trustScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;