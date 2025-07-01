import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Star, Zap, Crown, Shield } from "lucide-react";

export default function PricingPage() {
  const plans = [
    {
      name: "Basic",
      price: "Free",
      period: "Forever",
      description: "Perfect for occasional property searches",
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      features: [
        "5 property verifications per month",
        "Basic trust score viewing",
        "Community reviews access",
        "Standard search filters",
        "Mobile app access",
        "Email support"
      ],
      buttonText: "Get Started",
      buttonVariant: "outline" as const,
      popular: false
    },
    {
      name: "Professional",
      price: "KES 2,500",
      period: "per month",
      description: "Ideal for active buyers and real estate professionals",
      icon: <Star className="w-6 h-6 text-yellow-500" />,
      features: [
        "Unlimited property verifications",
        "Advanced AI fraud detection",
        "Priority verification processing",
        "Detailed market reports",
        "Property comparison tools",
        "Real-time alerts",
        "Phone & chat support",
        "API access",
        "Custom search filters"
      ],
      buttonText: "Start Professional",
      buttonVariant: "default" as const,
      popular: true
    },
    {
      name: "Enterprise",
      price: "KES 15,000",
      period: "per month",
      description: "Comprehensive solution for agencies and institutions",
      icon: <Crown className="w-6 h-6 text-purple-500" />,
      features: [
        "Everything in Professional",
        "White-label platform option",
        "Bulk verification processing",
        "Custom integration support",
        "Dedicated account manager",
        "Advanced analytics dashboard",
        "Team management tools",
        "SLA guarantees",
        "Custom reporting",
        "24/7 priority support"
      ],
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const,
      popular: false
    }
  ];

  const addOns = [
    {
      name: "Bulk Verification Package",
      price: "KES 500",
      description: "Additional 50 property verifications",
      icon: <Zap className="w-5 h-5 text-orange-500" />
    },
    {
      name: "Premium Support",
      price: "KES 1,000",
      description: "Priority phone and chat support",
      icon: <Shield className="w-5 h-5 text-blue-500" />
    },
    {
      name: "Advanced Analytics",
      price: "KES 1,500",
      description: "Detailed market insights and trends",
      icon: <Star className="w-5 h-5 text-yellow-500" />
    }
  ];

  const faq = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the billing accordingly."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, bank transfers, Visa, Mastercard, and other major credit cards. All payments are processed securely."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, we offer a 14-day free trial for both Professional and Enterprise plans. No credit card required to start."
    },
    {
      question: "What happens if I exceed my verification limit?",
      answer: "You'll receive notifications when approaching your limit. You can either upgrade your plan or purchase additional verification packages."
    },
    {
      question: "Do you offer discounts for annual payments?",
      answer: "Yes, we offer 20% discount for annual payments on Professional and Enterprise plans."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the perfect plan for your real estate verification needs. 
            All plans include our core AI-powered verification technology.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.popular ? 'border-[#2C5282] border-2' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-[#2C5282] text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {plan.icon}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                <div className="space-y-2">
                  <div className="text-3xl font-bold">
                    {plan.price}
                    {plan.period !== "Forever" && (
                      <span className="text-lg font-normal text-muted-foreground">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className="w-full" 
                  variant={plan.buttonVariant}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Add-ons & Extras</h2>
            <p className="text-muted-foreground">
              Enhance your plan with additional features and services
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {addon.icon}
                    <CardTitle className="text-lg">{addon.name}</CardTitle>
                  </div>
                  <div className="text-2xl font-bold text-[#2C5282]">{addon.price}</div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{addon.description}</p>
                  <Button variant="outline" className="w-full">
                    Add to Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faq.map((item, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enterprise Contact */}
        <div className="text-center space-y-6 bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold">Need a Custom Solution?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            For large organizations, government agencies, or unique requirements, 
            we offer custom pricing and tailored solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg">
              Contact Enterprise Sales
            </Button>
            <Button variant="outline" size="lg">
              Schedule a Demo
            </Button>
          </div>
        </div>

        {/* Money Back Guarantee */}
        <div className="text-center space-y-4 bg-green-50 p-6 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <h3 className="text-xl font-semibold">30-Day Money-Back Guarantee</h3>
          </div>
          <p className="text-muted-foreground">
            Try TripleCheck risk-free. If you're not completely satisfied within 30 days, 
            we'll refund your payment in full, no questions asked.
          </p>
        </div>
      </div>
    </div>
  );
}