import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
        alert('Community feature coming soon!');
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
      answer: 'Most basic verifications are completed within 24-48 hours. Complex verifications involving multiple documents or legal checks may take 3-5 business days. You\'ll receive real-time updates throughout the process.'
    },
    {
      question: 'What documents do I need for verification?',
      answer: 'The required documents vary by verification type, but typically include: property title/deed, survey plan, certificate of occupancy, and valid ID. Our system will guide you through the specific requirements for your verification type.'
    },
    {
      question: 'Is my personal information secure?',
      answer: 'Yes, we use bank-level encryption and security measures to protect your data. We\'re SOC 2 compliant and ISO 27001 certified. Your information is never shared with third parties without your explicit consent.'
    },
    {
      question: 'What if the verification reveals issues with the property?',
      answer: 'If we discover issues, you\'ll receive a detailed report explaining the problems and recommended next steps. We also provide guidance on how to address issues or whether to proceed with the transaction.'
    },
    {
      question: 'Can I get a refund if I\'m not satisfied?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with our verification service, contact our support team for a full refund within 30 days of your purchase.'
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
      <section className="bg-gradient-to-br from-primary to-primary/80 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              How Can We Help You?
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Find answers, get support, and learn how to make the most of TripleCheck
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search for help articles, guides, or FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white text-gray-900 rounded-lg"
              />
              <Button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
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
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-16 -mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={action.action}
                >
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-lg mr-4">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{action.title}</h3>
                  <p className="text-gray-600 text-sm">{action.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Help Categories */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Browse Help Topics
            </h2>
            <p className="text-xl text-gray-600">
              Find detailed guides and tutorials for every aspect of property verification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {helpCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-primary/10 rounded-lg mr-4">
                      <IconComponent className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                      <p className="text-gray-600">{category.description}</p>
                    </div>
                  </div>
                  
                  <ul className="space-y-3 mb-6">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex} className="flex items-center text-gray-700">
                        <ChevronRight className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                        {article}
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
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
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Quick answers to the most common questions
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  <ChevronDown 
                    className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
                      expandedFAQ === index ? 'rotate-180' : ''
                    }`} 
                  />
                </button>
                {expandedFAQ === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Still Need Help?
            </h2>
            <p className="text-xl text-gray-600">
              Our support team is here to help you succeed
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {contactOptions.map((option, index) => {
              const IconComponent = option.icon;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                  onClick={option.action}
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-6">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{option.title}</h3>
                  <p className="text-gray-600 mb-4">{option.description}</p>
                  <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
                    <Clock className="h-4 w-4 mr-2" />
                    {option.availability}
                  </div>
                  <Button className="w-full">
                    Get Help Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}