"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Demo;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var react_router_dom_1 = require("react-router-dom");
var badge_1 = require("../components/ui/badge");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
var VideoModal_1 = require("../components/VideoModal");
var DEMO_VIDEO_URL = "https://youtu.be/IjhSHyfQpaQ";
function Demo() {
    var navigate = (0, react_router_dom_1.useNavigate)();
    var _a = (0, react_1.useState)(false), isVideoModalOpen = _a[0], setIsVideoModalOpen = _a[1];
    var _b = (0, react_1.useState)(null), activeDemo = _b[0], setActiveDemo = _b[1];
    var demoFeatures = [
        {
            id: 'land-verification',
            title: 'Land Verification System',
            description: 'See how our comprehensive verification process works for Kenyan properties',
            icon: <lucide_react_1.Shield className="w-8 h-8"/>,
            color: 'bg-green-500',
            route: '/land-verification',
            highlights: [
                'Government registry validation',
                'Expert coordination',
                'Community intelligence',
                'Risk assessment'
            ]
        },
        {
            id: 'fraud-detection',
            title: 'Fraud Detection Engine',
            description: 'Experience our AI-powered fraud detection in action',
            icon: <lucide_react_1.TrendingUp className="w-8 h-8"/>,
            color: 'bg-red-500',
            route: '/trust/fraud-detection',
            highlights: [
                'Pattern recognition',
                'Real-time alerts',
                'Case management',
                'ML algorithms'
            ]
        },
        {
            id: 'document-auth',
            title: 'Document Authentication',
            description: 'Watch how we verify document authenticity using advanced techniques',
            icon: <lucide_react_1.FileText className="w-8 h-8"/>,
            color: 'bg-blue-500',
            route: '/trust/document-auth',
            highlights: [
                'Digital forensics',
                'Signature verification',
                'Metadata analysis',
                'Compliance checks'
            ]
        },
        {
            id: 'community-intel',
            title: 'Community Intelligence',
            description: 'Discover how community insights enhance verification accuracy',
            icon: <lucide_react_1.Users className="w-8 h-8"/>,
            color: 'bg-purple-500',
            route: '/community-intelligence',
            highlights: [
                'Local knowledge',
                'Community reports',
                'Historical data',
                'Reputation system'
            ]
        }
    ];
    var handleFeatureDemo = function (route) {
        navigate(route);
    };
    var handleInteractiveDemo = function (demoId) {
        setActiveDemo(demoId);
        // Navigate to the full MVP demo with the specific section
        navigate("/mvp-demo?section=".concat(demoId));
    };
    return (<div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <lucide_react_1.Play className="w-12 h-12 text-primary"/>
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              See TripleCheck in Action
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              Experience Africa's most comprehensive property verification platform through our interactive demos and video walkthrough.
            </p>
            
            {/* Video CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <button_1.Button size="lg" onClick={function () { return setIsVideoModalOpen(true); }} className="px-8 py-4 text-lg">
                <lucide_react_1.Play className="w-5 h-5 mr-2"/>
                Watch Demo Video
              </button_1.Button>
              <button_1.Button size="lg" variant="outline" onClick={function () { return navigate('/mvp-demo'); }} className="px-8 py-4 text-lg">
                Try Interactive Demo
                <lucide_react_1.ArrowRight className="w-5 h-5 ml-2"/>
              </button_1.Button>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <badge_1.Badge variant="outline">
                <lucide_react_1.Shield className="w-3 h-3 mr-1"/>
                No Signup Required
              </badge_1.Badge>
              <badge_1.Badge variant="outline">
                <lucide_react_1.CheckCircle className="w-3 h-3 mr-1"/>
                Real Data Examples
              </badge_1.Badge>
              <badge_1.Badge variant="outline">
                <lucide_react_1.Play className="w-3 h-3 mr-1"/>
                5-Minute Overview
              </badge_1.Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Demos */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Explore Key Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Dive deep into each component of our verification system with hands-on demonstrations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {demoFeatures.map(function (feature) { return (<card_1.Card key={feature.id} className="hover:shadow-lg transition-all duration-300 group">
              <card_1.CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className={"p-3 rounded-full ".concat(feature.color, " text-white group-hover:scale-110 transition-transform duration-300")}>
                    {feature.icon}
                  </div>
                  <div>
                    <card_1.CardTitle className="text-xl">{feature.title}</card_1.CardTitle>
                  </div>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </card_1.CardHeader>
              <card_1.CardContent>
                <div className="space-y-2 mb-6">
                  {feature.highlights.map(function (highlight, index) { return (<div key={index} className="flex items-center gap-2">
                      <lucide_react_1.CheckCircle className="w-4 h-4 text-green-500"/>
                      <span className="text-sm text-muted-foreground">{highlight}</span>
                    </div>); })}
                </div>
                
                <div className="flex gap-2">
                  <button_1.Button onClick={function () { return handleFeatureDemo(feature.route); }} className="flex-1">
                    Try Live Demo
                    <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
                  </button_1.Button>
                  <button_1.Button variant="outline" onClick={function () { return handleInteractiveDemo(feature.id); }}>
                    <lucide_react_1.Play className="w-4 h-4"/>
                  </button_1.Button>
                </div>
              </card_1.CardContent>
            </card_1.Card>); })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <card_1.Card className="max-w-2xl mx-auto">
            <card_1.CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
              <p className="text-muted-foreground mb-6">
                Experience the full power of TripleCheck with our comprehensive platform demo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button_1.Button size="lg" onClick={function () { return navigate('/land-verification'); }}>
                  Start Verification
                  <lucide_react_1.Shield className="w-4 h-4 ml-2"/>
                </button_1.Button>
                <button_1.Button size="lg" variant="outline" onClick={function () { return navigate('/contact'); }}>
                  Schedule Consultation
                </button_1.Button>
              </div>
            </card_1.CardContent>
          </card_1.Card>
        </div>
      </div>

      {/* Video Modal */}
      <VideoModal_1.VideoModal isOpen={isVideoModalOpen} onClose={function () { return setIsVideoModalOpen(false); }} videoUrl={DEMO_VIDEO_URL} title="TripleCheck Platform Demo"/>
    </div>);
}
