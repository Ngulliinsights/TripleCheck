import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface PricingPlan {
  readonly id: string;
  readonly name: string;
  readonly price: string;
  readonly description: string;
  readonly features: readonly string[];
  readonly isPopular: boolean;
  readonly buttonVariant: "default" | "outline" | "coral";
  readonly buttonText?: string;
  readonly africanFocus?: readonly string[];
}

const PRICING_PLANS: readonly PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: "$29/mo",
    description: "Perfect for individual buyers & small investors",
    features: [
      "Up to 3 verifications / month",
      "10-country fraud detection",
      "24-hour email support",
    ] as const,
    africanFocus: ["Kenya, Nigeria, SA", "Mobile money ready"] as const,
    isPopular: false,
    buttonVariant: "outline",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$99/mo",
    description: "Built for agents & professionals",
    features: [
      "Up to 25 verifications / month",
      "54-country fraud detection",
      "2-hour priority support",
      "White-label reports",
    ] as const,
    africanFocus: ["Pan-African coverage", "Multi-currency"] as const,
    isPopular: true,
    buttonVariant: "coral",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For large developers & institutions",
    features: [
      "Unlimited verifications",
      "AI insights & API access",
      "Dedicated account manager",
      "24/7 support",
    ] as const,
    africanFocus: ["Government APIs", "Custom compliance"] as const,
    isPopular: false,
    buttonVariant: "outline",
    buttonText: "Contact Sales",
  },
] as const;

const PricingCTA = memo(() => {
  const navigate = useNavigate();

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Transparent Pricing for Every Need
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the perfect plan for your property verification needs across Africa. 
            All plans include our core fraud detection and community insights.
          </p>
        </div>

        {/* Simplified Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {PRICING_PLANS.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.isPopular ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm'} hover:shadow-md transition-shadow`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-gray-900 mb-2">{plan.price}</div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.africanFocus && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-medium text-orange-800 mb-1">African Focus:</div>
                    <div className="text-xs text-orange-700">
                      {plan.africanFocus.join(" • ")}
                    </div>
                  </div>
                )}
                
                <Button 
                  className="w-full" 
                  variant={plan.buttonVariant === "coral" ? "default" : "outline"}
                  onClick={handleViewPricing}
                >
                  {plan.buttonText || "Get Started"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Need a Custom Solution?
            </h3>
            <p className="text-gray-600 mb-6">
              We work with governments, large developers, and financial institutions 
              to create tailored fraud prevention solutions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleViewPricing} className="flex items-center gap-2">
                View All Plans
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={() => navigate('/contact')}>
                Contact Sales
              </Button>
            </div>
          </div>
          
          {/* Trust badge */}
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full border border-green-200">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                30-day money-back guarantee • Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

PricingCTA.displayName = "PricingCTA";

export default PricingCTA;