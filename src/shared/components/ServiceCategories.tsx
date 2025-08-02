import { 
  Shield, 
  FileText, 
  Search, 
  Users, 
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

// Enhanced service category types with African property focus
interface ServiceFeature {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon?: React.ReactNode;
  readonly premium?: boolean;
}

interface WorkflowStep {
  readonly step: number;
  readonly title: string;
  readonly description: string;
  readonly duration: string;
  readonly automated?: boolean;
}

interface ValueProposition {
  readonly title: string;
  readonly description: string;
  readonly benefit: string;
}

interface ServiceCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly popular?: boolean;
  readonly stats?: {
    readonly label: string;
    readonly value: string;
  };
  readonly features: readonly ServiceFeature[];
  readonly workflow: readonly WorkflowStep[];
  readonly valueProposition: ValueProposition;
  readonly cta: {
    readonly text: string;
    readonly action: string;
  };
}

interface ServiceCategoriesProps {
  readonly variant?: 'grid' | 'expandable' | 'tabs' | 'hover-cards';
  readonly className?: string;
  readonly showStats?: boolean;
  readonly onCategorySelect?: (categoryId: string, action: string) => void;
}

// Service categories data with comprehensive African property focus
const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'property-verification',
    name: 'Property Verification',
    description: 'Comprehensive verification services for Kenya properties including ownership validation, legal compliance, and fraud detection.',
    icon: <Shield className="w-6 h-6" />,
    color: 'text-emerald-500',
    popular: true,
    stats: {
      label: 'Properties Verified',
      value: '250K+'
    },
    valueProposition: {
      title: 'Protect Your Investment',
      description: 'Avoid costly property fraud and legal disputes with our comprehensive verification process',
      benefit: 'Save up to KES 2M+ by avoiding fraudulent properties and legal complications'
    },
    workflow: [
      {
        step: 1,
        title: 'Submit Property Details',
        description: 'Provide property address, documents, and seller information through our secure platform',
        duration: '2 minutes'
      },
      {
        step: 2,
        title: 'Automated Verification',
        description: 'Our AI system cross-references land registries, legal databases, and fraud patterns',
        duration: '30 minutes'
      },
      {
        step: 3,
        title: 'Expert Review',
        description: 'Legal experts and surveyors validate findings and provide detailed reports',
        duration: '24-48 hours'
      }
    ],
    features: [
      {
        id: 'ownership-validation',
        name: 'Ownership Validation',
        description: 'Verify legitimate ownership through government land registries'
      },
      {
        id: 'fraud-detection',
        name: 'Fraud Detection',
        description: 'AI-powered analysis to identify potential fraudulent activities'
      },
      {
        id: 'legal-compliance',
        name: 'Legal Compliance Check',
        description: 'Ensure property meets all Kenyan legal requirements'
      }
    ],
    cta: {
      text: 'Start Verification',
      action: 'property/verification'
    }
  },
  {
    id: 'document-authentication',
    name: 'Document Authentication',
    description: 'Secure authentication of property documents, contracts, and legal papers for Kenya properties.',
    icon: <FileText className="w-6 h-6" />,
    color: 'text-blue-500',
    stats: {
      label: 'Documents Verified',
      value: '500K+'
    },
    valueProposition: {
      title: 'Ensure Document Authenticity',
      description: 'Protect against forged documents and fraudulent paperwork',
      benefit: 'Prevent legal disputes and financial losses from fake documents'
    },
    workflow: [
      {
        step: 1,
        title: 'Upload Documents',
        description: 'Securely upload title deeds, sale agreements, and certificates',
        duration: '5 minutes'
      },
      {
        step: 2,
        title: 'Digital Analysis',
        description: 'Advanced algorithms analyze document authenticity and integrity',
        duration: '15 minutes'
      },
      {
        step: 3,
        title: 'Expert Validation',
        description: 'Legal professionals verify document legitimacy and compliance',
        duration: '2-4 hours'
      }
    ],
    features: [
      {
        id: 'digital-forensics',
        name: 'Digital Forensics',
        description: 'Advanced analysis to detect document tampering or forgery'
      },
      {
        id: 'signature-verification',
        name: 'Signature Verification',
        description: 'Authenticate signatures and official stamps'
      },
      {
        id: 'compliance-check',
        name: 'Compliance Verification',
        description: 'Ensure documents meet current legal standards'
      }
    ],
    cta: {
      text: 'Authenticate Documents',
      action: 'services/document-auth'
    }
  },
  {
    id: 'property-search',
    name: 'Verified Property Search',
    description: 'Advanced search platform for verified properties in Kenya with AI-powered matching and market insights.',
    icon: <Search className="w-6 h-6" />,
    color: 'text-purple-500',
    stats: {
      label: 'Active Listings',
      value: '125K+'
    },
    valueProposition: {
      title: 'Find Your Perfect Property',
      description: 'Access verified listings with comprehensive market data and insights',
      benefit: 'Save months of searching with AI-powered property matching'
    },
    workflow: [
      {
        step: 1,
        title: 'Set Search Criteria',
        description: 'Define your preferences for location, budget, and property type',
        duration: '3 minutes'
      },
      {
        step: 2,
        title: 'AI Matching',
        description: 'Our system finds properties that match your specific requirements',
        duration: 'Instant'
      },
      {
        step: 3,
        title: 'Verified Results',
        description: 'Browse pre-verified properties with detailed market analysis',
        duration: 'Ongoing'
      }
    ],
    features: [
      {
        id: 'ai-matching',
        name: 'AI-Powered Matching',
        description: 'Smart algorithms find properties that match your criteria'
      },
      {
        id: 'market-insights',
        name: 'Market Insights',
        description: 'Comprehensive data on pricing trends and neighborhood analysis'
      },
      {
        id: 'verified-listings',
        name: 'Pre-Verified Listings',
        description: 'All properties undergo verification before listing'
      }
    ],
    cta: {
      text: 'Search Properties',
      action: 'properties'
    }
  },
  {
    id: 'professional-network',
    name: 'Professional Network',
    description: 'Connect with verified real estate professionals, agents, and service providers in Kenya.',
    icon: <Users className="w-6 h-6" />,
    color: 'text-orange-500',
    stats: {
      label: 'Verified Professionals',
      value: '5K+'
    },
    valueProposition: {
      title: 'Connect with Trusted Experts',
      description: 'Access a network of verified professionals for all your property needs',
      benefit: 'Work with pre-screened experts to ensure quality service'
    },
    workflow: [
      {
        step: 1,
        title: 'Browse Professionals',
        description: 'Search verified agents, lawyers, surveyors, and other experts',
        duration: '2 minutes'
      },
      {
        step: 2,
        title: 'Check Credentials',
        description: 'Review ratings, certifications, and past client feedback',
        duration: '5 minutes'
      },
      {
        step: 3,
        title: 'Connect & Collaborate',
        description: 'Directly contact and work with chosen professionals',
        duration: 'Ongoing'
      }
    ],
    features: [
      {
        id: 'verified-professionals',
        name: 'Verified Professionals',
        description: 'All professionals undergo background checks and verification'
      },
      {
        id: 'rating-system',
        name: 'Rating & Review System',
        description: 'Transparent feedback from previous clients'
      },
      {
        id: 'direct-communication',
        name: 'Direct Communication',
        description: 'Secure messaging and collaboration tools'
      }
    ],
    cta: {
      text: 'Find Professionals',
      action: 'find-professionals'
    }
  }
];

