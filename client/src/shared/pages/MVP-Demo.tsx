import { Shield, FileText, Users, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import DocumentAuthentication from '../../trust/components/DocumentAuthentication'
import PropertyRiskAssessment from '../../trust/components/PropertyRiskAssessment'

export default function MVPDemo() {
  const [activeDemo, setActiveDemo] = useState<'fraud-detection' | 'document-auth' | 'community-intel' | 'risk-assessment' | 'dashboard'>('fraud-detection');
  const [demoPropertyId] = useState(1); // Mock property ID for demo
  const navigate = useNavigate();

  const demoSections = [
    {
      id: 'fraud-detection' as const,
      title: 'Fraud Detection',
      icon: <Shield className="w-5 h-5" />,
      description: 'Analyze actual property data for fraud patterns'
    },
    {
      id: 'document-auth' as const,
      title: 'Document Authentication',
      icon: <FileText className="w-5 h-5" />,
      description: 'Real document verification with AI analysis'
    },
    {
      id: 'community-intel' as const,
      title: 'Community Intelligence',
      icon: <Users className="w-5 h-5" />,
      description: 'Leverage community reviews and feedback'
    },
    {
      id: 'risk-assessment' as const,
      title: 'Risk Assessment',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Comprehensive property risk analysis'
    },
    {
      id: 'dashboard' as const,
      title: 'User Dashboard',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Full platform dashboard experience'
    }
  ];

  const FraudDetectionDemo = () => {
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const runFraudDetection = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/fraud-intelligence/trends?period=month');
        const data = await response.json();
        setResults(data.data);
      } catch (error) {
        console.error('Fraud detection failed:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-red-600" />
            <div>
              <h3 className="text-xl font-semibold text-red-900">Real Fraud Detection</h3>
              <p className="text-red-700">Using actual property data to identify suspicious patterns</p>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={runFraudDetection}
              disabled={loading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing Properties...' : 'Run Fraud Analysis'}
            </button>
          </div>

          {results && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3">Analysis Results</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-red-600">{results.summary?.totalCases || 0}</div>
                  <div className="text-sm text-gray-600">Suspicious Properties</div>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-2xl font-bold text-orange-600">
                    KES {((results.summary?.totalAmount || 0) / 1000000).toFixed(1)}M
                  </div>
                  <div className="text-sm text-gray-600">Total Value at Risk</div>
                </div>
              </div>
              
              {results.trends && results.trends.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Fraud Trends</h5>
                  <div className="space-y-2">
                    {results.trends.map((trend: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="capitalize">{trend.type.replace('_', ' ')}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{trend.totalCases} cases</span>
                          <span className={`text-sm font-medium ${
                            trend.change > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {trend.change > 0 ? '+' : ''}{trend.change}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">What&apos;s Real Here</h4>
              <ul className="text-sm text-blue-800 mt-2 space-y-1">
                <li>• Analyzes actual property data from our database</li>
                <li>• Compares prices against location averages</li>
                <li>• Detects duplicate listings and suspicious patterns</li>
                <li>• Identifies properties with missing images or descriptions</li>
                <li>• Tracks owner listing patterns for anomalies</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CommunityIntelligenceDemo = () => {
    const [loading, setLoading] = useState(false);
    const [intelligence, setIntelligence] = useState<any>(null);

    const loadCommunityIntelligence = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/community/intelligence/${demoPropertyId}`);
        const data = await response.json();
        setIntelligence(data.data);
      } catch (error) {
        console.error('Community intelligence failed:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-xl font-semibold text-blue-900">Community Intelligence</h3>
              <p className="text-blue-700">Real community feedback and neighborhood insights</p>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={loadCommunityIntelligence}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading Intelligence...' : 'Load Community Data'}
            </button>
          </div>

          {intelligence && (
            <div className="bg-white rounded-lg p-4 border">
              <h4 className="font-semibold mb-3">Community Analysis</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-blue-600">{intelligence.communityScore}</div>
                  <div className="text-sm text-gray-600">Community Score</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-green-600">{intelligence.reviewCount}</div>
                  <div className="text-sm text-gray-600">Reviews</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-yellow-600">{intelligence.averageRating.toFixed(1)}</div>
                  <div className="text-sm text-gray-600">Avg Rating</div>
                </div>
                <div className="bg-gray-50 p-3 rounded text-center">
                  <div className="text-2xl font-bold text-purple-600">{intelligence.ownerTrustScore}</div>
                  <div className="text-sm text-gray-600">Owner Trust</div>
                </div>
              </div>

              {intelligence.riskIndicators && intelligence.riskIndicators.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2 text-orange-600">Risk Indicators</h5>
                  <div className="space-y-1">
                    {intelligence.riskIndicators.map((indicator: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span>{indicator}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">What&apos;s Real Here</h4>
              <ul className="text-sm text-green-800 mt-2 space-y-1">
                <li>• Uses actual review data from our database</li>
                <li>• Calculates real owner trust scores</li>
                <li>• Analyzes neighborhood price trends</li>
                <li>• Detects suspicious review patterns</li>
                <li>• Provides market comparison data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              TripleCheck Platform Demo
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Experience our comprehensive property verification platform with real fraud detection, 
              document authentication, and community intelligence capabilities.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Full Platform Access</h3>
                  <p className="text-sm text-blue-800 mt-1">
                    Test all features including document verification, fraud detection, community intelligence, 
                    and access the complete user dashboard - no signup required.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {demoSections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveDemo(section.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  activeDemo === section.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                <span className="font-medium">{section.title}</span>
              </button>
            ))}
          </div>
          <p className="text-muted-foreground mt-2">
            {demoSections.find(s => s.id === activeDemo)?.description}
          </p>
        </div>

        {/* Demo Content */}
        <div className="space-y-8">
          {activeDemo === 'fraud-detection' && <FraudDetectionDemo />}
          
          {activeDemo === 'document-auth' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Real Document Authentication</h4>
                    <p className="text-sm text-green-800 mt-1">
                      Upload actual documents to see real metadata analysis, file signature verification, 
                      and tampering detection. No more fake progress bars.
                    </p>
                  </div>
                </div>
              </div>
              <DocumentAuthentication />
            </div>
          )}
          
          {activeDemo === 'community-intel' && <CommunityIntelligenceDemo />}
          
          {activeDemo === 'risk-assessment' && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-purple-900">Comprehensive Risk Assessment</h4>
                    <p className="text-sm text-purple-800 mt-1">
                      Combines real community intelligence, market analysis, and property data 
                      to provide actionable risk insights.
                    </p>
                  </div>
                </div>
              </div>
              <PropertyRiskAssessment propertyId={demoPropertyId} />
            </div>
          )}
          
          {activeDemo === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Full Platform Experience</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      Access the complete user dashboard with property management, verification history, 
                      and account features - no authentication required for this demo.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg border p-8 text-center">
                <TrendingUp className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  Experience the Full Dashboard
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  See how users manage their properties, track verifications, view analytics, 
                  and access all platform features in our comprehensive dashboard.
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  Open Dashboard
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  Opens in the same window • Full functionality available
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Platform Features */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Core Features</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Advanced fraud detection and pattern analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Document authentication and verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Community intelligence and market insights</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Comprehensive risk assessment tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                  <span>Integrated payment processing</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Capabilities</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Machine learning-powered pattern recognition</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Government registry integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Expert network coordination</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Blockchain verification infrastructure</span>
                </li>
                <li className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>Real-time monitoring and alerts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}