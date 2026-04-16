"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Security;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var badge_1 = require("../components/ui/badge");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
function Security() {
    var securityFeatures = [
        {
            icon: lucide_react_1.Lock,
            title: 'End-to-End Encryption',
            description: 'All data is encrypted in transit and at rest using industry-standard AES-256 encryption.',
            status: 'active'
        },
        {
            icon: lucide_react_1.Shield,
            title: 'Multi-Factor Authentication',
            description: 'Additional security layer requiring multiple forms of verification for account access.',
            status: 'active'
        },
        {
            icon: lucide_react_1.Eye,
            title: 'Continuous Monitoring',
            description: '24/7 security monitoring with real-time threat detection and automated response.',
            status: 'active'
        },
        {
            icon: lucide_react_1.Server,
            title: 'Secure Infrastructure',
            description: 'Cloud infrastructure with enterprise-grade security controls and regular audits.',
            status: 'active'
        }
    ];
    var certifications = [
        {
            name: 'SOC 2 Type II',
            description: 'Comprehensive security, availability, and confidentiality controls',
            status: 'Certified',
            year: '2024'
        },
        {
            name: 'ISO 27001',
            description: 'International standard for information security management systems',
            status: 'Certified',
            year: '2024'
        },
        {
            name: 'GDPR Compliant',
            description: 'Full compliance with European data protection regulations',
            status: 'Compliant',
            year: '2024'
        },
        {
            name: 'PCI DSS',
            description: 'Payment card industry data security standards compliance',
            status: 'Compliant',
            year: '2024'
        }
    ];
    return (<div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <lucide_react_1.Shield className="h-12 w-12 text-primary mr-3"/>
            <h1 className="text-4xl font-bold text-gray-900">Security Center</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Your security is our top priority. Learn about the comprehensive measures we take to protect your data and transactions.
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Security Overview */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.Shield className="h-6 w-6 mr-2 text-primary"/>
                Security Overview
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-gray-700 mb-6">
                TripleCheck employs a multi-layered security approach to protect your sensitive property 
                and personal information. Our security framework is built on industry best practices and 
                continuously updated to address emerging threats.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {securityFeatures.map(function (feature, index) {
            var Icon = feature.icon;
            return (<div key={index} className="text-center p-4 border rounded-lg">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-3"/>
                      <h3 className="font-semibold mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{feature.description}</p>
                      <badge_1.Badge variant="secondary" className="bg-green-100 text-green-800">
                        <lucide_react_1.CheckCircle className="h-3 w-3 mr-1"/>
                        Active
                      </badge_1.Badge>
                    </div>);
        })}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Data Protection */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.Lock className="h-6 w-6 mr-2 text-primary"/>
                Data Protection
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Encryption Standards</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>AES-256 encryption for data at rest</span>
                    </li>
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>TLS 1.3 for data in transit</span>
                    </li>
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>End-to-end encryption for sensitive communications</span>
                    </li>
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>Encrypted database storage with key rotation</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Access Controls</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>Role-based access control (RBAC)</span>
                    </li>
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>Multi-factor authentication (MFA)</span>
                    </li>
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>Regular access reviews and deprovisioning</span>
                    </li>
                    <li className="flex items-start">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"/>
                      <span>Principle of least privilege enforcement</span>
                    </li>
                  </ul>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Infrastructure Security */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.Server className="h-6 w-6 mr-2 text-primary"/>
                Infrastructure Security
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-semibold mb-3">Cloud Security</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Enterprise-grade cloud infrastructure</li>
                    <li>• Distributed denial-of-service (DDoS) protection</li>
                    <li>• Web application firewall (WAF)</li>
                    <li>• Network segmentation and isolation</li>
                    <li>• Regular penetration testing</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Monitoring & Detection</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• 24/7 security operations center (SOC)</li>
                    <li>• Real-time threat intelligence</li>
                    <li>• Automated incident response</li>
                    <li>• Comprehensive audit logging</li>
                    <li>• Behavioral anomaly detection</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3">Backup & Recovery</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Automated daily backups</li>
                    <li>• Geographic redundancy</li>
                    <li>• Point-in-time recovery</li>
                    <li>• Disaster recovery procedures</li>
                    <li>• Regular recovery testing</li>
                  </ul>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Compliance & Certifications */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.FileText className="h-6 w-6 mr-2 text-primary"/>
                Compliance & Certifications
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-gray-700 mb-6">
                We maintain rigorous compliance standards and undergo regular third-party audits 
                to ensure our security practices meet industry requirements.
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {certifications.map(function (cert, index) { return (<div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{cert.name}</h3>
                      <badge_1.Badge variant="secondary" className="bg-green-100 text-green-800">
                        {cert.status} {cert.year}
                      </badge_1.Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{cert.description}</p>
                  </div>); })}
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Security Best Practices */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.Users className="h-6 w-6 mr-2 text-primary"/>
                Security Best Practices for Users
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-6">
              <p className="text-gray-700">
                While we implement comprehensive security measures, your cooperation is essential 
                for maintaining the highest level of security.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4">Account Security</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Use strong, unique passwords</li>
                    <li>• Enable multi-factor authentication</li>
                    <li>• Regularly review account activity</li>
                    <li>• Log out from shared devices</li>
                    <li>• Keep contact information updated</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-lg mb-4">Safe Practices</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Verify URLs before entering credentials</li>
                    <li>• Be cautious of phishing attempts</li>
                    <li>• Report suspicious activities immediately</li>
                    <li>• Keep your devices and browsers updated</li>
                    <li>• Use secure networks for sensitive operations</li>
                  </ul>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Incident Response */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle className="flex items-center">
                <lucide_react_1.AlertTriangle className="h-6 w-6 mr-2 text-primary"/>
                Incident Response
              </card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent className="space-y-4">
              <p className="text-gray-700">
                We have established comprehensive incident response procedures to quickly identify, 
                contain, and resolve security incidents.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center p-4 border rounded-lg">
                  <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-red-600 font-bold">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">Detection</h3>
                  <p className="text-sm text-gray-600">
                    Automated monitoring systems detect potential security incidents in real-time.
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-yellow-600 font-bold">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">Response</h3>
                  <p className="text-sm text-gray-600">
                    Our security team immediately investigates and contains the incident.
                  </p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 font-bold">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">Recovery</h3>
                  <p className="text-sm text-gray-600">
                    Systems are restored and additional safeguards are implemented.
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>

          {/* Report Security Issues */}
          <card_1.Card>
            <card_1.CardHeader>
              <card_1.CardTitle>Report Security Issues</card_1.CardTitle>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-gray-700 mb-6">
                If you discover a security vulnerability or have concerns about our security practices, 
                please report them immediately through our responsible disclosure program.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button_1.Button className="flex items-center">
                  <lucide_react_1.AlertTriangle className="h-4 w-4 mr-2"/>
                  Report Security Issue
                </button_1.Button>
                <button_1.Button variant="outline">
                  <lucide_react_1.FileText className="h-4 w-4 mr-2"/>
                  Security Documentation
                </button_1.Button>
              </div>
              
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Security Contact</h4>
                <p className="text-gray-700">Email: security@triplecheck.africa</p>
                <p className="text-gray-700">Phone: +254 (0) 800 TRIPLE (874753)</p>
                <p className="text-sm text-gray-600 mt-2">
                  For urgent security matters, please call our 24/7 security hotline.
                </p>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>
    </div>);
}
