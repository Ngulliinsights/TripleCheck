import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Home, Search, ArrowLeft, HelpCircle } from 'lucide-react';

/**
 * 404 Not Found page component
 * Provides helpful navigation options and maintains brand consistency
 */
export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation('/');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleSearch = () => {
    setLocation('/?focus=search');
  };

  const handleGetHelp = () => {
    setLocation('/static/resources');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full shadow-xl border-0">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-6 w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-white">404</span>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
            Page Not Found
          </CardTitle>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track with your property verification journey.
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Button 
              onClick={handleGoHome}
              className="flex items-center justify-center gap-2 h-12 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Home className="h-5 w-5" />
              Go to Homepage
            </Button>
            
            <Button 
              onClick={handleSearch}
              variant="outline"
              className="flex items-center justify-center gap-2 h-12 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Search className="h-5 w-5" />
              Search Properties
            </Button>
          </div>

          {/* Secondary Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <Button 
              onClick={handleGoBack}
              variant="ghost"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={handleGetHelp}
              variant="ghost"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800"
            >
              <HelpCircle className="h-4 w-4" />
              Get Help
            </Button>
          </div>

          {/* Popular Links */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Popular Pages
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <button 
                onClick={() => setLocation('/services/basic-checks')}
                className="text-left text-blue-600 hover:text-blue-800 hover:underline"
              >
                Property Verification
              </button>
              <button 
                onClick={() => setLocation('/services/fraud-detection')}
                className="text-left text-blue-600 hover:text-blue-800 hover:underline"
              >
                Fraud Detection
              </button>
              <button 
                onClick={() => setLocation('/dashboard')}
                className="text-left text-blue-600 hover:text-blue-800 hover:underline"
              >
                Dashboard
              </button>
              <button 
                onClick={() => setLocation('/static/pricing')}
                className="text-left text-blue-600 hover:text-blue-800 hover:underline"
              >
                Pricing Plans
              </button>
            </div>
          </div>

          {/* Contact Information */}
          <div className="pt-4 text-center text-sm text-gray-500">
            <p>
              Still can't find what you're looking for?{' '}
              <button 
                onClick={() => setLocation('/static/resources')}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                Contact our support team
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}