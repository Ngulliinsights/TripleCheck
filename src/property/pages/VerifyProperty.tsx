import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Button } from '@shared/components/ui/button';
import { Shield, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

/**
 * VerifyProperty Page
 * 
 * Provides property verification services and status checking
 */

const VerifyProperty: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Property Verification
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Comprehensive property verification services for secure transactions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Document Verification
              </CardTitle>
              <CardDescription>
                Verify property documents and legal ownership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Start Verification
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                Risk Assessment
              </CardTitle>
              <CardDescription>
                Comprehensive risk analysis and fraud detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Assess Risk
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 text-blue-600 mr-2" />
                Verification Report
              </CardTitle>
              <CardDescription>
                Generate detailed verification reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How Property Verification Works</CardTitle>
            <CardDescription>
              Our comprehensive verification process ensures property authenticity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">1</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Document Analysis</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    AI-powered analysis of property documents for authenticity
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">2</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Registry Verification</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Cross-reference with official government registries
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">3</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Community Intelligence</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Leverage local community knowledge and insights
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">4</span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Expert Review</h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Professional review by legal and surveying experts
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyProperty;