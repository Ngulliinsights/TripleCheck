import { Shield, CheckCircle, TrendingUp, Users, Clock, Star, Briefcase, Award, Target, Zap } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'


export default function RealEstateAgents() {
  const navigate = useNavigate();

  const agentChallenges = [
    {
      icon: <Clock className="w-6 h-6 text-red-500" />,
      title: "Time-Consuming Verification",
      description: "Agents spend 40% of their time on document verification and due diligence",
      impact: "Reduces client capacity by 60%"
    },
    {
      icon: <Users className="w-6 h-6 text-orange-500" />,
      title: "Client Trust Issues",
      description: "Buyers and sellers question agent credibility due to market fraud",
      impact: "30% higher client acquisition costs"
    },
    {
      icon: <Target className="w-6 h-6 text-yellow-500" />,
      title: "Deal Closure Challenges",
      description: "Unverified properties face lengthy negotiations and frequent deal failures",
      impact: "Only 40% of deals successfully close"
    },
    {
      icon: <Briefcase className="w-6 h-6 text-blue-500" />,
      title: "Professional Liability",
      description: "Agents face legal risks from fraudulent transactions they facilitate",
      impact: "Average lawsuit costs KES 2M+"
    }
  ];

  const agentSolutions = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Agent Verification Tools",
      description: "Professional-grade verification suite for real estate professionals",
      benefit: "Verify properties 10x faster than manual methods",
      features: [
        "Bulk property verification dashboard",
        "Client verification reports",
        "Professional certification badges",
        "Legal liability protection"
      ]
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Business Growth Platform",
      description: "Expand your business with verified listings and premium tools",
      benefit: "Increase deal closure rate to 85%",
      features: [
        "Premium agent profile",
        "Verified property showcase",
        "Lead generation tools",
        "Performance analytics dashboard"
      ]
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Client Confidence System",
      description: "Build trust with clients through transparent verification processes",
      benefit: "Reduce client acquisition costs by 50%",
      features: [
        "Client portal access",
        "Real-time verification updates",
        "Professional verification certificates",
        "Expert network referrals"
      ]
    }
  ];

  const agentBenefits = [
    {
      metric: "10x",
      label: "Faster Verification",
      description: "Complete property verification in hours, not weeks"
    },
    {
      metric: "85%",
      label: "Deal Closure Rate",
      description: "Industry-leading success rate for verified properties"
    },
    {
      metric: "3x",
      label: "More Clients",
      description: "Handle triple the client load with automated verification"
    },
    {
      metric: "50%",
      label: "Higher Commissions",
      description: "Premium verified properties command higher fees"
    }
  ];

  const agentFeatures = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      title: "Instant Verification",
      description: "Get property verification results in under 2 hours",
      pricing: "From KES 2,500 per property"
    },
    {
      icon: <Award className="w-6 h-6 text-purple-500" />,
      title: "Professional Certification",
      description: "Become a TripleCheck Certified Agent with exclusive benefits",
      pricing: "KES 15,000 annual certification"
    },
    {
      icon: <Users className="w-6 h-6 text-blue-500" />,
      title: "Client Management Suite",
      description: "Manage all client verifications from one dashboard",
      pricing: "Included in Pro plan"
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      title: "Market Intelligence",
      description: "Access exclusive market data and pricing insights",
      pricing: "Premium feature"
    }
  ];

  const successStories = [
    {
      name: "Catherine M.",
      title: "Senior Real Estate Agent",
      company: "Prime Properties Kenya",
      story: "TripleCheck transformed my practice. I now handle 3x more clients and my deal closure rate went from 45% to 90%.",
      result: "300% increase in monthly commissions"
    },
    {
      name: "Robert K.",
      title: "Property Consultant",
      company: "Nairobi Homes Ltd",
      story: "The verification certificates give my clients complete confidence. No more lengthy negotiations or deal failures.",
      result: "90% deal closure rate achieved"
    },
    {
      name: "Susan W.",
      title: "Real Estate Broker",
      company: "Coast Properties",
      story: "Being a certified TripleCheck agent sets me apart. Clients specifically seek me out for verified transactions.",
      result: "50% more client referrals"
    }
  ];

  const pricingPlans = [
    {
      name: "Professional",
      price: "KES 9,999/month",
      description: "Perfect for individual agents",
      features: [
        "Up to 20 verifications/month",
        "Basic client management",
        "Standard verification reports",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Agency Pro",
      price: "KES 24,999/month",
      description: "Ideal for small agencies",
      features: [
        "Up to 100 verifications/month",
        "Advanced client portal",
        "Premium verification certificates",
        "Priority support",
        "Team collaboration tools"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom Pricing",
      description: "For large brokerages",
      features: [
        "Unlimited verifications",
        "White-label solutions",
        "API access",
        "Dedicated account manager",
        "Custom integrations"
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full border border-blue-200 mb-6">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">For Real Estate Agents</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Scale Your Real Estate Business with Verified Properties
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Handle 3x more clients, achieve 85% deal closure rates, and build unshakeable client trust 
              with professional-grade property verification tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/mvp-demo")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Shield className="w-5 h-5 mr-2" />
                Try Agent Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
              >
                View Agent Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              The Challenges Real Estate Agents Face Today
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Market fraud and verification complexity are limiting agent productivity and profitability.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentChallenges.map((challenge, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {challenge.icon}
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{challenge.description}</p>
                  <p className="text-sm font-medium text-blue-600">{challenge.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Professional Tools for Modern Real Estate Agents
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to verify properties faster, close more deals, and build client trust.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {agentSolutions.map((solution, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    {solution.icon}
                    <CardTitle className="text-xl">{solution.title}</CardTitle>
                  </div>
                  <p className="text-muted-foreground">{solution.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200 mt-3">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{solution.benefit}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-blue-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Metrics */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              The Professional Agent Advantage
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real performance metrics from TripleCheck certified agents.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {agentBenefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-blue-600">{benefit.metric}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.label}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Professional Features Built for Agents
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agentFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                  <p className="text-sm font-medium text-blue-600">{feature.pricing}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Certified Agents, Proven Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how real estate professionals are transforming their businesses with TripleCheck.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Award className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{story.name}</h4>
                      <p className="text-sm text-muted-foreground">{story.title}</p>
                      <p className="text-xs text-blue-600 font-medium">{story.company}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{story.story}"</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-200">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">{story.result}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Professional Plans for Every Agent
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that fits your business size and verification needs.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-3xl font-bold text-blue-600 mt-2">{plan.price}</div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate("/contact")}
                  >
                    {plan.name === 'Enterprise' ? 'Contact Sales' : 'Start Free Trial'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Transform Your Real Estate Business?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join the growing network of certified agents who are closing more deals and earning higher commissions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/mvp-demo")}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Shield className="w-5 h-5 mr-2" />
                Try Agent Dashboard
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/contact")}
                className="border-white text-white hover:bg-white/10"
              >
                Schedule Demo Call
              </Button>
            </div>
            <p className="text-sm mt-4 opacity-80">
              14-day free trial • No setup fees • Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}