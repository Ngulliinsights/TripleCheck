import { ArrowRight, Building2, Mail, Phone, Calendar, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function ContactSales() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    role: '',
    phone: '',
    useCase: '',
    monthlyVolume: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Track sales inquiry
      if (window?.gtag) {
        window.gtag('event', 'sales_inquiry', {
          event_category: 'B2B',
          event_label: 'contact_sales_form',
          custom_parameters: {
            company: formData.company,
            role: formData.role,
            use_case: formData.useCase,
            monthly_volume: formData.monthlyVolume
          }
        });
      }

      // Import FormService dynamically
      const { formService } = await import('../services/FormService');
      
      // Submit form using FormService
      const result = await formService.submitSalesInquiry({
        ...formData,
        source: 'contact_sales_page'
      } as any);

      if (result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Sales inquiry failed:', error);
      // Show error state
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 nav-aware-spacing">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Your Interest!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Our sales team will contact you within 24 hours to discuss your API integration needs 
              and schedule a personalized demo.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-2 text-left">
                <li>• Sales representative will call you within 24 hours</li>
                <li>• We'll schedule a personalized API demo</li>
                <li>• Discuss your specific use case and requirements</li>
                <li>• Provide custom pricing based on your volume</li>
                <li>• Set up a pilot program if you're ready</li>
              </ul>
            </div>
            <Button
              className="mt-8"
              onClick={() => window.location.href = '/'}
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 nav-aware-spacing">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">Enterprise Sales</span>
            </div>
            <h1 className="text-4xl font-bold mb-6">
              Ready to Transform Your Land Verification Process?
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Join banks, real estate platforms, and insurance companies across Kenya 
              who trust our API for secure, fast land verification.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Get Started Today</CardTitle>
                <p className="text-gray-600">
                  Tell us about your needs and we'll create a custom solution for your business.
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company *
                      </label>
                      <input
                        id="company"
                        type="text"
                        required
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Role *
                    </label>
                    <select
                      id="role"
                      required
                      value={formData.role}
                      onChange={(e) => handleInputChange('role', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your role</option>
                      <option value="ceo">CEO/Founder</option>
                      <option value="cto">CTO</option>
                      <option value="developer">Developer</option>
                      <option value="product_manager">Product Manager</option>
                      <option value="business_owner">Business Owner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="useCase" className="block text-sm font-medium text-gray-700 mb-1">
                      Primary Use Case *
                    </label>
                    <select
                      id="useCase"
                      required
                      value={formData.useCase}
                      onChange={(e) => handleInputChange('useCase', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select your use case</option>
                      <option value="loan_collateral">Loan collateral verification</option>
                      <option value="listing_verification">Property listing verification</option>
                      <option value="insurance_risk">Insurance risk assessment</option>
                      <option value="due_diligence">Legal due diligence</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="monthlyVolume" className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Monthly Volume *
                    </label>
                    <select
                      id="monthlyVolume"
                      required
                      value={formData.monthlyVolume}
                      onChange={(e) => handleInputChange('monthlyVolume', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select expected volume</option>
                      <option value="1-100">1-100 verifications</option>
                      <option value="100-1000">100-1,000 verifications</option>
                      <option value="1000-5000">1,000-5,000 verifications</option>
                      <option value="5000+">5,000+ verifications</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Additional Details
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Tell us more about your specific requirements..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                  >
                    {isSubmitting ? 'Submitting...' : 'Contact Sales Team'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Why Choose TripleCheck API?
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Kenya-Specific Expertise</h3>
                    <p className="text-gray-600 text-sm">
                      Built specifically for Kenyan land verification with local document formats and fraud patterns.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">95% Fraud Detection</h3>
                    <p className="text-gray-600 text-sm">
                      AI-powered fraud detection with machine learning models trained on Kenyan data.
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">10-Minute Verification</h3>
                    <p className="text-gray-600 text-sm">
                      Complete property verification in minutes instead of weeks or months.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="bg-gray-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Direct Contact</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">sales@triplecheck.co.ke</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-700">+254 XXX XXX XXX</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-4">
                  Our sales team is available Monday-Friday, 9 AM - 6 PM EAT
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}