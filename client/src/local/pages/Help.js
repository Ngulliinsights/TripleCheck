"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Help;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../components/ui/button");
var input_1 = require("../components/ui/input");
var navigation_1 = require("../utils/navigation");
function Help() {
    var trackNavigation = (0, navigation_1.useNavigationTracking)().trackNavigation;
    var _a = (0, react_1.useState)(''), searchQuery = _a[0], setSearchQuery = _a[1];
    var _b = (0, react_1.useState)(null), expandedFAQ = _b[0], setExpandedFAQ = _b[1];
    var handleContactClick = function (method) {
        trackNavigation('/help', '/contact', "contact_".concat(method));
        window.location.href = '/contact';
    };
    var handleGuideClick = function (guide) {
        trackNavigation('/help', "/help/".concat(guide), 'guide_access');
        window.location.href = "/help/".concat(guide);
    };
    var quickActions = [
        {
            title: 'Start Property Verification',
            description: 'Begin verifying a property in minutes',
            icon: lucide_react_1.Shield,
            action: function () {
                trackNavigation('/help', '/services/basic-checks', 'quick_verification');
                window.location.href = '/services/basic-checks';
            }
        },
        {
            title: 'View Sample Report',
            description: 'See what a verification report looks like',
            icon: lucide_react_1.FileText,
            action: function () {
                trackNavigation('/help', '/services/reports', 'sample_report');
                window.location.href = '/services/reports';
            }
        },
        {
            title: 'Contact Support',
            description: 'Get help from our expert team',
            icon: lucide_react_1.MessageCircle,
            action: function () { return handleContactClick('support'); }
        },
        {
            title: 'Join Community',
            description: 'Connect with other users and experts',
            icon: lucide_react_1.Users,
            action: function () {
                trackNavigation('/help', '/community', 'community_join');
                // In a real app, this would go to a community page
                window.alert('Community feature coming soon!');
            }
        }
    ];
    var helpCategories = [
        {
            title: 'Getting Started',
            description: 'Learn the basics of property verification',
            icon: lucide_react_1.BookOpen,
            articles: [
                'How to create your account',
                'Understanding verification types',
                'Your first property check',
                'Reading verification reports'
            ],
            link: '/help/getting-started'
        },
        {
            title: 'Verification Process',
            description: 'Detailed guides on our verification services',
            icon: lucide_react_1.Shield,
            articles: [
                'Property ownership verification',
                'Document authentication process',
                'Fraud detection explained',
                'Trust score calculation'
            ],
            link: '/help/verification-guide'
        },
        {
            title: 'Account & Billing',
            description: 'Manage your account and understand pricing',
            icon: lucide_react_1.FileText,
            articles: [
                'Managing your account',
                'Understanding pricing plans',
                'Payment methods and billing',
                'Refund and cancellation policy'
            ],
            link: '/help/account-billing'
        },
        {
            title: 'Troubleshooting',
            description: 'Solutions to common issues',
            icon: lucide_react_1.HelpCircle,
            articles: [
                'Verification failed - what to do',
                'Document upload issues',
                'Payment problems',
                'Report generation delays'
            ],
            link: '/help/troubleshooting'
        }
    ];
    var faqs = [
        {
            question: 'How long does property verification take?',
            answer: "Most basic verifications are completed within 24-48 hours. Complex verifications involving multiple documents or legal checks may take 3-5 business days. You'll receive real-time updates throughout the process."
        },
        {
            question: 'What documents do I need for verification?',
            answer: 'The required documents vary by verification type, but typically include: property title/deed, survey plan, certificate of occupancy, and valid ID. Our system will guide you through the specific requirements for your verification type.'
        },
        {
            question: 'Is my personal information secure?',
            answer: "Yes, we use bank-level encryption and security measures to protect your data. We're SOC 2 compliant and ISO 27001 certified. Your information is never shared with third parties without your explicit consent."
        },
        {
            question: 'What if the verification reveals issues with the property?',
            answer: "If we discover issues, you'll receive a detailed report explaining the problems and recommended next steps. We also provide guidance on how to address issues or whether to proceed with the transaction."
        },
        {
            question: "Can I get a refund if I'm not satisfied?",
            answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our verification service, contact our support team for a full refund within 30 days of your purchase."
        },
        {
            question: 'Do you verify properties outside Kenya?',
            answer: 'Currently, we focus on properties within Kenya, with plans to expand to other East African countries. Contact us if you have properties in other regions - we may be able to help through our partner network.'
        }
    ];
    var contactOptions = [
        {
            title: 'Live Chat',
            description: 'Get instant help from our support team',
            icon: lucide_react_1.MessageCircle,
            availability: 'Available 24/7',
            action: function () { return handleContactClick('chat'); }
        },
        {
            title: 'Phone Support',
            description: 'Speak directly with our experts',
            icon: lucide_react_1.Phone,
            availability: 'Mon-Fri, 8AM-6PM EAT',
            action: function () { return handleContactClick('phone'); }
        },
        {
            title: 'Email Support',
            description: 'Send us detailed questions',
            icon: lucide_react_1.Mail,
            availability: 'Response within 4 hours',
            action: function () { return handleContactClick('email'); }
        }
    ];
    return (<div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-brand text-white py-32 overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
        <div className="absolute inset-0 gradient-balanced-primary"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/5 rounded-full blur-xl animate-pulse-glow"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-secondary/10 rounded-full blur-lg animate-pulse-glow animation-delay-300"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Enhanced Icon */}
            <div className="inline-flex items-center justify-center w-24 h-24 glass-base bg-white/10 rounded-3xl mb-8 hover-glow-trust animate-fade-in">
              <lucide_react_1.HelpCircle className="h-12 w-12 text-white drop-shadow-lg"/>
            </div>
            
            <h1 className="text-fluid-3xl md:text-7xl font-bold mb-8 text-enhanced-contrast animate-slide-up">
              How Can We 
              <span className="text-gradient-premium block mt-2">Help You?</span>
            </h1>
            <p className="text-fluid-lg md:text-2xl mb-16 text-enhanced-subtle max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              Find answers, get support, and learn how to make the most of TripleCheck's 
              property verification platform
            </p>
            
            {/* Enhanced Search Bar */}
            <div className="max-w-3xl mx-auto relative mb-16 animate-slide-up animation-delay-200">
              <div className="glass-base bg-white/95 rounded-3xl p-3 shadow-2xl layer-depth-2">
                <div className="relative flex items-center">
                  <lucide_react_1.Search className="absolute left-6 h-6 w-6 text-gray-400"/>
                  <input_1.Input type="search" placeholder="Search for help articles, guides, or FAQs..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="pl-16 pr-40 py-4 text-lg bg-transparent border-0 text-gray-900 placeholder:text-gray-500 focus:ring-0 focus:outline-none rounded-2xl"/>
                  <button_1.Button className="absolute right-2 glass-btn-primary px-8 py-3 rounded-2xl font-semibold hover-glow-warm" onClick={function () {
            if (searchQuery) {
                trackNavigation('/help', "/help/search?q=".concat(searchQuery), 'help_search');
            }
        }}>
                    Search
                    <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
                  </button_1.Button>
                </div>
              </div>
            </div>
            
            {/* Enhanced Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {[
            { value: "500+", label: "Help Articles", icon: lucide_react_1.BookOpen },
            { value: "24/7", label: "Support Available", icon: lucide_react_1.MessageCircle },
            { value: "< 4hrs", label: "Response Time", icon: lucide_react_1.Clock }
        ].map(function (stat, index) {
            var IconComponent = stat.icon;
            return (<div key={index} className="glass-base bg-white/10 rounded-2xl p-6 text-center hover:bg-white/15 transition-all duration-300 enhance-hover-subtle animate-slide-up" style={{ animationDelay: "".concat(300 + index * 100, "ms") }}>
                    <IconComponent className="h-8 w-8 text-white/80 mx-auto mb-3"/>
                    <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-white/70 text-sm font-medium">{stat.label}</div>
                  </div>);
        })}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-24 -mt-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {quickActions.map(function (action, index) {
            var IconComponent = action.icon;
            return (<button key={index} type="button" className="group card p-8 text-center cursor-pointer layer-depth-2 enhance-hover animate-slide-up" onClick={action.action} style={{ animationDelay: "".concat(index * 100, "ms") }}>
                  <div className="flex flex-col items-center">
                    <div className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-3xl mb-8 group-hover:from-primary/20 group-hover:to-secondary/20 transition-all duration-300 hover-glow-trust">
                      <IconComponent className="h-10 w-10 text-primary"/>
                    </div>
                    <h3 className="text-xl font-bold text-high-contrast mb-4">{action.title}</h3>
                    <p className="text-high-contrast-muted leading-relaxed text-lg">{action.description}</p>
                    <div className="mt-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <lucide_react_1.ArrowRight className="h-5 w-5 text-primary mx-auto"/>
                    </div>
                  </div>
                </button>);
        })}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Browse Help Topics
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Find detailed guides and tutorials for every aspect of property verification
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {helpCategories.map(function (category, index) {
            var IconComponent = category.icon;
            return (<div key={index} className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-start mb-6">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mr-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300">
                      <IconComponent className="h-8 w-8 text-primary"/>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{category.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {category.articles.map(function (article, articleIndex) { return (<li key={articleIndex} className="flex items-start text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        <div className="p-1 bg-gray-100 rounded-full mr-3 mt-1 group-hover:bg-primary/10 transition-colors duration-200">
                          <lucide_react_1.ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors duration-200"/>
                        </div>
                        <span className="leading-relaxed">{article}</span>
                      </li>); })}
                  </ul>
                  
                  <button_1.Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary transition-colors duration-300" onClick={function () { return handleGuideClick(category.link.split('/').pop() || ''); }}>
                    View All Articles
                    <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
                  </button_1.Button>
                </div>);
        })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Quick answers to the most common questions about property verification
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {faqs.map(function (faq, index) { return (<div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <button type="button" className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2 transition-all duration-200" onClick={function () { return setExpandedFAQ(expandedFAQ === index ? null : index); }}>
                  <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <div className={"p-2 rounded-full transition-all duration-200 ".concat(expandedFAQ === index ? 'bg-primary/10' : 'bg-gray-100')}>
                    <lucide_react_1.ChevronDown className={"h-5 w-5 transition-all duration-200 ".concat(expandedFAQ === index ? 'rotate-180 text-primary' : 'text-gray-500')}/>
                  </div>
                </button>
                {expandedFAQ === index && (<div className="px-8 pb-6 bg-gradient-to-r from-primary/5 to-primary/2">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 leading-relaxed text-lg">{faq.answer}</p>
                    </div>
                  </div>)}
              </div>); })}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20 bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Still Need Help?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our dedicated support team is here to help you succeed with property verification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {contactOptions.map(function (option, index) {
            var IconComponent = option.icon;
            return (<button key={index} type="button" className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer w-full" onClick={option.action}>
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300">
                    <IconComponent className="h-10 w-10 text-primary"/>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{option.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{option.description}</p>
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-8 bg-gray-50 rounded-full px-4 py-2 group-hover:bg-primary/5 transition-colors duration-300">
                    <lucide_react_1.Clock className="h-4 w-4 mr-2"/>
                    {option.availability}
                  </div>
                  <button_1.Button className="w-full group-hover:shadow-lg transition-shadow duration-300">
                    Get Help Now
                    <lucide_react_1.ArrowRight className="ml-2 h-4 w-4"/>
                  </button_1.Button>
                </button>);
        })}
          </div>
        </div>
      </section>
    </div>);
}
