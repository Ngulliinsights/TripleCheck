import { Users, MessageSquare, BarChart3, Building2, ArrowRight, MapPin } from 'lucide-react';
import React from 'react';

import { Button } from '../ui/button';

import { cn } from '@/shared/lib/utils';

interface B2BCommunityInsightsBannerProps {
  className?: string;
  communityStats?: {
    totalUsers: number;
    activeReports: number;
    locationsTracked: number;
  };
}

export function B2BCommunityInsightsBanner({ className, communityStats }: B2BCommunityInsightsBannerProps) {
  const handleAPIInterest = () => {
    if (window?.gtag) {
      window.gtag('event', 'community_banner_click', {
        event_category: 'B2B',
        event_label: 'community_insights_banner'
      });
    }
    
    window.location.href = '/api-demo?focus=community-intelligence';
  };

  return (
    <div className={cn(
      'bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white py-8 relative overflow-hidden',
      className
    )}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="bg-white/20 p-4 rounded-xl">
              <Users className="w-8 h-8" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">
                Community Intelligence API
              </h2>
              <p className="text-purple-100 text-lg max-w-2xl">
                Access the community insights and intelligence data you see here through our enterprise API. 
                Perfect for real estate platforms and risk assessment.
              </p>
            </div>
          </div>

          {communityStats && (
            <div className="hidden lg:flex items-center space-x-8">
              <div className="text-center">
                <div className="text-3xl font-bold">{communityStats.totalUsers.toLocaleString()}</div>
                <div className="text-purple-200 text-sm">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{communityStats.activeReports.toLocaleString()}</div>
                <div className="text-purple-200 text-sm">Active Reports</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{communityStats.locationsTracked}</div>
                <div className="text-purple-200 text-sm">Locations Tracked</div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-center space-x-6 text-sm text-purple-100 mb-4 sm:mb-0">
            <div className="flex items-center">
              <MessageSquare className="w-4 h-4 mr-2" />
              <span>Real-time community data</span>
            </div>
            <div className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              <span>Trend analysis</span>
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              <span>Location-based insights</span>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={handleAPIInterest}
              className="bg-white text-purple-600 hover:bg-purple-50 font-semibold"
            >
              Explore Community API
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/contact-sales?focus=community-intelligence'}
              className="border-white text-white hover:bg-white/10"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}