import { 
  Shield, 
  FileText, 
  Search, 
  Users, 
  CheckCircle,
  ArrowRight,
  Plus,
  Minus,
  Clock,
  Star,
  TrendingUp
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';

// Sub-service interface for progressive disclosure
interface SubService {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly duration: string;
  readonly price?: string;
  readonly popular?: boolean;
  readonly features: readonly string[];
  readonly cta: {
    readonly text: string;
    readonly action: string;
  };
}

// Main service category with sub-services
interface ServiceCategory {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly color: string;
  readonly bgColor: string;
  readonly stats?: {
    readonly label: string;
    readonly value: string;
  };
  readonly subServices: readonly SubService[];
  readonly contextualInfo: {
    readonly title: string;
    readonly description: string;
    readonly benefits: readonly string[];
  };
}

interface ServiceCategoriesProps {
  readonly className?: string;
  readonly onServiceSelect?: (categoryId: string, subServiceId: string, action: string) => void;
}

// Progressive disclosure service categories - Thunes-inspired
const SERVICE_CATEGORIES: readonly ServiceCategory[] = [
  {
    id: 'verify',
    name: 'Verify',
    description: 'Comprehensive property and document verification services',
    icon: <Shield className="w-8 h-8" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400',
    stats: {
      label: 'Properties Verified',
      value: '250K+'
    },
    contextualInfo: {
      title: 'Protect Your Investment',
      description: 'Connect to our verification network and enable comprehensive property checks, fraud detection, and legal compliance validation for Kenya properties.',
      benefits: [
        'AI-powered fraud detection',
        'Government registry validation',
        'Legal compliance checks',
        'Expert review process'
      ]
    },
    subServices: [
      {
        id: 'basic-verification',
        name: 'Basic Property Check',
        description: 'Essential ownership and legal status verification',
        duration: '2-4 hours',
        price: 'KES 2,500',
        features: ['Ownership validation', 'Basic fraud check', 'Legal status'],
        cta: {
          text: 'Start Basic Check',
          action: 'services/basic-checks'
        }
      },
      {
        id: 'comprehensive-verification',
        name: 'Comprehensive Verification',
        description: 'Full property verification with expert review',
        duration: '24-48 hours',
        price: 'KES 8,500',
        popular: true,
        features: ['Complete ownership history', 'Advanced fraud detection', 'Expert legal review', 'Market analysis'],
        cta: {
          text: 'Get Full Verification',
          action: 'services/comprehensive-verification'
        }
      },
      {
        id: 'document-authentication',
        name: 'Document Authentication',
        description: 'Verify authenticity of property documents',
        duration: '1-2 hours',
        price: 'KES 1,500',
        features: ['Digital forensics', 'Signature verification', 'Compliance check'],
        cta: {
          text: 'Authenticate Documents',
          action: 'services/document-auth'
        }
      }
    ]
  },
  {
    id: 'discover',
    name: 'Discover',
    description: 'Find and connect with verified properties and professionals',
    icon: <Search className="w-8 h-8" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400',
    stats: {
      label: 'Active Listings',
      value: '125K+'
    },
    contextualInfo: {
      title: 'Find Your Perfect Match',
      description: 'Reach new opportunities and connect with verified properties, professionals, and market insights tailored to your needs.',
      benefits: [
        'AI-powered property matching',
        'Verified professional network',
        'Real-time market insights',
        'Comprehensive property database'
      ]
    },
    subServices: [
      {
        id: 'property-search',
        name: 'Property Search',
        description: 'Browse verified properties with AI matching',
        duration: 'Instant',
        features: ['AI-powered matching', 'Verified listings only', 'Market insights'],
        cta: {
          text: 'Search Properties',
          action: 'properties'
        }
      },
      {
        id: 'professional-network',
        name: 'Find Professionals',
        description: 'Connect with verified real estate experts',
        duration: '5 minutes',
        features: ['Verified professionals', 'Rating system', 'Direct communication'],
        cta: {
          text: 'Find Experts',
          action: 'find-professionals'
        }
      },
      {
        id: 'market-insights',
        name: 'Market Analysis',
        description: 'Get comprehensive market data and trends',
        duration: 'Real-time',
        popular: true,
        features: ['Price trends', 'Neighborhood analysis', 'Investment insights', 'Market forecasts'],
        cta: {
          text: 'View Market Data',
          action: 'analytics/market'
        }
      }
    ]
  }
];

/**
 * Progressive Disclosure Service Categories - Thunes-inspired
 * Features click-to-expand, multi-level hierarchy, and contextual information
 */
export function ServiceCategories({
  className = '',
  onServiceSelect
}: ServiceCategoriesProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedSubService, setExpandedSubService] = useState<string | null>(null);

  const handleCategoryClick = useCallback((categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
    setExpandedSubService(null); // Reset sub-service expansion
  }, [activeCategory]);

  const handleSubServiceClick = useCallback((subServiceId: string) => {
    setExpandedSubService(expandedSubService === subServiceId ? null : subServiceId);
  }, [expandedSubService]);

  const handleServiceAction = useCallback((categoryId: string, subServiceId: string, action: string) => {
    onServiceSelect?.(categoryId, subServiceId, action);
  }, [onServiceSelect]);

  const activeService = SERVICE_CATEGORIES.find(cat => cat.id === activeCategory);

  return (
    <div className={`py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 ${className}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Our Kenya property capabilities
          </h2>
          <p className="text-gray-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Comprehensive verification and discovery solutions designed for Kenya's property market.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Main Categories */}
            <div className="lg:col-span-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SERVICE_CATEGORIES.map((category) => {
                  const isActive = activeCategory === category.id;
                  
                  return (
                    <div key={category.id} className="relative">
                      {/* Main Category Card */}
                      <Card 
                        className={`
                          relative h-48 transition-all duration-500 ease-out cursor-pointer overflow-hidden
                          ${isActive 
                            ? `${category.bgColor} shadow-2xl shadow-${category.bgColor}/25 scale-105 border-0` 
                            : 'bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:scale-[1.02]'
                          }
                        `}
                        onClick={() => handleCategoryClick(category.id)}
                      >
                        <CardContent className="p-8 h-full flex flex-col justify-center items-center text-center">
                          {/* Icon */}
                          <div className={`
                            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300
                            ${isActive 
                              ? 'bg-white/20 text-white scale-110' 
                              : 'bg-slate-700 text-slate-300'
                            }
                          `}>
                            {category.icon}
                          </div>
                          
                          {/* Title */}
                          <h3 className={`
                            text-2xl font-bold mb-2 transition-colors duration-300
                            ${isActive ? 'text-white' : 'text-white'}
                          `}>
                            {category.name}
                          </h3>
                          
                          {/* Stats */}
                          {category.stats && (
                            <div className={`
                              text-sm font-medium transition-colors duration-300
                              ${isActive ? 'text-white/90' : 'text-slate-400'}
                            `}>
                              {category.stats.value} {category.stats.label}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Sub-Services Expansion */}
                      {isActive && (
                        <div className="mt-4 space-y-3 animate-slide-up">
                          {category.subServices.map((subService) => {
                            const isExpanded = expandedSubService === subService.id;
                            
                            return (
                              <div key={subService.id} className="relative">
                                {/* Sub-Service Button */}
                                <button
                                  onClick={() => handleSubServiceClick(subService.id)}
                                  className={`
                                    w-full text-left p-4 rounded-lg transition-all duration-300 flex items-center justify-between
                                    ${isExpanded 
                                      ? `${category.bgColor} text-white shadow-lg` 
                                      : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium">{subService.name}</span>
                                    {subService.popular && (
                                      <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                                        <Star className="w-3 h-3 mr-1" />
                                        Popular
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {subService.price && (
                                      <span className="text-sm font-medium">{subService.price}</span>
                                    )}
                                    {isExpanded ? 
                                      <Minus className="w-4 h-4" /> : 
                                      <Plus className="w-4 h-4" />
                                    }
                                  </div>
                                </button>

                                {/* Sub-Service Details */}
                                {isExpanded && (
                                  <div className="mt-2 p-4 bg-slate-800 rounded-lg border border-slate-600 animate-slide-up">
                                    <p className="text-slate-300 text-sm mb-3">
                                      {subService.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-4 mb-3 text-xs text-slate-400">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {subService.duration}
                                      </div>
                                      {subService.price && (
                                        <div className="flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3" />
                                          {subService.price}
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-1 mb-4">
                                      {subService.features.map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2 text-sm">
                                          <CheckCircle className="w-3 h-3 text-green-400 flex-shrink-0" />
                                          <span className="text-slate-300">{feature}</span>
                                        </div>
                                      ))}
                                    </div>

                                    <Button 
                                      onClick={() => handleServiceAction(category.id, subService.id, subService.cta.action)}
                                      className={`w-full ${category.bgColor} hover:opacity-90 transition-opacity duration-200`}
                                    >
                                      {subService.cta.text}
                                      <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Contextual Information */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {activeService ? (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardContent className="p-6">
                      <h3 className="text-xl font-bold mb-4 text-white">
                        {activeService.contextualInfo.title}
                      </h3>
                      <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        {activeService.contextualInfo.description}
                      </p>
                      
                      <div className="space-y-3">
                        {activeService.contextualInfo.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                            <span className="text-slate-300 text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-slate-800 border-slate-600">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ArrowRight className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-white">
                        Select a Service
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Click on a service category to explore available options and learn more about our capabilities.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}