import React, { useState } from 'react';
import { ArrowRight, Building2, Shield, Zap, CheckCircle, Copy, Play } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function ApiDemo() {
  const [activeTab, setActiveTab] = useState('verification');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);

  const runDemo = async () => {
    setIsRunning(true);
    
    // Simulate API call
    setTimeout(() => {
      setResult({
        success: true,
        verificationId: "ver_" + Math.random().toString(36).substr(2, 9),
        status: "completed",
        riskScore: 0.15,
        ownership: "verified",
        recommendations: ["proceed_with_transaction"],
        processingTime: "8.2 seconds"
      });
      setIsRunning(false);
    }, 2000);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const verificationCode = `// Land Verification API Example
const response = await fetch('https://api.triplecheck.co.ke/v1/land-verification/verify', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    propertyId: 'LR123456',
    documents: [{
      type: 'title_deed',
      url: 'https://example.com/deed.pdf'
    }],
    location: {
      latitude: -1.2921,
      longitude: 36.8219
    },
    webhookUrl: 'https://yourapp.com/webhook'
  })
});

const verification = await response.json();
console.log(verification);`;

  const fraudDetectionCode = `// Fraud Detection API Example
const response = await fetch('https://api.triplecheck.co.ke/v1/fraud-detection/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documents: [{
      type: 'title_deed',
      content: 'base64_encoded_content'
    }],
    metadata: {
      propertyId: 'LR123456',
      transactionValue: 5000000
    }
  })
});

const analysis = await response.json();`;

  return (
    <div className="min-h-screen bg-gray-50 nav-aware-spacing">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">Enterprise API</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              TripleCheck Land Verification API
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              The same powerful verification you see on our platform, now available as an API 
              for banks, real estate platforms, and insurance companies across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100"
                onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <Play className="w-5 h-5 mr-2" />
                Try Live Demo
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
                onClick={() => window.location.href = '/contact-sales'}
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">10-Minute Verification</h3>
              <p className="text-gray-600">Complete property verification in minutes, not months</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">95% Fraud Detection</h3>
              <p className="text-gray-600">AI-powered fraud detection with Kenya-specific models</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Ready</h3>
              <p className="text-gray-600">Scalable API with SLA guarantees and dedicated support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try the API Live</h2>
              <p className="text-gray-600">See how easy it is to integrate land verification into your platform</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Code Example */}
              <div>
                <div className="flex space-x-4 mb-4">
                  <button
                    onClick={() => setActiveTab('verification')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'verification' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Land Verification
                  </button>
                  <button
                    onClick={() => setActiveTab('fraud')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'fraud' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Fraud Detection
                  </button>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg">API Example</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyCode(activeTab === 'verification' ? verificationCode : fraudDetectionCode)}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{activeTab === 'verification' ? verificationCode : fraudDetectionCode}</code>
                    </pre>
                  </CardContent>
                </Card>
              </div>

              {/* Demo Results */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Live Demo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button
                        onClick={runDemo}
                        disabled={isRunning}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {isRunning ? 'Running Verification...' : 'Run Demo Verification'}
                        <Play className="w-4 h-4 ml-2" />
                      </Button>

                      {result && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center">
                            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                            Verification Complete
                          </h4>
                          <pre className="text-sm text-gray-700 overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>
                      )}

                      <div className="text-sm text-gray-600">
                        <p><strong>Processing Time:</strong> 8.2 seconds</p>
                        <p><strong>Risk Score:</strong> 0.15 (Low Risk)</p>
                        <p><strong>Status:</strong> Verified ✓</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 mb-12">Choose the plan that fits your verification volume</p>

            <div className="grid md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Pay-per-use</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">$3<span className="text-lg text-gray-600">/verification</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ No monthly commitment</li>
                    <li>✓ All API features</li>
                    <li>✓ Email support</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-2 border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle>Professional</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">$1,500<span className="text-lg text-gray-600">/month</span></div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ 5,000 verifications included</li>
                    <li>✓ Priority support</li>
                    <li>✓ Custom webhooks</li>
                    <li>✓ Analytics dashboard</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Enterprise</CardTitle>
                  <div className="text-3xl font-bold text-blue-600">Custom</div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Unlimited verifications</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ Custom integrations</li>
                    <li>✓ SLA guarantees</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of companies using TripleCheck API to verify land across Kenya
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
              onClick={() => window.location.href = '/contact-sales'}
            >
              Get Your API Key
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => window.location.href = '/api-docs'}
            >
              View Documentation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}