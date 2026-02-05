import { 
  Users, 
  Home, 
  Building, 
  Briefcase,
  ArrowRight,
  CheckCircle,
  Shield,
  TrendingUp,
  Clock,
  Award
} from './index'
import React, { useState } from 'react'

import { Button } from '../components/ui/button'
import { useNavigationTracking } from '../utils/navigation'

export default function Solutions() {
  const { trackNavigation, setUserType } = useNavigationTracking();
  const [activeTab, setActiveTab] = useState('buyers');

  const handleSolutionClick = (solution: string, userType: string) => {
    setUserType(userType);
    trackNavigation('/solutions', `/solutions/${solution}`, 'solution_selection');
    window.location.href = `/solutions/${solution}`;
  };

  const solutions = {
    buyers: {
      title: 'Property Buyers',
      subtitle: 'Secure Your Dream Property with Confidence',
      description: 'Make informed property purchases with comprehensive verification and fraud protection.',
      icon: Home,
      benefits: [
        'Avoid fraudulent properties and scams',
        'Verify ownership and legal status',
        'Get accurate market valuations',
        'Access property history and records',
        'Receive expert investment advice',
        'Connect with verified sellers'
      ],
      features: [
        {
          title: 'Property Verification',
          description: 'Complete property background check including ownership, legal status, and market value.',
          price: 'From KSh 5,000'
        },
        {
          title: 'Fraud Protection',
          description: 'AI-powered fraud detection to identify suspicious properties and protect your investment.',
          price: 'From KSh 3,000'
        },
        {
          title: 'Market Analysis',
          description: 'Detailed market reports and investment insights for informed decision making.',
          price: 'From KSh 2,000'
        }
      ],
      cta: 'Start Property Search',
      testimonial: {
        name: 'James Makau',
        role: 'First-time Home Buyer',
        content: 'TripleCheck helped me avoid a fraudulent property deal in Nairobi and find my perfect home. The verification process gave me complete peace of mind.'
      }
    },
    sellers: {
      title: 'Property Sellers',
      subtitle: 'Sell Faster with Verified Listings',
      description: 'Increase buyer confidence and command premium prices with verified property listings.',
      icon: TrendingUp,
      benefits: [
        'Attract serious, qualified buyers',
        'Command higher selling prices',
        'Reduce time on market',
        'Build trust with potential buyers',
        'Professional listing presentation',
        'Access to buyer network'
      ],
      features: [
        {
          title: 'Verified Listings',
          description: 'Professional property verification and listing with trust badges and certificates.',
          price: 'From KSh 10,000'
        },
        {
          title: 'Premium Marketing',
          description: 'Enhanced visibility and professional marketing materials for your property.',
          price: 'From KSh 15,000'
        },
        {
          title: 'Buyer Matching',
          description: 'Connect with pre-qualified buyers actively looking for properties like yours.',
          price: 'From KSh 5,000'
        }
      ],
      cta: 'List Your Property',
      testimonial: {
        name: 'Grace Wanjiku',
        role: 'Property Owner',
        content: 'My property in Westlands sold 40% faster and at a 15% higher price after getting it verified through TripleCheck. Buyers trusted the listing immediately.'
      }
    },
    agents: {
      title: 'Real Estate Agents',
      subtitle: 'Professional Tools for Trusted Agents',
      description: 'Build client trust and grow your business with professional verification tools.',
      icon: Briefcase,
      benefits: [
        'Build client trust and credibility',
        'Differentiate from competitors',
        'Reduce transaction risks',
        'Professional verification reports',
        'Client management tools',
        'Marketing support materials'
      ],
      features: [
        {
          title: 'Agent Dashboard',
          description: 'Comprehensive dashboard for managing clients, properties, and verification requests.',
          price: 'From KSh 25,000/month'
        },
        {
          title: 'Bulk Verification',
          description: 'Discounted rates for multiple property verifications and portfolio management.',
          price: 'Custom pricing'
        },
        {
          title: 'White-label Reports',
          description: 'Branded verification reports with your agency logo and contact information.',
          price: 'From KSh 50,000/month'
        }
      ],
      cta: 'Join Agent Network',
      testimonial: {
        name: 'Peter Kamau',
        role: 'Senior Real Estate Agent',
        content: 'TripleCheck has become essential to my business in Nairobi. Clients trust me more, and I close deals faster with verified properties.'
      }
    },
    developers: {
      title: 'Property Developers',
      subtitle: 'Enterprise Verification Solutions',
      description: 'Maintain transparency and compliance with enterprise-grade verification services.',
      icon: Building,
      benefits: [
        'Regulatory compliance assurance',
        'Investor confidence building',
        'Risk mitigation and management',
        'Project transparency tools',
        'Bulk verification services',
        'Custom integration options'
      ],
      features: [
        {
          title: 'Project Verification',
          description: 'Comprehensive verification of development projects including permits and compliance.',
          price: 'Custom pricing'
        },
        {
          title: 'Investor Portal',
          description: 'Transparent investor portal with real-time project updates and verification status.',
          price: 'From KSh 100,000/month'
        },
        {
          title: 'API Integration',
          description: 'Custom API integration for seamless verification workflow integration.',
          price: 'Enterprise pricing'
        }
      ],
      cta: 'Schedule Demo',
      testimonial: {
        name: 'Mary Njeri',
        role: 'Development Manager',
        content: 'TripleCheck helped us maintain transparency with investors and regulatory bodies throughout our development projects in Mombasa.'
      }
    }
  };

  const currentSolution = solutions[activeTab as keyof typeof solutions];
  const IconComponent = currentSolution.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-hero-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-coral-dark">
              Tailored Solutions for Every Real Estate Professional
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Whether you&apos;re buying, selling, or developing properties, we have the perfect verification solution for your needs.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Tabs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          {/* Tab Navigation */}
          <div className="flex flex-wrap justify-center mb-16">
            {Object.entries(solutions).map(([key, solution]) => {
              const IconComp = solution.icon;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center px-6 py-3 m-2 rounded-lg transition-all duration-300 ${
                    activeTab === key
                      ? 'bg-primary text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComp className="h-5 w-5 mr-2" />
                  {solution.title}
                </button>
              );
            })}
          </div>

          {/* Active Solution Content */}
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
              {/* Left Column - Content */}
              <div>
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-primary/10 rounded-lg mr-4">
                    <IconComponent className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{currentSolution.subtitle}</h2>
                    <p className="text-gray-600">For {currentSolution.title}</p>
                  </div>
                </div>
                
                <p className="text-xl text-gray-700 mb-8">{currentSolution.description}</p>
                
                <div className="space-y-4 mb-8">
                  {currentSolution.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  size="lg"
                  onClick={() => handleSolutionClick(activeTab, activeTab)}
                  className="flex items-center"
                >
                  {currentSolution.cta}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>

              {/* Right Column - Features */}
              <div className="space-y-6">
                {currentSolution.features.map((feature, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                      <span className="text-primary font-semibold">{feature.price}</span>
                    </div>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-gray-50 rounded-xl p-8 text-center">
              <div className="max-w-3xl mx-auto">
                <div className="flex justify-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Award key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-xl text-gray-700 italic mb-6">
                  "{currentSolution.testimonial.content}"
                </blockquote>
                <div>
                  <p className="font-semibold text-gray-900">{currentSolution.testimonial.name}</p>
                  <p className="text-gray-600">{currentSolution.testimonial.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Professionals Across Africa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { number: '50,000+', label: 'Properties Verified' },
              { number: '15,000+', label: 'Happy Customers' },
              { number: '2,500+', label: 'Real Estate Agents' },
              { number: '99.8%', label: 'Accuracy Rate' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Choose your solution and start protecting your real estate investments today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => handleSolutionClick(activeTab, activeTab)}
              className="flex items-center"
            >
              <Clock className="mr-2 h-5 w-5" />
              Get Started Now
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={() => trackNavigation('/solutions', '/contact', 'contact_interest')}
            >
              Schedule Consultation
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}