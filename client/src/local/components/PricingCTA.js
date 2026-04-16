"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("./ui/button");
var card_1 = require("./ui/card");
var PRICING_PLANS = [
    {
        id: "starter",
        name: "Starter",
        price: "$29/mo",
        description: "Perfect for individual buyers & small investors",
        features: [
            "Up to 3 verifications / month",
            "10-country fraud detection",
            "24-hour email support",
        ],
        africanFocus: ["Kenya, Nigeria, SA", "Mobile money ready"],
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
        ],
        africanFocus: ["Pan-African coverage", "Multi-currency"],
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
        ],
        africanFocus: ["Government APIs", "Custom compliance"],
        isPopular: false,
        buttonVariant: "outline",
        buttonText: "Contact Sales",
    },
];
var PricingCTA = (0, react_1.memo)(function () {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var handleViewPricing = function () {
        navigate('/pricing');
    };
    return (<section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
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
          {PRICING_PLANS.map(function (plan) { return (<card_1.Card key={plan.id} className={"relative ".concat(plan.isPopular ? 'ring-2 ring-blue-500 shadow-lg' : 'shadow-sm', " hover:shadow-md transition-shadow")}>
              {plan.isPopular && (<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>)}
              
              <card_1.CardHeader className="text-center pb-4">
                <card_1.CardTitle className="text-xl">{plan.name}</card_1.CardTitle>
                <div className="text-3xl font-bold text-gray-900 mb-2">{plan.price}</div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </card_1.CardHeader>
              
              <card_1.CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(function (feature, index) { return (<li key={index} className="flex items-start gap-2 text-sm">
                      <lucide_react_1.CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                      <span>{feature}</span>
                    </li>); })}
                </ul>
                
                {plan.africanFocus && (<div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="text-xs font-medium text-orange-800 mb-1">African Focus:</div>
                    <div className="text-xs text-orange-700">
                      {plan.africanFocus.join(" • ")}
                    </div>
                  </div>)}
                
                <button_1.Button className="w-full" variant={plan.buttonVariant === "coral" ? "default" : "outline"} onClick={handleViewPricing}>
                  {plan.buttonText || "Get Started"}
                </button_1.Button>
              </card_1.CardContent>
            </card_1.Card>); })}
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
              <button_1.Button onClick={handleViewPricing} className="flex items-center gap-2">
                View All Plans
                <lucide_react_1.ArrowRight className="h-4 w-4"/>
              </button_1.Button>
              <button_1.Button variant="outline" onClick={function () { return navigate('/contact'); }}>
                Contact Sales
              </button_1.Button>
            </div>
          </div>
          
          {/* Trust badge */}
          <div className="mt-8">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full border border-green-200">
              <lucide_react_1.CheckCircle className="w-5 h-5 text-green-600"/>
              <span className="text-sm font-medium text-green-700">
                30-day money-back guarantee • Cancel anytime
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>);
});
PricingCTA.displayName = "PricingCTA";
exports.default = PricingCTA;
