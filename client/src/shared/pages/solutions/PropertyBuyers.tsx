import { Shield, CheckCircle, AlertTriangle, TrendingUp, Users, FileText, Clock, DollarSign } from 'lucide-react'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'


export default function PropertyBuyers() {
  const navigate = useNavigate();

  const buyerChallenges = [
    {
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      title: "Fraud Risk",
      description: "30% of property transactions in Kenya involve some form of fraud",
      impact: "Average loss: KES 2.5M per victim"
    },
    {
      icon: <Clock className="w-6 h-6 text-orange-500" />,
      title: "Lengthy Verification",
      description: "Traditional verification takes 3-6 months",
      impact: "Delays cost opportunities and increase stress"
    },
    {
      icon: <FileText className="w-6 h-6 text-yellow-500" />,
      title: "Document Complexity",
      description: "Multiple documents from different sources to verify",
      impact: "Easy to miss critical red flags"
    },
    {
      icon: <DollarSign className="w-6 h-6 text-blue-500" />,
      title: "Hidden Costs",
      description: "Unexpected legal fees, survey costs, and processing charges",
      impact: "Budget overruns of 15-25% are common"
    }
  ];

  const tripleCheckSolutions = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Instant Fraud Detection",
      description: "AI-powered analysis identifies suspicious patterns in seconds",
      benefit: "Reduce fraud risk by 95%",
      features: [
        "Real-time document authentication",
        "Community intelligence alerts",
        "Expert verification network",
        "Blockchain-secured records"
      ]
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-green-500" />,
      title: "Market Intelligence",
      description: "Get comprehensive property and neighborhood insights",
      benefit: "Make informed decisions with confidence",
      features: [
        "Comparative market analysis",
        "Price trend predictions",
        "Neighborhood safety scores",
        "Future development plans"
      ]
    },
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Community Trust Network",
      description: "Leverage local knowledge and community feedback",
      benefit: "Access insider knowledge from locals",
      features: [
        "Neighbor reviews and ratings",
        "Local area expertise",
        "Community safety reports",
        "Historical transaction data"
      ]
    }
  ];

  const successStories = [
    {
      name: "Sarah M.",
      location: "Nairobi",
      story: "TripleCheck saved me from a KES 3.2M fraud. The AI detected forged documents that looked perfect to me.",
      savings: "KES 3.2M saved"
    },
    {
      name: "David K.",
      location: "Mombasa", 
      story: "Found my dream home in 2 weeks instead of 6 months. The community insights were invaluable.",
      savings: "4 months saved"
    },
    {
      name: "Grace W.",
      location: "Kisumu",
      story: "The market analysis helped me negotiate 15% below asking price with confidence.",
      savings: "KES 450K saved"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">For Property Buyers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Buy Property with Complete Confidence
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Eliminate fraud risk, save months of verification time, and make informed decisions 
              with Africa's most comprehensive property verification platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/mvp-demo")}
                className="bg-primary hover:bg-primary/90"
              >
                <Shield className="w-5 h-5 mr-2" />
                Try Free Verification
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/pricing")}
              >
                View Pricing Plans
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
              The Property Buying Challenges You Face
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Buying property in Kenya is risky and complex. Here's what most buyers struggle with:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {buyerChallenges.map((challenge, index) => (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {challenge.icon}
                    <CardTitle className="text-lg">{challenge.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{challenge.description}</p>
                  <p className="text-sm font-medium text-red-600">{challenge.impact}</p>
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
              How TripleCheck Protects Property Buyers
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive platform addresses every major risk and challenge in property buying.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {tripleCheckSolutions.map((solution, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    {solution.icon}
                    <CardTitle className="text-xl">{solution.title}</CardTitle>
                  </div>
                  <p className="text-muted-foreground">{solution.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200 mt-3">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{solution.benefit}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {solution.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
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

      {/* Success Stories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Real Buyers, Real Results
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how TripleCheck has protected property buyers across Kenya.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map((story, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <Shield className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{story.name}</h4>
                      <p className="text-sm text-muted-foreground">{story.location}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{story.story}"</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">{story.savings}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Ready to Buy Property with Confidence?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of protected buyers who use TripleCheck to make safe, informed property decisions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/mvp-demo")}
                className="bg-primary hover:bg-primary/90"
              >
                <Shield className="w-5 h-5 mr-2" />
                Start Free Verification
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => navigate("/contact")}
              >
                Speak with an Expert
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required • Full verification in 24 hours • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}