import React from 'react';
import { FileText, Scale, AlertTriangle, Shield, Users, Gavel } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Scale className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            These terms govern your use of TripleCheck's property verification platform and services.
          </p>
          <p className="text-sm text-gray-500 mt-2">Last updated: December 2024</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Important Notice */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By using our services, you agree to these terms. Please read them carefully before proceeding.
            </AlertDescription>
          </Alert>

          {/* Agreement to Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-primary" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                These Terms of Service ("Terms") constitute a legally binding agreement between you and 
                TripleCheck Africa ("Company," "we," "our," or "us") regarding your use of our property 
                verification platform and related services.
              </p>
              <p>
                By accessing or using our services, you acknowledge that you have read, understood, and 
                agree to be bound by these Terms and our Privacy Policy. If you do not agree to these 
                Terms, you may not use our services.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card>
            <CardHeader>
              <CardTitle>Service Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                TripleCheck provides comprehensive property verification services including:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Core Services</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Property ownership verification</li>
                    <li>• Document authentication</li>
                    <li>• Fraud detection and prevention</li>
                    <li>• Trust scoring and reputation management</li>
                    <li>• Expert coordination services</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Additional Features</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Property listing and management</li>
                    <li>• Community intelligence integration</li>
                    <li>• Real-time alerts and notifications</li>
                    <li>• Comprehensive reporting tools</li>
                    <li>• Mobile and web platform access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Account Requirements</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• You must be at least 18 years old to use our services</li>
                  <li>• Provide accurate and complete registration information</li>
                  <li>• Maintain the security of your account credentials</li>
                  <li>• Notify us immediately of any unauthorized access</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Acceptable Use</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Use services only for lawful purposes</li>
                  <li>• Provide truthful and accurate information</li>
                  <li>• Respect intellectual property rights</li>
                  <li>• Comply with all applicable laws and regulations</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Prohibited Activities</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Submitting false or misleading information</li>
                  <li>• Attempting to circumvent security measures</li>
                  <li>• Interfering with service operation</li>
                  <li>• Using services for fraudulent purposes</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Service Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Service Limitations & Disclaimers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Verification Limitations</h4>
                <p className="text-gray-700">
                  While we strive for accuracy, our verification services are based on available information 
                  and may not detect all potential issues. Users should conduct their own due diligence.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Service Availability</h4>
                <p className="text-gray-700">
                  We aim for high availability but cannot guarantee uninterrupted service. Maintenance, 
                  updates, or technical issues may temporarily affect service availability.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Third-Party Dependencies</h4>
                <p className="text-gray-700">
                  Some services rely on third-party data sources and expert networks. We are not responsible 
                  for the accuracy or availability of third-party information.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Terms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Fees and Billing</h4>
                <ul className="space-y-2 text-gray-700">
                  <li>• Fees are charged according to your selected service plan</li>
                  <li>• All fees are non-refundable unless otherwise specified</li>
                  <li>• We reserve the right to modify pricing with 30 days notice</li>
                  <li>• Late payments may result in service suspension</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Payment Methods</h4>
                <p className="text-gray-700">
                  We accept various payment methods including M-Pesa, bank transfers, and credit cards. 
                  All payments are processed securely through our payment partners.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Our Rights</h4>
                <p className="text-gray-700">
                  All content, features, and functionality of our platform are owned by TripleCheck and 
                  protected by copyright, trademark, and other intellectual property laws.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Your Content</h4>
                <p className="text-gray-700">
                  You retain ownership of content you submit but grant us a license to use it for 
                  providing our services. You represent that you have the right to submit such content.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Liability and Indemnification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Gavel className="h-5 w-5 mr-2 text-primary" />
                Liability & Indemnification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Limitation of Liability</h4>
                <p className="text-gray-700">
                  To the maximum extent permitted by law, TripleCheck shall not be liable for any indirect, 
                  incidental, special, or consequential damages arising from your use of our services.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Indemnification</h4>
                <p className="text-gray-700">
                  You agree to indemnify and hold harmless TripleCheck from any claims, damages, or 
                  expenses arising from your use of our services or violation of these Terms.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Either party may terminate this agreement at any time. We may suspend or terminate 
                your access immediately for violations of these Terms or for any other reason.
              </p>
              <p className="text-gray-700">
                Upon termination, your right to use our services ceases immediately, but provisions 
                regarding liability, indemnification, and intellectual property survive termination.
              </p>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card>
            <CardHeader>
              <CardTitle>Governing Law & Dispute Resolution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                These Terms are governed by the laws of Kenya. Any disputes shall be resolved through 
                binding arbitration in Nairobi, Kenya, except for claims that may be brought in small 
                claims court.
              </p>
              <p className="text-gray-700">
                Before initiating formal proceedings, parties agree to attempt resolution through 
                good faith negotiations for at least 30 days.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="space-y-2 text-gray-700">
                <p>Email: legal@triplecheck.africa</p>
                <p>Phone: +254 (0) 800 TRIPLE (874753)</p>
                <p>Address: Nairobi, Kenya</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}