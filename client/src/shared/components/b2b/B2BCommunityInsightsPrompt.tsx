import { Users, MessageSquare, TrendingUp, Building2, ArrowRight, BarChart3, MapPin } from 'lucide-react'
import React, { useState } from 'react'

import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'

import { cn } from '../../lib/utils'

interface B2BCommunityInsightsPromptProps {
  className?: string;
  insightsData?: {
    communityScore: number;
    totalReports: number;
    verifiedUsers: number;
    location?: string;
    trendingTopics?: string[];
  };
  variant?: 'inline' | 'widget' | 'banner';
  context?: 'community_page' | 'insights_report' | 'user_profile';
}

export function B2BCommunityInsightsPrompt({ 
  className, 
  insightsData,
  variant = 'inline',
  context = 'community_page'
}: B2BCommunityInsightsPromptProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAPIInterest = () => {
    // Track community insights API interest
    if (window?.gtag) {
      window.gtag('event', 'community_api_interest', {
        event_category: 'B2B',
        event_label: 'community_insights_prompt',
        custom_parameters: {
          community_score: insightsData?.communityScore,
          total_reports: insightsData?.totalReports,
          verified_users: insightsData?.verifiedUsers,
          context,
          variant
        }
      });
    }
    
    window.location.href = '/api-demo?focus=community-intelligence';
  };

  const getCommunityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-blue-600 bg-blue-100';
    if (score >= 40) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCommunityScoreText = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  if (variant === 'banner') {
    return (
      <div className={cn('bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4', className)}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Community Intelligence API</h3>
                <p className="text-purple-100">
                  Access community insights like these through our enterprise API
                </p>
              </div>
              {insightsData && (
                <div className="hidden md:flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg">{insightsData.communityScore}</div>
                    <div className="text-purple-200">Community Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{insightsData.totalReports}</div>
                    <div className="text-purple-200">Reports</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg">{insightsData.verifiedUsers}</div>
                    <div className="text-purple-200">Verified Users</div>
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={handleAPIInterest}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              Explore API
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'widget') {
    return (
      <Card className={cn('w-full max-w-sm shadow-lg border-l-4 border-l-purple-500', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <BarChart3 className="w-5 h-5 text-purple-500 mr-2" />
            Community API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {insightsData && (
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {insightsData.communityScore}
                </div>
                <div className="text-xs text-gray-600">Community Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {insightsData.totalReports}
                </div>
                <div className="text-xs text-gray-600">Total Reports</div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-3">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">
              Enterprise Access
            </h4>
            <p className="text-xs text-gray-600 mb-3">
              Get community intelligence data through our API for your platform
            </p>
            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>✓ Real-time data</span>
              <span>✓ Location-based</span>
            </div>
            <Button
              size="sm"
              onClick={handleAPIInterest}
              className="w-full text-xs bg-purple-600 hover:bg-purple-700"
            >
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default inline variant
  return (
    <Card className={cn('border-l-4 border-l-purple-500 shadow-sm', className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">
                Community Intelligence Available
              </h4>
              {insightsData && (
                <div className="flex items-center space-x-4 mb-2">
                  <Badge className={getCommunityScoreColor(insightsData.communityScore)}>
                    {getCommunityScoreText(insightsData.communityScore)}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {insightsData.totalReports} community reports
                  </span>
                  {insightsData.location && (
                    <span className="text-sm text-gray-600 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {insightsData.location}
                    </span>
                  )}
                </div>
              )}
              <p className="text-sm text-gray-600 mb-3">
                <strong>For Businesses:</strong> Access community intelligence data through our API. 
                Real estate platforms and insurers use this for risk assessment.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  <span>Community reports</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>Trend analysis</span>
                </div>
                <div className="flex items-center">
                  <BarChart3 className="w-3 h-3 mr-1" />
                  <span>Risk scoring</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Button
              size="sm"
              onClick={handleAPIInterest}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              API Demo
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
            {!isExpanded && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs text-purple-600 hover:text-purple-800"
              >
                Learn more
              </button>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-purple-50 rounded-lg p-3">
              <h5 className="font-semibold text-purple-900 mb-2 text-sm">
                Community Intelligence API Features
              </h5>
              <ul className="text-xs text-purple-800 space-y-1">
                <li>• Real-time community sentiment analysis</li>
                <li>• Location-based risk scoring</li>
                <li>• Historical trend data</li>
                <li>• Verified user insights</li>
                <li>• Custom reporting dashboards</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-purple-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-700">Starting at $500/month</span>
                  <span className="text-purple-700">Enterprise volume discounts</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}