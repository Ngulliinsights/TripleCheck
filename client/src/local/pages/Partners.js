"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PartnersPage;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
function PartnersPage() {
    // Memoize static data to prevent unnecessary re-renders
    var partnerCategories = (0, react_1.useMemo)(function () { return [
        {
            title: "Technology Partners",
            icon: <lucide_react_1.Zap className="h-6 w-6"/>,
            color: "text-blue-600",
            partners: [
                { name: "Google Cloud", role: "AI/ML Infrastructure", logo: "🔵" },
                { name: "Blockchain Kenya", role: "Document Security", logo: "⛓️" },
                { name: "M-Pesa API", role: "Payment Integration", logo: "💳" }
            ]
        },
        {
            title: "Real Estate Partners",
            icon: <lucide_react_1.Building2 className="h-6 w-6"/>,
            color: "text-green-600",
            partners: [
                { name: "Kenya Association of Real Estate Agents", role: "Industry Standards", logo: "🏢" },
                { name: "Nairobi Property Exchange", role: "Market Data", logo: "📊" },
                { name: "Land Registry Kenya", role: "Official Records", logo: "📋" }
            ]
        },
        {
            title: "Security Partners",
            icon: <lucide_react_1.Shield className="h-6 w-6"/>,
            color: "text-red-600",
            partners: [
                { name: "CyberSecurity Kenya", role: "Platform Security", logo: "🔒" },
                { name: "ID Verification Services", role: "Identity Checks", logo: "🆔" },
                { name: "Legal Advisory Group", role: "Compliance", logo: "⚖️" }
            ]
        },
        {
            title: "Community Partners",
            icon: <lucide_react_1.Users className="h-6 w-6"/>,
            color: "text-purple-600",
            partners: [
                { name: "Property Buyers Association", role: "Consumer Protection", logo: "🏠" },
                { name: "Landlords Association", role: "Property Management", logo: "🔑" },
                { name: "Real Estate Developers", role: "New Projects", logo: "🏗️" }
            ]
        }
    ]; }, []);
    // Memoize benefit items for better performance
    var benefitItems = (0, react_1.useMemo)(function () { return [
        {
            icon: <lucide_react_1.Shield className="h-8 w-8 text-primary"/>,
            title: "Enhanced Security",
            description: "Multi-layered verification through trusted partner networks"
        },
        {
            icon: <lucide_react_1.Building2 className="h-8 w-8 text-primary"/>,
            title: "Wider Coverage",
            description: "Access to comprehensive property data across Kenya"
        },
        {
            icon: <lucide_react_1.Users className="h-8 w-8 text-primary"/>,
            title: "Community Trust",
            description: "Building confidence through established industry relationships"
        }
    ]; }, []);
    // Memoize partnership types for consistency
    var partnershipTypes = (0, react_1.useMemo)(function () { return [
        {
            title: "For Technology Companies",
            description: "Integrate your solutions with our verification platform",
            icon: <lucide_react_1.Zap className="h-6 w-6"/>
        },
        {
            title: "For Real Estate Professionals",
            description: "Enhance your credibility with verified listings",
            icon: <lucide_react_1.Building2 className="h-6 w-6"/>
        }
    ]; }, []);
    // Extract reusable components for better maintainability
    var PartnerCard = function (_a) {
        var partner = _a.partner;
        return (<div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors border border-border">
      <span className="text-2xl" role="img" aria-label={"".concat(partner.name, " logo")}>
        {partner.logo}
      </span>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{partner.name}</h3>
        <p className="text-sm text-muted-foreground">{partner.role}</p>
      </div>
    </div>);
    };
    var BenefitCard = function (_a) {
        var benefit = _a.benefit;
        return (<div className="text-center">
      <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-105">
        {benefit.icon}
      </div>
      <h3 className="font-semibold mb-2 text-foreground">{benefit.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
    </div>);
    };
    var PartnershipTypeCard = function (_a) {
        var type = _a.type;
        return (<div className="p-6 bg-card border border-border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          {type.icon}
        </div>
        <h3 className="font-semibold text-foreground">{type.title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{type.description}</p>
    </div>);
    };
    return (<div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <lucide_react_1.Handshake className="w-12 h-12 text-primary"/>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our Partners
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Working together with industry leaders to build Kenya's most comprehensive property verification ecosystem
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">

        {/* Partner categories grid with improved accessibility */}
        <section className="mb-16" aria-labelledby="partner-categories">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Partner Network</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Collaborating with trusted organizations across technology, real estate, security, and community sectors
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {partnerCategories.map(function (category, index) { return (<card_1.Card key={category.title} className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border">
                <card_1.CardHeader>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={"p-2 bg-primary/10 rounded-lg ".concat(category.color)} aria-hidden="true">
                      {category.icon}
                    </div>
                    <card_1.CardTitle className="text-xl text-foreground">{category.title}</card_1.CardTitle>
                  </div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="space-y-3">
                    {category.partners.map(function (partner) { return (<PartnerCard key={partner.name} partner={partner}/>); })}
                  </div>
                </card_1.CardContent>
              </card_1.Card>); })}
          </div>
        </section>

        {/* Benefits section with improved structure */}
        <section className="mb-16" aria-labelledby="partnership-benefits">
          <card_1.Card className="border-border">
            <card_1.CardHeader>
              <div className="text-center">
                <card_1.CardTitle id="partnership-benefits" className="text-3xl text-foreground mb-4">
                  Partnership Benefits
                </card_1.CardTitle>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Discover the advantages of joining our trusted partner ecosystem
                </p>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {benefitItems.map(function (benefit) { return (<BenefitCard key={benefit.title} benefit={benefit}/>); })}
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </section>

        {/* Partnership invitation section */}
        <section aria-labelledby="become-partner">
          <card_1.Card className="border-border">
            <card_1.CardHeader>
              <div className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <lucide_react_1.ArrowRight className="w-8 h-8 text-secondary"/>
                  </div>
                </div>
                <card_1.CardTitle id="become-partner" className="text-3xl text-foreground mb-4">
                  Become a Partner
                </card_1.CardTitle>
                <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Join our growing network of partners committed to transforming Kenya's real estate landscape.
                </p>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {partnershipTypes.map(function (type) { return (<PartnershipTypeCard key={type.title} type={type}/>); })}
                </div>
                
                <div className="text-center p-6 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-muted-foreground mb-4">
                    Ready to partner with Kenya's leading property verification platform?
                  </p>
                  <button_1.Button asChild>
                    <a href="mailto:partnerships@triplecheck.co.ke">
                      <lucide_react_1.Mail className="w-4 h-4 mr-2"/>
                      Contact Partnerships Team
                    </a>
                  </button_1.Button>
                  <p className="text-sm text-muted-foreground mt-3">
                    partnerships@triplecheck.co.ke
                  </p>
                </div>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </section>
      </div>
    </div>);
}
