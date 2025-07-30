import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, TrendingUp, Users, MapPin, Clock } from 'lucide-react';

interface PropertyRiskAssessmentProps {
  propertyId: number;
}

interface RiskAssessment {
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskFactors: RiskFactor[];
  communityIntelligence: CommunityIntelligence;
  marketAnalysis: MarketAnalysis;
  lastUpdated: string;
}

interface RiskFactor {
  category: 'pricing' | 'ownership' | 'documentation' | 'community' | 'market';
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: number;
  recommendation: string;
}

interface CommunityIntelligence {
  communityScore: number;
  reviewCount: number;
  averageRating: number;
  verifiedReviews: number;
  riskIndicators: string[];
}

interface MarketAnalysis {
  priceVsMarket: number;
  marketTrend: 'rising' | 'stable' | 'declining';
  comparableProperties: number;
  daysOnMarket: number;
}

export default function PropertyRiskAssessment({ propertyId }: PropertyRiskAssessmentProps) {
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRiskAssessment();
  }, [propertyId]);

  const fetchRiskAssessment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch community intelligence
      const communityResponse = await fetch(`/api/community/intelligence/${propertyId}`);
      const communityData = await communityResponse.json();

      if (!communityData.success) {
        throw new Error(communityData.error || 'Failed to fetch community intelligence');
      }

      // For now, we'll create a mock risk assessment based on community data
      // In a real implementation, this would be a separate risk assessment API
      const riskAssessment = createRiskAssessment(communityData.data);
      setAssessment(riskAssessment);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load risk assessment');
    } finally {
      setLoading(false);
    }
  };

  const createRiskAssessment = (communityData: any): RiskAssessment => {
    const riskFactors: RiskFactor[] = [];
    let totalRisk = 0;

    // Analyze community score
    if (communityData.communityScore < 40) {
      riskFactors.push({
        category: 'community',
        severity: 'high',
        description: 'Low community trust score',
        impact: 30,
        recommendation: 'Investigate community concerns and verify property details'
      });
      totalRisk += 30;
    } else if (communityData.communityScore < 60) {
      riskFactors.push({
        category: 'community',
        severity: 'medium',
        description: 'Moderate community trust score',
        impact: 15,
        recommendation: 'Review community feedback and verify key details'
      });
      totalRisk += 15;
    }

    // Analyze owner trust score
    if (communityData.ownerTrustScore < 30) {
      riskFactors.push({
        category: 'ownership',
        severity: 'high',
        description: 'Owner has low trust score',
        impact: 25,
        recommendation: 'Thoroughly verify owner identity and property ownership'
      });
      totalRisk += 25;
    }

    // Analyze review patterns
    if (communityData.reviewCount === 0) {
      riskFactors.push({
        category: 'community',
        severity: 'medium',
        description: 'No community reviews available',
        impact: 10,
        recommendation: 'Seek additional verification from local sources'
      });
      totalRisk += 10;
    } else if (communityData.verifiedReviews === 0) {
      riskFactors.push({
        category: 'community',
        severity: 'medium',
        description: 'No verified reviews',
        impact: 15,
        recommendation: 'Request verified reviews or additional documentation'
      });
      totalRisk += 15;
    }

    // Analyze risk indicators
    communityData.riskIndicators.forEach((indicator: string) => {
      riskFactors.push({
        category: 'documentation',
        severity: 'medium',
        description: indicator,
        impact: 10,
        recommendation: 'Address this concern before proceeding'
      });
      totalRisk += 10;
    });

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (totalRisk >= 70) riskLevel = 'critical';
    else if (totalRisk >= 50) riskLevel = 'high';
    else if (totalRisk >= 30) riskLevel = 'medium';
    else riskLevel = 'low';

    return {
      overallRiskScore: Math.min(totalRisk, 100),
      riskLevel,
      riskFactors,
      communityIntelligence: {
        communityScore: communityData.communityScore,
        reviewCount: communityData.reviewCount,
        averageRating: communityData.averageRating,
        verifiedReviews: communityData.verifiedReviews,
        riskIndicators: communityData.riskIndicators
      },
      marketAnalysis: {
        priceVsMarket: communityData.neighborhoodInsights?.averagePrice ? 
          (100 / communityData.neighborhoodInsights.averagePrice) * 100 : 100,
        marketTrend: communityData.neighborhoodInsights?.marketTrend || 'stable',
        comparableProperties: communityData.neighborhoodInsights?.propertyCount || 0,
        daysOnMarket: 30 // Mock data
      },
      lastUpdated: communityData.lastUpdated
    };
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pricing': return <TrendingUp className="w-4 h-4" />;
      case 'ownership': return <Users className="w-4 h-4" />;
      case 'documentation': return <Shield className="w-4 h-4" />;
      case 'community': return <Users className="w-4 h-4" />;
      case 'market': return <MapPin className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Unable to Load Risk Assessment
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchRiskAssessment}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Property Risk Assessment
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Last updated: {new Date(assessment.lastUpdated).toLocaleString()}</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg border font-semibold ${getRiskLevelColor(assessment.riskLevel)}`}>
            {assessment.riskLevel.toUpperCase()} RISK
          </div>
        </div>
      </div>

      {/* Risk Score */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Overall Risk Score</h3>
          <span className="text-2xl font-bold text-gray-900">
            {assessment.overallRiskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full ${
              assessment.overallRiskScore >= 70 ? 'bg-red-500' :
              assessment.overallRiskScore >= 50 ? 'bg-orange-500' :
              assessment.overallRiskScore >= 30 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${assessment.overallRiskScore}%` }}
          />
        </div>
      </div>

      {/* Risk Factors */}
      {assessment.riskFactors.length > 0 && (
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-4">Risk Factors</h3>
          <div className="space-y-4">
            {assessment.riskFactors.map((factor, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getCategoryIcon(factor.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {factor.description}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(factor.severity)}`}>
                        {factor.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Impact: {factor.impact} points
                    </p>
                    <p className="text-sm text-blue-600">
                      <strong>Recommendation:</strong> {factor.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Community Intelligence Summary */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold mb-4">Community Intelligence</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.communityScore}
            </div>
            <div className="text-sm text-gray-600">Community Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.reviewCount}
            </div>
            <div className="text-sm text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.communityIntelligence.verifiedReviews}
            </div>
            <div className="text-sm text-gray-600">Verified</div>
          </div>
        </div>
      </div>

      {/* Market Analysis */}
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Market Analysis</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.marketAnalysis.priceVsMarket.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600">vs Market Avg</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold capitalize ${
              assessment.marketAnalysis.marketTrend === 'rising' ? 'text-green-600' :
              assessment.marketAnalysis.marketTrend === 'declining' ? 'text-red-600' :
              'text-gray-900'
            }`}>
              {assessment.marketAnalysis.marketTrend}
            </div>
            <div className="text-sm text-gray-600">Market Trend</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.marketAnalysis.comparableProperties}
            </div>
            <div className="text-sm text-gray-600">Comparables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {assessment.marketAnalysis.daysOnMarket}
            </div>
            <div className="text-sm text-gray-600">Days on Market</div>
          </div>
        </div>
      </div>
    </div>
  );
}