/**
 * Enhanced ServiceCategories component with multiple display variants
 * Features progressive disclosure, hover effects, and African market focus
 */
export function ServiceCategories({
  variant: _variant = 'hover-cards',
  className = '',
  showStats = true,
  onCategorySelect
}: ServiceCategoriesProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const handleCategoryHover = useCallback((categoryId: string | null) => {
    setHoveredCategory(categoryId);
  }, []);

  const handleCtaClick = useCallback((categoryId: string, action: string) => {
    onCategorySelect?.(categoryId, action);
  }, [onCategorySelect]);

  // Hover-reveal variant (Thunes-inspired)
  return (
    <div className={`py-20 bg-gradient-to-br from-slate-900 to-slate-800 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Our Kenya Property Services
          </h2>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Comprehensive verification and search solutions designed specifically for Kenya's property market.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {SERVICE_CATEGORIES.map((category, _index) => (
            <div 
              key={category.id} 
              className="group relative"
              onMouseEnter={() => handleCategoryHover(category.id)}
              onMouseLeave={() => handleCategoryHover(null)}
            >
              {/* Main Card */}
              <Card className={`
                relative h-48 sm:h-56 md:h-64 transition-all duration-500 ease-out cursor-pointer overflow-hidden
                ${hoveredCategory === category.id 
                  ? 'bg-cyan-500 shadow-2xl shadow-cyan-500/25 scale-105 border-0' 
                  : 'bg-white hover:shadow-xl shadow-lg border border-gray-200 hover:scale-[1.02]'
                }
              `}>
                <CardContent className="p-4 sm:p-6 md:p-8 h-full flex flex-col justify-center items-center text-center">
                  {/* Icon */}
                  <div className={`
                    inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300
                    ${hoveredCategory === category.id 
                      ? 'bg-white/20 text-white scale-110' 
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {category.icon}
                  </div>
                  
                  {/* Title */}
                  <h3 className={`
                    text-lg sm:text-xl md:text-2xl font-bold mb-2 transition-colors duration-300
                    ${hoveredCategory === category.id ? 'text-white' : 'text-gray-900'}
                  `}>
                    {category.name}
                  </h3>
                  
                  {/* Stats */}
                  {showStats && category.stats && (
                    <div className={`
                      text-sm font-medium transition-colors duration-300
                      ${hoveredCategory === category.id ? 'text-white/90' : 'text-gray-600'}
                    `}>
                      {category.stats.value} {category.stats.label}
                    </div>
                  )}
                  
                  {/* Popular Badge */}
                  {category.popular && (
                    <Badge className={`
                      mt-2 transition-all duration-300
                      ${hoveredCategory === category.id 
                        ? 'bg-white/20 text-white border-white/30' 
                        : 'bg-secondary text-white border-2 border-secondary'
                      }
                    `}>
                      Popular
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Hover Reveal Content */}
              <div className={`
                absolute top-full left-0 right-0 mt-4 transition-all duration-500 ease-out z-20
                ${hoveredCategory === category.id 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4 pointer-events-none'
                }
              `}>
                <Card className="bg-white border-gray-200 shadow-2xl">
                  <CardContent className="p-6">
                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {category.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      {category.features.slice(0, 3).map((feature) => (
                        <div key={feature.id} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature.name}</span>
                        </div>
                      ))}
                    </div>
                    
                    {/* CTA Button */}
                    <Button 
                      onClick={() => handleCtaClick(category.id, category.cta.action)}
                      className="w-full font-semibold transition-colors duration-200"
                    >
                      {category.cta.text}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action section */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4 text-white">
                Ready to Get Started?
              </h3>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Join thousands of Kenyan property investors who trust TripleCheck 
                for comprehensive verification and fraud protection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-cyan-500 hover:bg-cyan-600 hover:scale-105 transition-all duration-200"
                  onClick={() => handleCtaClick('free-verification', 'property/verification')}
                >
                  Start Free Verification
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:scale-105 transition-all duration-200"
                  onClick={() => handleCtaClick('schedule-demo', 'contact')}
                >
                  Schedule Demo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}