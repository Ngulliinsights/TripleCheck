import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Bot, 
  Users, 
  FileCheck, 
  AlertTriangle, 
  TrendingUp,
  Search,
  BarChart3,
  MessageSquare,
  Star,
  Zap,
  CheckCircle,
  Lock,
  Globe,
  Smartphone
} from "lucide-react";

export default function FeaturesPage() {
  const features = [
    {
      category: "AI-Powered Verification",
      icon: <Bot className="w-8 h-8 text-[#2C5282]" />,
      items: [
        {
          title: "Document Authentication",
          description: "Advanced AI algorithms verify property documents for authenticity",
          icon: <FileCheck className="w-5 h-5 text-green-500" />
        },
        {
          title: "Fraud Detection",
          description: "Real-time analysis to identify suspicious property listings",
          icon: <AlertTriangle className="w-5 h-5 text-orange-500" />
        },
        {
          title: "Risk Assessment",
          description: "Comprehensive risk scoring for informed decision-making",
          icon: <BarChart3 className="w-5 h-5 text-blue-500" />
        }
      ]
    },
    {
      category: "Trust & Community",
      icon: <Users className="w-8 h-8 text-[#38A169]" />,
      items: [
        {
          title: "Trust Score System",
          description: "Dynamic scoring based on verification history and user behavior",
          icon: <Star className="w-5 h-5 text-yellow-500" />
        },
        {
          title: "Community Reviews",
          description: "Verified user reviews and ratings for properties and agents",
          icon: <MessageSquare className="w-5 h-5 text-purple-500" />
        },
        {
          title: "Karma Points",
          description: "Reward system for contributing to platform trust and accuracy",
          icon: <TrendingUp className="w-5 h-5 text-green-500" />
        }
      ]
    },
    {
      category: "Market Intelligence",
      icon: <Search className="w-8 h-8 text-[#DD6B20]" />,
      items: [
        {
          title: "Property Comparison",
          description: "Side-by-side analysis of property features and pricing",
          icon: <BarChart3 className="w-5 h-5 text-blue-500" />
        },
        {
          title: "Real-Time Alerts",
          description: "Instant notifications for new listings and price changes",
          icon: <Zap className="w-5 h-5 text-yellow-500" />
        },
        {
          title: "Market Reports",
          description: "Comprehensive analytics and market trend reports",
          icon: <TrendingUp className="w-5 h-5 text-green-500" />
        }
      ]
    },
    {
      category: "Security & Privacy",
      icon: <Shield className="w-8 h-8 text-[#2C5282]" />,
      items: [
        {
          title: "End-to-End Encryption",
          description: "All data and communications are fully encrypted",
          icon: <Lock className="w-5 h-5 text-red-500" />
        },
        {
          title: "Verified Profiles",
          description: "Multi-step verification process for all platform users",
          icon: <CheckCircle className="w-5 h-5 text-green-500" />
        },
        {
          title: "Privacy Controls",
          description: "Granular privacy settings and data protection",
          icon: <Shield className="w-5 h-5 text-blue-500" />
        }
      ]
    }
  ];

  const platformBenefits = [
    {
      title: "For Property Buyers",
      description: "Make confident decisions with verified information",
      benefits: [
        "Access to verified property listings",
        "AI-powered risk assessments",
        "Community reviews and ratings",
        "Real-time market alerts"
      ]
    },
    {
      title: "For Property Sellers",
      description: "Reach trusted buyers and build credibility",
      benefits: [
        "Verified buyer network",
        "Enhanced listing visibility",
        "Reputation building tools",
        "Fast verification process"
      ]
    },
    {
      title: "For Real Estate Agents",
      description: "Professional tools for modern real estate",
      benefits: [
        "Client trust building",
        "Automated verification",
        "Lead quality scoring",
        "Professional badge system"
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Platform Features</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the comprehensive suite of tools and technologies that make TripleCheck 
            the most trusted real estate verification platform in Kenya.
          </p>
        </div>

        {/* Core Features */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Core Features</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="h-fit">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {category.icon}
                    <CardTitle className="text-xl">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.items.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      {feature.icon}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 mb-1">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Platform Benefits */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Who Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {platformBenefits.map((benefit, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{benefit.title}</CardTitle>
                  <CardDescription>{benefit.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {benefit.benefits.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technology Stack */}
        <div className="space-y-8">
          <h2 className="text-3xl font-bold text-center">Technology Excellence</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="text-center">
                <Bot className="w-12 h-12 text-[#2C5282] mx-auto mb-2" />
                <CardTitle className="text-lg">AI & Machine Learning</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Google Generative AI</li>
                  <li>• Document Processing</li>
                  <li>• Pattern Recognition</li>
                  <li>• Fraud Detection</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Globe className="w-12 h-12 text-[#38A169] mx-auto mb-2" />
                <CardTitle className="text-lg">Modern Web Platform</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• React & TypeScript</li>
                  <li>• Real-time Updates</li>
                  <li>• Progressive Web App</li>
                  <li>• Cross-browser Support</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Shield className="w-12 h-12 text-[#DD6B20] mx-auto mb-2" />
                <CardTitle className="text-lg">Enterprise Security</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• End-to-end Encryption</li>
                  <li>• Secure Authentication</li>
                  <li>• Data Protection</li>
                  <li>• Privacy Compliance</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Smartphone className="w-12 h-12 text-[#2C5282] mx-auto mb-2" />
                <CardTitle className="text-lg">Mobile Optimized</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Responsive Design</li>
                  <li>• Touch Optimized</li>
                  <li>• Offline Capability</li>
                  <li>• Fast Performance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center space-y-6 bg-[#2C5282] text-white p-8 rounded-lg">
          <h2 className="text-3xl font-bold">Ready to Experience the Future of Real Estate?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of users who trust TripleCheck for their real estate needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/auth/register" 
              className="bg-white text-[#2C5282] px-8 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </a>
            <a 
              href="/compare" 
              className="border border-white text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              Try Property Comparison
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}