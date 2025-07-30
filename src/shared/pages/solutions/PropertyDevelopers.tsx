import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Shield, Users, TrendingUp, CheckCircle, ArrowRight, MapPin, FileText, Clock, Award } from 'lucide-react';

const PropertyDevelopers: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <Building2 className="h-8 w-8 text-blue-300 mr-3" />
                <span className="text-blue-300 font-semibold">For Property Developers</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Scale Your Development Projects with 
                <span className="text-blue-300"> Verified Land</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Eliminate project delays and legal complications with enterprise-grade land verification. 
                Build with confidence on verified, fraud-free properties.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/auth/register"
                  className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
                >
                  Start Enterprise Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/contact"
                  className="border-2 border-blue-300 text-blue-300 hover:bg-blue-300 hover:text-blue-900 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
                >
                  Schedule Demo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">95%</div>
                    <div className="text-sm text-blue-100">Project Risk Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">60%</div>
                    <div className="text-sm text-blue-100">Faster Due Diligence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">24/7</div>
                    <div className="text-sm text-blue-100">Verification Access</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-300">100+</div>
                    <div className="text-sm text-blue-100">Projects Verified</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Challenges Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Development Challenges We Solve
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Property development in Kenya faces unique challenges. Our platform addresses the critical issues that can derail projects.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Land Fraud Risk</h3>
              <p className="text-gray-600 mb-4">
                Multiple ownership claims, forged documents, and fraudulent sellers can halt projects and cause massive losses.
              </p>
              <div className="text-sm text-red-600 font-medium">
                Average loss: KES 50M+ per fraudulent transaction
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-6">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Lengthy Due Diligence</h3>
              <p className="text-gray-600 mb-4">
                Traditional verification takes 3-6 months, delaying project timelines and increasing costs.
              </p>
              <div className="text-sm text-yellow-600 font-medium">
                Average delay: 4-8 months per project
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Complex Documentation</h3>
              <p className="text-gray-600 mb-4">
                Multiple government agencies, varying document requirements, and changing regulations create confusion.
              </p>
              <div className="text-sm text-blue-600 font-medium">
                15+ different document types to verify
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise Land Verification Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive verification services designed for large-scale development projects.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Bulk Property Verification</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Multi-Property Analysis</div>
                    <div className="text-gray-600">Verify multiple properties simultaneously for large developments</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Risk Scoring Dashboard</div>
                    <div className="text-gray-600">Real-time risk assessment across your entire portfolio</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Automated Reporting</div>
                    <div className="text-gray-600">Generate compliance reports for investors and regulators</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">72 Hours</div>
                <div className="text-gray-600 mb-6">Average verification time for 50+ properties</div>
                <div className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="text-sm text-gray-500 mb-2">Traditional Method</div>
                  <div className="text-2xl font-bold text-red-500">6+ Months</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Expert Network Access</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">200+</div>
                    <div className="text-sm text-gray-600">Legal Experts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">150+</div>
                    <div className="text-sm text-gray-600">Licensed Surveyors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">47</div>
                    <div className="text-sm text-gray-600">Counties Covered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">24/7</div>
                    <div className="text-sm text-gray-600">Support Available</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Professional Expert Coordination</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Dedicated Project Manager</div>
                    <div className="text-gray-600">Single point of contact for all verification activities</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">On-Site Verification</div>
                    <div className="text-gray-600">Physical verification by certified local experts</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Award className="h-6 w-6 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-gray-900">Legal Compliance</div>
                    <div className="text-gray-600">Ensure full compliance with Kenyan land laws</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Developer Success Stories</h2>
            <p className="text-xl text-gray-600">Real results from property developers using TripleCheck</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Nairobi Heights Development</div>
                  <div className="text-gray-600">Mixed-use development, Kiambu</div>
                </div>
              </div>
              <blockquote className="text-gray-700 mb-6">
                "TripleCheck saved our 200-unit project from a major fraud attempt. Their verification uncovered forged documents that would have cost us KES 80 million. The 3-day verification process was incredible compared to our usual 4-month timeline."
              </blockquote>
              <div className="flex items-center justify-between text-sm">
                <div className="text-green-600 font-semibold">KES 80M saved</div>
                <div className="text-blue-600 font-semibold">97% time reduction</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Coastal Resort Project</div>
                  <div className="text-gray-600">Luxury resort, Mombasa</div>
                </div>
              </div>
              <blockquote className="text-gray-700 mb-6">
                "The bulk verification feature allowed us to verify 15 beachfront properties in just 5 days. The detailed risk reports gave our investors confidence to proceed with the KES 2.5 billion project."
              </blockquote>
              <div className="flex items-center justify-between text-sm">
                <div className="text-green-600 font-semibold">15 properties verified</div>
                <div className="text-blue-600 font-semibold">5 days completion</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise Pricing</h2>
          <p className="text-xl text-gray-600 mb-8">Flexible pricing for development projects of any size</p>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">KES 15,000</div>
                <div className="text-gray-600">Per property verification</div>
                <div className="text-sm text-gray-500 mt-1">Volume discounts available</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">50% Off</div>
                <div className="text-gray-600">Bulk verification (10+ properties)</div>
                <div className="text-sm text-gray-500 mt-1">KES 7,500 per property</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">Custom</div>
                <div className="text-gray-600">Enterprise packages</div>
                <div className="text-sm text-gray-500 mt-1">Dedicated support included</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/pricing"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              View Full Pricing
            </Link>
            <Link
              to="/contact"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              Request Custom Quote
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Next Development?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join leading developers who trust TripleCheck for their land verification needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth/register"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
            >
              Start Enterprise Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-lg font-semibold transition-colors"
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PropertyDevelopers;