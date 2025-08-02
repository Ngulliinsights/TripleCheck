import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Phone,
  Mail,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Shield,
  FileText,
  Users,
  Clock
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useNavigationTracking } from '../utils/navigation';

export default function Help() {
  const { trackNavigation } = useNavigationTracking();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const handleContactClick = (method: string) => {
    trackNavigation('/help', '/contact', `contact_${method}`);
    window.location.href = '/contact';
  };

  const handleGuideClick = (guide: string) => {
    trackNavigation('/help', `/help/${guide}`, 'guide_access');
    window.location.href = `/help/${guide}`;
  };

  const quickActions = [
    {
      title: 'Start Property Verification',
      description: 'Begin verifying a property in minutes',
      icon: Shield,
      action: () => {
        trackNavigation('/help', '/services/basic-checks', 'quick_verification');
        window.location.href = '/services/basic-checks';
      }
    },
    {
      title: 'View Sample Report',
      description: 'See what a verification report looks like',
      icon: FileText,
      action: () => {
        trackNavigation('/help', '/services/reports', 'sample_report');
        window.location.href = '/services/reports';
      }
    },
    {
      title: 'Contact Support',
      description: 'Get help from our expert team',
      icon: MessageCircle,
      action: () => handleContactClick('support')
    },
    {
      title: 'Join Community',
      description: 'Connect with other users and experts',
      icon: Users,
      action: () => {
        trackNavigation('/help', '/community', 'community_join');
        // In a real app, this would go to a community page
        window.alert('Community feature coming soon!');
      }
    }
  ];

  const helpCategories = [
    {
      title: 'Getting Started',
      description: 'Learn the basics of property verification',
      icon: BookOpen,
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
      icon: Shield,
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
      icon: FileText,
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
      icon: HelpCircle,
      articles: [
        'Verification failed - what to do',
        'Document upload issues',
        'Payment problems',
        'Report generation delays'
      ],
      link: '/help/troubleshooting'
    }
  ];

  const faqs = [
    {
      question: 'How long does property verification take?',
      answer: `Most basic verifications are completed within 24-48 hours. Complex verifications involving multiple documents or legal checks may take 3-5 business days. You'll receive real-time updates throughout the process.`
    },
    {
      question: 'What documents do I need for verification?',
      answer: 'The required documents vary by verification type, but typically include: property title/deed, survey plan, certificate of occupancy, and valid ID. Our system will guide you through the specific requirements for your verification type.'
    },
    {
      question: 'Is my personal information secure?',
      answer: `Yes, we use bank-level encryption and security measures to protect your data. We're SOC 2 compliant and ISO 27001 certified. Your information is never shared with third parties without your explicit consent.`
    },
    {
      question: 'What if the verification reveals issues with the property?',
      answer: `If we discover issues, you'll receive a detailed report explaining the problems and recommended next steps. We also provide guidance on how to address issues or whether to proceed with the transaction.`
    },
    {
      question: `Can I get a refund if I'm not satisfied?`,
      answer: `Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our verification service, contact our support team for a full refund within 30 days of your purchase.`
    },
    {
      question: 'Do you verify properties outside Kenya?',
      answer: 'Currently, we focus on properties within Kenya, with plans to expand to other East African countries. Contact us if you have properties in other regions - we may be able to help through our partner network.'
    }
  ];

  const contactOptions = [
    {
      title: 'Live Chat',
      description: 'Get instant help from our support team',
      icon: MessageCircle,
      availability: 'Available 24/7',
      action: () => handleContactClick('chat')
    },
    {
      title: 'Phone Support',
      description: 'Speak directly with our experts',
      icon: Phone,
      availability: 'Mon-Fri, 8AM-6PM EAT',
      action: () => handleContactClick('phone')
    },
    {
      title: 'Email Support',
      description: 'Send us detailed questions',
      icon: Mail,
      availability: 'Response within 4 hours',
      action: () => handleContactClick('email')
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-white py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div 
            className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'2\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"
          />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full mb-6">
              <HelpCircle className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              How Can We Help You?
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-white/90 max-w-3xl mx-auto leading-relaxed">
              Find answers, get support, and learn how to make the most of TripleCheck\u2019s property verification platform
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-2xl">
                <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search for help articles, guides, or FAQs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-14 pr-32 py-4 text-lg bg-transparent border-0 text-gray-900 placeholder:text-gray-500 focus:ring-0 focus:outline-none"
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg"
                  onClick={() => {
                    if (searchQuery) {
                      trackNavigation('/help', `/help/search?q=${searchQuery}`, 'help_search');
                    }
                  }}
                >
                  Search
                </Button>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">500+</div>
                <div className="text-white/80">Help Articles</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24/7</div>
                <div className="text-white/80">Support Available</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">{'< 4hrs'}</div>
                <div className="text-white/80">Response Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-20 -mt-12 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button 
                  key={index}
                  type="button"
                  className="group bg-white rounded-2xl shadow-xl border border-gray-100 p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer w-full text-left"
                  onClick={action.action}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{action.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{action.description}</p>
                  </div>
                </button>
              );
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
            {helpCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div key={index} className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl hover:border-primary/20 transition-all duration-300">
                  <div className="flex items-start mb-6">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mr-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{category.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{category.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-4 mb-8">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="flex items-start text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                        <div className="p-1 bg-gray-100 rounded-full mr-3 mt-1 group-hover:bg-primary/10 transition-colors duration-200">
                          <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-primary transition-colors duration-200" />
                        </div>
                        <span className="leading-relaxed">{article}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:border-primary group-hover:text-primary transition-colors duration-300"
                    onClick={() => handleGuideClick(category.link.split('/').pop() || '')}
                  >
                    View All Articles
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              );
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
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gradient-to-r from-gray-50 to-white rounded-2xl shadow-sm border border-gray-100 mb-6 overflow-hidden hover:shadow-md transition-shadow duration-300">
                <button
                  type="button"
                  className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2 transition-all duration-200"
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                  <span className="text-lg font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <div className={`p-2 rounded-full transition-all duration-200 ${
                    expandedFAQ === index ? 'bg-primary/10' : 'bg-gray-100'
                  }`}>
                    <ChevronDown 
                      className={`h-5 w-5 transition-all duration-200 ${
                        expandedFAQ === index ? 'rotate-180 text-primary' : 'text-gray-500'
                      }`} 
                    />
                  </div>
                </button>
                {expandedFAQ === index && (
                  <div className="px-8 pb-6 bg-gradient-to-r from-primary/5 to-primary/2">
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-gray-700 leading-relaxed text-lg">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
            {contactOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <button 
                  key={index}
                  type="button"
                  className="group bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 cursor-pointer w-full"
                  onClick={option.action}
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-6 group-hover:from-primary/20 group-hover:to-primary/10 transition-colors duration-300">
                    <IconComponent className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{option.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{option.description}</p>
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-8 bg-gray-50 rounded-full px-4 py-2 group-hover:bg-primary/5 transition-colors duration-300">
                    <Clock className="h-4 w-4 mr-2" />
                    {option.availability}
                  </div>
                  <Button className="w-full group-hover:shadow-lg transition-shadow duration-300">
                    Get Help Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}