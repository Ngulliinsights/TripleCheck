import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Shield, FileText, Star, Users, CheckCircle, Zap } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'Real-Time Fraud Detection',
    description: 'Advanced AI algorithms detect fraudulent listings in real-time, protecting you from scams.',
    benefits: ['99.7% accuracy rate', 'Instant verification', 'Continuous monitoring']
  },
  {
    icon: FileText,
    title: 'Document Authentication',
    description: 'Verify ownership documents, lease agreements, and property certificates.',
    benefits: ['Blockchain verification', 'Legal compliance', 'Tamper-proof records']
  },
  {
    icon: Star,
    title: 'Trust Score System',
    description: 'Rate and review landlords, agents, and properties based on verified experiences.',
    benefits: ['Community-driven ratings', 'Verified reviews only', 'Reputation tracking']
  },
  {
    icon: Users,
    title: 'Community Verification',
    description: 'Leverage community insights and reports to identify trustworthy properties.',
    benefits: ['Crowd-sourced intelligence', 'Real user experiences', 'Social proof']
  },
  {
    icon: CheckCircle,
    title: 'Comprehensive Reports',
    description: 'Get detailed verification reports with actionable insights and recommendations.',
    benefits: ['Detailed analysis', 'Risk assessment', 'Investment guidance']
  },
  {
    icon: Zap,
    title: 'Instant Alerts',
    description: 'Receive immediate notifications about suspicious activities or new verified listings.',
    benefits: ['Real-time notifications', 'Custom alert settings', 'Mobile app support']
  }
];

export default function Features() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Powerful Features for
            <span className="text-blue-600"> Safe Real Estate</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our comprehensive suite of verification tools and community-driven insights 
            help you make informed decisions and avoid fraudulent properties.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <feature.icon className="w-12 h-12 text-blue-600 mb-4" />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}