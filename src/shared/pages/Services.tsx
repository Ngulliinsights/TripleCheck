import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  Users, 
  BarChart3, 
  Home,
  ArrowRight,
  CheckCircle,
  Star,
  Clock
} from './index'
import React from 'react'
import { useNavigate } from 'react-router-dom'

import { Button } from '../components/ui/button'
import { useNavigationTracking } from '../utils/navigation'

export default function Services() {
  const navigate = useNavigate();
  const { trackNavigation, setUserType } = useNavigationTracking();

  const handleServiceClick = (service: string, userType?: string) => {
    if (userType) setUserType(userType);
    
    // Map service IDs to correct routes
    const routeMap: Record<string, string> = {
      'basic-checks': '/trust/basic-checks',
      'fraud-detection': '/trust/fraud-detection', 
      'document-auth': '/trust/document-auth',
      'reputation': '/trust/reputation',
      'reports': '/trust/reports',
      'list-property': '/list-property'
    };
    
    const route = routeMap[service] || `/services/${service}`;
    trackNavigation('/services', route, 'service_selection');
    
    // Navigate to the correct route
    navigate(route);
  };

  const services = [
    {
      id: 'basic-checks',
      title: 'Property Verification',
      description: 'Comprehensive property verification including ownership, legal status, and market value assessment.',
      icon: Shield,
      features: ['Ownership verification', 'Legal document check', 'Market value assessment', 'Property history'],
      price: 'From KSh 5,000',
      popular: true,
      userTypes: ['buyer', 'seller'],
      cta: 'Start Verification'
    },
    {
      id: 'fraud-detection',
      title: 'AI Fraud Detection',
      description: 'Advanced AI-powered fraud detection to identify suspicious properties and protect your investment.',
      icon: AlertTriangle,
      features: ['AI-powered analysis', 'Risk scoring', 'Fraud pattern detection', 'Real-time alerts'],
      price: 'From KSh 3,000',
      popular: false,
      userTypes: ['buyer', 'agent'],
      cta: 'Check Property'
    },
    {
      id: 'document-auth',
      title: 'Document Authentication',
      description: 'Secure verification of property documents using blockchain technology and expert validation.',
      icon: FileCheck,
      features: ['Blockchain verification', 'Expert validation', 'Digital certificates', 'Tamper detection'],
      price: 'From KSh 2,500',
      popular: false,
      userTypes: ['buyer', 'seller', 'agent'],
      cta: 'Verify Documents'
    },
    {
      id: 'reputation',
      title: 'Trust & Reputation',
      description: 'Build and showcase your reputation in the real estate community with verified reviews and ratings.',
      icon: Users,
      features: ['Reputation scoring', 'Verified reviews', 'Trust badges', 'Community ratings'],
      price: 'Free',
      popular: false,
      userTypes: ['seller', 'agent'],
      cta: 'Build Reputation'
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      description: 'Detailed verification reports and market analytics to make informed property decisions.',
      icon: BarChart3,
      features: ['Detailed reports', 'Market analytics', 'Trend analysis', 'Investment insights'],
      price: 'From KSh 1,500',
      popular: false,
      userTypes: ['buyer', 'agent', 'developer'],
      cta: 'Get Report'
    },
    {
      id: 'list-property',
      title: 'Verified Property Listing',
      description: 'List your property with full verification to attract serious buyers and command premium prices.',
      icon: Home,
      features: ['Verified listings', 'Premium placement', 'Buyer matching', 'Marketing tools'],
      price: 'From KSh 10,000',
      popular: true,
      userTypes: ['seller', 'agent'],
      cta: 'List Property'
    }
  ];

  const testimonials = [
    {
      name: 'James Makau',
      role: 'Property Buyer',
      content: 'TripleCheck saved me from a fraudulent property deal in Nairobi. The verification process was thorough and gave me complete peace of mind.',
      rating: 5
    },
    {
      name: 'Grace Wanjiku',
      role: 'Real Estate Agent',
      content: 'My clients in Westlands trust me more because I use TripleCheck for all property verifications. It\'s become essential to my business.',
      rating: 5
    },
    {
      name: 'Peter Kamau',
      role: 'Property Developer',
      content: 'The document authentication service helped us maintain transparency with investors and regulatory bodies in our Mombasa projects.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-hero-primary text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6 text-coral-dark">
              Comprehensive Property Verification Services
            </h1>
            <p className="text-xl mb-8 text-white/90">
              Protect your real estate investments with our AI-powered verification platform. 
              From basic checks to advanced fraud detection, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => handleServiceClick('basic-checks', 'buyer')}
                className="flex items-center"
              >
                Start Free Verification
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-primary"
                onClick={() => {
                  trackNavigation('/services', '/pricing', 'pricing_interest');
                  navigate('/pricing');
                }}
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Verification Service
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Each service is designed to address specific needs in the property verification process. 
              Combine multiple services for comprehensive protection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => {
              const IconComponent = service.icon;
              return (
                <div 
                  key={service.id}
                  className={`relative bg-card rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                    service.popular ? 'border-primary' : 'border-border'
                  }`}
                >
                  {service.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="p-8">
                    <div className="flex items-center mb-4">
                      <div className={`p-3 rounded-lg ${service.popular ? 'bg-primary text-white' : 'bg-gray-100 text-primary'}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <h3 className="text-xl font-bold text-foreground">{service.title}</h3>
                        <p className="text-primary font-semibold">{service.price}</p>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground mb-6">{service.description}</p>
                    
                    <ul className="space-y-3 mb-8">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className="w-full"
                      variant={service.popular ? 'default' : 'outline'}
                      onClick={() => handleServiceClick(service.id, service.userTypes[0])}
                    >
                      {service.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How Our Verification Process Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Simple, fast, and thorough verification in just a few steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: '1',
                title: 'Submit Property Details',
                description: 'Provide property information and upload relevant documents'
              },
              {
                step: '2',
                title: 'AI Analysis',
                description: 'Our AI system analyzes the property for potential risks and issues'
              },
              {
                step: '3',
                title: 'Expert Review',
                description: 'Human experts verify the AI findings and conduct additional checks'
              },
              {
                step: '4',
                title: 'Receive Report',
                description: 'Get a comprehensive verification report with actionable insights'
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary text-white rounded-full text-xl font-bold mb-4">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Trusted by Thousands of Property Professionals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-card rounded-xl shadow-lg p-8">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold text-foreground">{testimonial.name}</p>
                  <p className="text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero-dark text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Secure Your Property Investment?
          </h2>
          <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust TripleCheck for their property verification needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => handleServiceClick('basic-checks', 'buyer')}
              className="flex items-center"
            >
              <Clock className="mr-2 h-5 w-5" />
              Start 5-Minute Verification
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-primary"
              onClick={() => {
                trackNavigation('/services', '/contact', 'contact_interest');
                navigate('/contact');
              }}
            >
              Talk to an Expert
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}