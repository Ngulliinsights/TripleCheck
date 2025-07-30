import React from 'react';
import { Shield, Eye, Lock, Database, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-12 w-12 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your privacy is fundamental to our mission. Learn how we protect and handle your data.
          </p>
          <p className="text-sm text-gray-500 mt-2">Last updated: December 2024</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-8">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-primary" />
                Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-gray max-w-none">
              <p>
                TripleCheck Africa ("we," "our," or "us") is committed to protecting your privacy and personal data. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                use our property verification platform and related services.
              </p>
              <p>
                By using our services, you agree to the collection and use of information in accordance with this policy. 
                We will not use or share your information with anyone except as described in this Privacy Policy.
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg mb-3">Personal Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Name, email address, and phone number</li>
                  <li>• Government-issued identification documents</li>
                  <li>• Property ownership documents and certificates</li>
                  <li>• Payment information and transaction history</li>
                  <li>• Professional credentials and certifications</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-lg mb-3">Property Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Property details, descriptions, and specifications</li>
                  <li>• Location data and geographic coordinates</li>
                  <li>• Property images and documentation</li>
                  <li>• Verification history and status</li>
                  <li>• Market valuations and assessments</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-3">Technical Information</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Device information and browser type</li>
                  <li>• IP address and location data</li>
                  <li>• Usage patterns and interaction data</li>
                  <li>• Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card>
            <CardHeader>
              <CardTitle>How We Use Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3">Service Delivery</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Property verification and authentication</li>
                    <li>• Fraud detection and prevention</li>
                    <li>• Trust scoring and reputation management</li>
                    <li>• Expert coordination and communication</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-3">Platform Improvement</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Service optimization and enhancement</li>
                    <li>• Security monitoring and threat detection</li>
                    <li>• Analytics and performance measurement</li>
                    <li>• Customer support and assistance</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Protection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                Data Protection & Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We implement industry-standard security measures to protect your personal information:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• End-to-end encryption</li>
                    <li>• Secure data transmission (SSL/TLS)</li>
                    <li>• Regular security audits</li>
                    <li>• Access controls and authentication</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Operational Safeguards</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Employee training and background checks</li>
                    <li>• Data minimization practices</li>
                    <li>• Regular backup and recovery procedures</li>
                    <li>• Incident response protocols</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card>
            <CardHeader>
              <CardTitle>Your Privacy Rights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                You have the following rights regarding your personal data:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Access:</strong> Request copies of your personal data</li>
                    <li>• <strong>Rectification:</strong> Correct inaccurate information</li>
                    <li>• <strong>Erasure:</strong> Request deletion of your data</li>
                    <li>• <strong>Portability:</strong> Transfer your data to another service</li>
                  </ul>
                </div>
                <div>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Restriction:</strong> Limit how we process your data</li>
                    <li>• <strong>Objection:</strong> Object to certain processing activities</li>
                    <li>• <strong>Withdraw Consent:</strong> Revoke previously given consent</li>
                    <li>• <strong>Complaint:</strong> File complaints with regulatory authorities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card>
            <CardHeader>
              <CardTitle>Data Sharing & Third Parties</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                We may share your information with trusted third parties in the following circumstances:
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold">Service Providers</h4>
                  <p className="text-gray-700">
                    Verification experts, payment processors, and technical service providers who assist in delivering our services.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Legal Requirements</h4>
                  <p className="text-gray-700">
                    When required by law, court order, or to protect our rights and the safety of our users.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold">Business Transfers</h4>
                  <p className="text-gray-700">
                    In connection with mergers, acquisitions, or asset sales, with appropriate data protection measures.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or wish to exercise your rights, contact us:
              </p>
              <div className="space-y-3">
                <div className="flex items-center text-gray-700">
                  <Mail className="h-4 w-4 mr-3 text-primary" />
                  <span>privacy@triplecheck.africa</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Phone className="h-4 w-4 mr-3 text-primary" />
                  <span>+254 (0) 800 TRIPLE (874753)</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Data Protection Officer: privacy@triplecheck.africa
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}