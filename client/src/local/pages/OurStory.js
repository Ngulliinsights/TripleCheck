"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = OurStoryPage;
var lucide_react_1 = require("lucide-react");
var badge_1 = require("../components/ui/badge");
var card_1 = require("../components/ui/card");
function OurStoryPage() {
    return (<div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <lucide_react_1.Shield className="w-12 h-12 text-primary"/>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Our Story
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Built for Kenya, trusted by thousands - discover how TripleCheck is revolutionizing real estate verification
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <card_1.Card className="border-border hover:shadow-lg transition-shadow duration-300">
            <card_1.CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <lucide_react_1.Target className="w-6 h-6 text-primary"/>
                </div>
                <card_1.CardTitle className="text-2xl text-foreground">Our Mission</card_1.CardTitle>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To eliminate property fraud in Kenya's real estate market by providing comprehensive verification services 
                that protect buyers, sellers, and investors through cutting-edge technology and community trust networks.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We believe every Kenyan deserves access to verified, trustworthy property information that empowers 
                confident real estate decisions.
              </p>
            </card_1.CardContent>
          </card_1.Card>

          <card_1.Card className="border-border hover:shadow-lg transition-shadow duration-300">
            <card_1.CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <lucide_react_1.TrendingUp className="w-6 h-6 text-secondary"/>
                </div>
                <card_1.CardTitle className="text-2xl text-foreground">Our Vision</card_1.CardTitle>
              </div>
            </card_1.CardHeader>
            <card_1.CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                To become Kenya's most trusted real estate verification platform, setting the standard for property 
                transparency and fraud prevention across East Africa.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                A future where property fraud is eliminated through technology, community trust, and comprehensive verification.
              </p>
            </card_1.CardContent>
          </card_1.Card>
        </div>

        {/* Problem We Solve */}
        <card_1.Card className="mb-16 border-border">
          <card_1.CardHeader>
            <div className="text-center">
              <card_1.CardTitle className="text-3xl text-foreground mb-4">The Problem We Solve</card_1.CardTitle>
              <p className="text-muted-foreground">Understanding the challenges in Kenya&apos;s real estate market</p>
            </div>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-destructive/5 border border-destructive/20 p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <lucide_react_1.Shield className="w-5 h-5 text-destructive"/>
                  </div>
                  <h3 className="font-semibold text-destructive">Property Fraud</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Fake listings, forged documents, and fraudulent sellers cost Kenyans millions annually
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <lucide_react_1.Users className="w-5 h-5 text-orange-600"/>
                  </div>
                  <h3 className="font-semibold text-orange-800">Information Gap</h3>
                </div>
                <p className="text-orange-700 text-sm leading-relaxed">
                  Lack of accessible property verification tools leaves buyers vulnerable
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <lucide_react_1.Target className="w-5 h-5 text-yellow-600"/>
                  </div>
                  <h3 className="font-semibold text-yellow-800">Trust Deficit</h3>
                </div>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  No reliable way to verify seller credibility and property authenticity
                </p>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        {/* Our Journey */}
        <card_1.Card className="border-border">
          <card_1.CardHeader>
            <div className="text-center">
              <card_1.CardTitle className="text-3xl text-foreground mb-4">Our Journey</card_1.CardTitle>
              <p className="text-muted-foreground">Milestones in building Kenya&apos;s most trusted property platform</p>
            </div>
          </card_1.CardHeader>
          <card_1.CardContent>
            <div className="space-y-8">
              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0">
                  <badge_1.Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">2023</badge_1.Badge>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-border pl-6 group-last:border-l-0">
                  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-foreground mb-2 text-lg">Foundation</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      TripleCheck was founded to address the growing property fraud crisis in Kenya, bringing together experts in real estate, technology, and security.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0">
                  <badge_1.Badge className="bg-secondary text-secondary-foreground px-4 py-2 text-sm font-medium">2024</badge_1.Badge>
                </div>
                <div className="flex-1 pb-8 border-l-2 border-border pl-6 group-last:border-l-0">
                  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-foreground mb-2 text-lg">Platform Launch</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Launched comprehensive property verification services with AI-powered fraud detection, document authentication, and community intelligence networks.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-start space-x-6 group">
                <div className="flex-shrink-0">
                  <badge_1.Badge className="bg-accent text-accent-foreground px-4 py-2 text-sm font-medium">Today</badge_1.Badge>
                </div>
                <div className="flex-1">
                  <div className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-foreground mb-2 text-lg">Growing Trust Network</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Building Kenya's largest community-driven property trust network, with thousands of verified properties and growing partnerships across the real estate ecosystem.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>
    </div>);
}
