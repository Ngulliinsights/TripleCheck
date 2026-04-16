"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PropertySellers;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var button_1 = require("../../components/ui/button");
var card_1 = require("../../components/ui/card");
function PropertySellers() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var sellerChallenges = [
        {
            icon: <lucide_react_1.Users className="w-6 h-6 text-red-500"/>,
            title: "Buyer Skepticism",
            description: "Buyers are increasingly cautious due to widespread fraud",
            impact: "60% longer time to sell, 15% lower offers"
        },
        {
            icon: <lucide_react_1.Clock className="w-6 h-6 text-orange-500"/>,
            title: "Lengthy Sales Process",
            description: "Buyers spend months verifying documents and ownership",
            impact: "Average 6-8 months to close deals"
        },
        {
            icon: <lucide_react_1.DollarSign className="w-6 h-6 text-yellow-500"/>,
            title: "Price Negotiations",
            description: "Unverified properties face aggressive price negotiations",
            impact: "10-20% below market value settlements"
        },
        {
            icon: <lucide_react_1.Target className="w-6 h-6 text-blue-500"/>,
            title: "Limited Buyer Pool",
            description: "Many serious buyers avoid unverified properties entirely",
            impact: "50% smaller potential buyer market"
        }
    ];
    var sellerSolutions = [
        {
            icon: <lucide_react_1.Shield className="w-8 h-8 text-primary"/>,
            title: "Pre-Verified Listings",
            description: "Get your property verified before listing to attract serious buyers",
            benefit: "Sell 60% faster with verified badge",
            features: [
                "Complete document authentication",
                "Ownership verification certificate",
                "Property history report",
                "Fraud-free guarantee badge"
            ]
        },
        {
            icon: <lucide_react_1.TrendingUp className="w-8 h-8 text-green-500"/>,
            title: "Premium Market Position",
            description: "Verified properties command higher prices and faster sales",
            benefit: "15% higher selling prices on average",
            features: [
                "Priority listing placement",
                "Verified seller badge",
                "Professional property report",
                "Market analysis insights"
            ]
        },
        {
            icon: <lucide_react_1.Users className="w-8 h-8 text-blue-500"/>,
            title: "Buyer Confidence Tools",
            description: "Provide buyers with everything they need to make quick decisions",
            benefit: "Reduce negotiation time by 70%",
            features: [
                "Transparent verification history",
                "Community trust scores",
                "Expert endorsements",
                "Instant buyer verification"
            ]
        }
    ];
    var sellerBenefits = [
        {
            metric: "60%",
            label: "Faster Sales",
            description: "Verified properties sell significantly faster than unverified ones"
        },
        {
            metric: "15%",
            label: "Higher Prices",
            description: "Command premium prices with verified authenticity"
        },
        {
            metric: "3x",
            label: "More Inquiries",
            description: "Verified listings receive triple the buyer interest"
        },
        {
            metric: "95%",
            label: "Deal Closure Rate",
            description: "Higher success rate from inquiry to completed sale"
        }
    ];
    var successStories = [
        {
            name: "James O.",
            location: "Karen, Nairobi",
            property: "4BR Villa",
            story: "My verified listing attracted 12 serious buyers in the first week. Sold at asking price within 3 weeks.",
            result: "Sold 5 months faster than expected"
        },
        {
            name: "Mary N.",
            location: "Nyali, Mombasa",
            property: "Beachfront Apartment",
            story: "The verification badge gave buyers confidence. No lengthy negotiations or document disputes.",
            result: "KES 800K above initial offers"
        },
        {
            name: "Peter M.",
            location: "Runda, Nairobi",
            property: "Commercial Plot",
            story: "International buyers trusted our verified documentation. Closed deal remotely without issues.",
            result: "Attracted premium international buyers"
        }
    ];
    return (<div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full border border-green-200 mb-6">
              <lucide_react_1.TrendingUp className="w-4 h-4 text-green-600"/>
              <span className="text-sm font-medium text-green-700">For Property Sellers</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Sell Your Property Faster at Premium Prices
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Stand out from the competition with verified listings that attract serious buyers, 
              command higher prices, and close deals 60% faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button_1.Button size="lg" onClick={function () { return navigate("/services/list-property"); }} className="bg-green-600 hover:bg-green-700">
                <lucide_react_1.Shield className="w-5 h-5 mr-2"/>
                List Verified Property
              </button_1.Button>
              <button_1.Button size="lg" variant="outline" onClick={function () { return navigate("/mvp-demo"); }}>
                See Verification Process
              </button_1.Button>
            </div>
          </div>
        </div>
      </section>

      {/* Challenges Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Why Selling Property is Getting Harder
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Today's buyers are more cautious than ever. Here's what's making it difficult to sell:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sellerChallenges.map(function (challenge, index) { return (<card_1.Card key={index} className="border-l-4 border-l-orange-500">
                <card_1.CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    {challenge.icon}
                    <card_1.CardTitle className="text-lg">{challenge.title}</card_1.CardTitle>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <p className="text-muted-foreground mb-3">{challenge.description}</p>
                  <p className="text-sm font-medium text-orange-600">{challenge.impact}</p>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              How TripleCheck Helps You Sell Faster
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform your property into a premium, verified listing that buyers trust and pay more for.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {sellerSolutions.map(function (solution, index) { return (<card_1.Card key={index} className="relative overflow-hidden">
                <card_1.CardHeader>
                  <div className="flex items-center gap-3 mb-4">
                    {solution.icon}
                    <card_1.CardTitle className="text-xl">{solution.title}</card_1.CardTitle>
                  </div>
                  <p className="text-muted-foreground">{solution.description}</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200 mt-3">
                    <lucide_react_1.CheckCircle className="w-4 h-4 text-green-600"/>
                    <span className="text-sm font-medium text-green-700">{solution.benefit}</span>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2">
                    {solution.features.map(function (feature, featureIndex) { return (<li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>
                        <span>{feature}</span>
                      </li>); })}
                  </ul>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </div>
      </section>

      {/* Benefits Metrics */}
      <section className="py-20 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              The Verified Seller Advantage
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Real data from verified property sales across Kenya.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {sellerBenefits.map(function (benefit, index) { return (<div key={index} className="text-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <span className="text-2xl font-bold text-green-600">{benefit.metric}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{benefit.label}</h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>); })}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Verified Sellers, Proven Results
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how property owners across Kenya are selling faster and earning more with verification.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {successStories.map(function (story, index) { return (<card_1.Card key={index} className="bg-white">
                <card_1.CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <lucide_react_1.Star className="w-6 h-6 text-green-600"/>
                    </div>
                    <div>
                      <h4 className="font-semibold">{story.name}</h4>
                      <p className="text-sm text-muted-foreground">{story.location}</p>
                      <p className="text-xs text-blue-600 font-medium">{story.property}</p>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{story.story}"</p>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                    <lucide_react_1.TrendingUp className="w-4 h-4 text-green-600"/>
                    <span className="text-sm font-medium text-green-700">{story.result}</span>
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Ready to Sell Your Property Faster?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Join successful sellers who use TripleCheck to command premium prices and close deals quickly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button_1.Button size="lg" onClick={function () { return navigate("/services/list-property"); }} className="bg-white text-green-600 hover:bg-gray-100">
                <lucide_react_1.Shield className="w-5 h-5 mr-2"/>
                List Your Property Now
              </button_1.Button>
              <button_1.Button size="lg" variant="outline" onClick={function () { return navigate("/contact"); }} className="border-white text-white hover:bg-white/10">
                Get Selling Strategy
              </button_1.Button>
            </div>
            <p className="text-sm mt-4 opacity-80">
              Free property evaluation • Verified listing in 24 hours • No upfront costs
            </p>
          </div>
        </div>
      </section>
    </div>);
}
