import { 
  BookOpen, 
  Shield, 
  FileText, 
  Users, 
  ArrowRight, 
  CheckCircle,
  Play,
  Clock,
  Star
} from 'lucide-react'
import React from 'react'

import { Button } from '../components/ui/button'
import { useNavigationTracking } from '../utils/navigation'

export default function GettingStarted() {
  const { trackNavigation } = useNavigationTracking();

  const handleStepClick = (step: string, url: string) => {
    trackNavigation('/help/getting-started', url, `getting_started_${step}`);
    window.location.href = url;
  };

  const steps = [
    {
      number: 1,
      title: 'Create Your Account',
      description: 'Sign up for TripleCheck and verify your email address to get started with property verification.',
      icon: Users,
      duration: '2 minutes',
      action: () => handleStepClick('signup', '/register'),
      actionText: 'Sign Up Now'
    },
    {
      number: 2,
      title: 'Choose Verification Type',
      description: 'Select from basic property checks, document authentication, or comprehensive fraud detection.',
      icon: Shield,
      duration: '1 minute',
      action: () => handleStepClick('verification_types', '/services'),
      actionText: 'View Services'
    },
    {
      number: 3,
      title: 'Upload Documents',
      description: 'Securely upload property documents like title deeds, survey plans, and certificates.',
      icon: FileText,
      duration: '5 minutes',
      action: () => handleStepClick('upload', '/services/basic-checks'),
      actionText: 'Start Verification'
    },
    {
      number: 4,
      title: 'Review Your Report',
      description: 'Get detailed verification results with actionable insights and recommendations.',
      icon: BookOpen,
      duration: '24-48 hours',
      action: () => handleStepClick('reports', '/trust/reports'),
      actionText: 'Sample Report'
    }
  ];

  const quickTips = [
    {
      title: 'Prepare Your Documents',
      description: 'Have your property title, survey plan, and ID ready before starting verification.',
      icon: FileText
    },
    {
      title: 'Check Document Quality',
      description: 'Ensure documents are clear, legible, and in PDF or high-resolution image format.',
      icon: CheckCircle
    },
    {
      title: 'Understand Verification Types',
      description: 'Choose the right verification level based on your transaction value and risk tolerance.',
      icon: Shield
    },
    {
      title: 'Review Results Carefully',
      description: 'Take time to understand your verification report and follow up on any red flags.',
      icon: Star
    }
  ];

  const faqs = [
    {
      question: 'How long does the verification process take?',
      answer: 'Basic verifications typically complete within 24-48 hours. Complex verifications may take 3-5 business days.'
    },
    {
      question: 'What documents do I need?',
      answer: 'You\'ll need the property title/deed, survey plan, certificate of occupancy, and a valid ID. Additional documents may be required based on verification type.'
    },
    {
      question: 'Is my information secure?',
      answer: 'Yes, we use bank-level encryption and are SOC 2 compliant. Your documents are stored securely and never shared without permission.'
    },
    {
      question: 'What if issues are found?',
      answer: 'You\'ll receive a detailed report explaining any issues and recommended next steps. Our support team can help you understand the implications.'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-brand text-white py-32 overflow-hidden">
        {/* Enhanced Background */}
        <div className="absolute inset-0 bg-dot-pattern opacity-20"></div>
        <div className="absolute inset-0 gradient-balanced-primary"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-16 left-16 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse-glow"></div>
        <div className="absolute bottom-16 right-16 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-pulse-glow animation-delay-500"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Enhanced Icon */}
            <div className="inline-flex items-center justify-center w-28 h-28 glass-base bg-white/10 rounded-3xl mb-10 hover-glow-premium animate-fade-in">
              <BookOpen className="h-14 w-14 text-white drop-shadow-lg" />
            </div>
            
            <h1 className="text-fluid-3xl md:text-7xl font-bold mb-8 text-enhanced-contrast animate-slide-up">
              Getting Started 
              <span className="text-gradient-premium block mt-2">Guide</span>
            </h1>
            <p className="text-fluid-lg md:text-2xl mb-16 text-enhanced-subtle max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              Learn how to verify properties safely and efficiently with TripleCheck's 
              comprehensive platform designed for the Kenyan market
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-slide-up animation-delay-200">
              <Button 
                size="lg" 
                variant="secondary"
                className="glass-btn-primary px-10 py-5 text-lg font-semibold hover-glow-warm"
                onClick={() => handleStepClick('start_now', '/register')}
              >
                <Play className="mr-3 h-6 w-6" />
                Start Now
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="btn-glass border-white/30 text-white hover:bg-white/10 px-10 py-5 text-lg font-semibold"
                onClick={() => handleStepClick('watch_demo', '/demo')}
              >
                Watch Demo
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/70">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Bank-Level Security
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                10,000+ Verified Properties
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                99.8% Accuracy Rate
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="py-24 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-fluid-2xl md:text-6xl font-bold text-high-contrast mb-8 animate-fade-in">
              4 Simple Steps to Get Started
            </h2>
            <p className="text-fluid-lg text-high-contrast-muted max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              Follow this step-by-step guide to complete your first property verification 
              and join thousands of satisfied users
            </p>
          </div>

          <div className="max-w-7xl mx-auto">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const isLast = index === steps.length - 1;
              
              return (
                <div key={index} className="relative animate-slide-up" style={{animationDelay: `${200 + index * 150}ms`}}>
                  <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 mb-20">
                    {/* Enhanced Step Icon */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-32 h-32 bg-gradient-brand rounded-3xl flex items-center justify-center shadow-2xl layer-depth-3 hover-glow-warm">
                        <IconComponent className="h-16 w-16 text-white" />
                      </div>
                      <div className="absolute -top-3 -right-3 w-12 h-12 glass-base bg-white border-4 border-secondary rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-lg font-bold text-secondary">{step.number}</span>
                      </div>
                    </div>

                    {/* Enhanced Content */}
                    <div className="flex-1 text-center lg:text-left">
                      <div className="glass-base bg-white/80 rounded-3xl p-10 layer-depth-2 enhance-hover">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
                          <h3 className="text-3xl font-bold text-high-contrast mb-4 lg:mb-0">{step.title}</h3>
                          <div className="glass-base bg-accent/10 rounded-2xl px-6 py-3 inline-flex items-center">
                            <Clock className="h-5 w-5 mr-3 text-accent" />
                            <span className="text-sm font-semibold text-accent">{step.duration}</span>
                          </div>
                        </div>
                        
                        <p className="text-high-contrast-muted text-xl leading-relaxed mb-10">{step.description}</p>
                        
                        <Button 
                          onClick={step.action}
                          className="glass-btn-primary w-full lg:w-auto px-10 py-4 text-lg font-semibold hover-glow-warm"
                          size="lg"
                        >
                          {step.actionText}
                          <ArrowRight className="ml-3 h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Connecting Line */}
                  {!isLast && (
                    <div className="absolute left-16 top-32 w-1 h-20 bg-gradient-to-b from-primary via-secondary to-accent rounded-full hidden lg:block opacity-30" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-fluid-2xl md:text-6xl font-bold text-high-contrast mb-8 animate-fade-in">
              Pro Tips for Success
            </h2>
            <p className="text-fluid-lg text-high-contrast-muted max-w-4xl mx-auto leading-relaxed animate-slide-up animation-delay-100">
              Follow these best practices to get the most accurate verification results 
              and maximize your investment security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-7xl mx-auto">
            {quickTips.map((tip, index) => {
              const IconComponent = tip.icon;
              const colors = ['primary', 'secondary', 'accent', 'primary'];
              const color = colors[index % colors.length];
              
              return (
                <div key={index} className="glass-base bg-white/60 rounded-3xl p-10 layer-depth-1 enhance-hover animate-slide-up" style={{animationDelay: `${index * 150}ms`}}>
                  <div className="flex items-start">
                    <div className={`p-6 bg-gradient-to-br from-${color}/10 to-${color}/5 rounded-3xl mr-8 flex-shrink-0 hover-glow-${color === 'primary' ? 'trust' : color === 'secondary' ? 'warm' : 'premium'}`}>
                      <IconComponent className={`h-10 w-10 text-${color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-high-contrast mb-4">{tip.title}</h3>
                      <p className="text-high-contrast-muted leading-relaxed text-lg">{tip.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Common Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Quick answers to help you get started with confidence
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 hover:shadow-xl transition-shadow duration-300">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-brand text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-pattern opacity-10"></div>
        <div className="absolute top-10 right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-10 left-10 w-40 h-40 bg-secondary/10 rounded-full blur-2xl animate-pulse-glow animation-delay-500"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 glass-base bg-white/10 rounded-2xl mb-8">
              <Star className="h-10 w-10 text-white" />
            </div>
            
            <h2 className="text-fluid-2xl md:text-6xl font-bold mb-8 text-enhanced-contrast">
              Ready to Get Started?
            </h2>
            <p className="text-fluid-lg mb-16 text-enhanced-subtle max-w-4xl mx-auto leading-relaxed">
              Join thousands of property buyers and sellers who trust TripleCheck for secure 
              transactions in Kenya's real estate market
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                size="lg" 
                variant="secondary"
                className="glass-btn-primary px-12 py-5 text-xl font-semibold hover-glow-warm"
                onClick={() => handleStepClick('cta_signup', '/register')}
              >
                <Users className="mr-3 h-6 w-6" />
                Create Free Account
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="btn-glass border-white/30 text-white hover:bg-white/10 px-12 py-5 text-xl font-semibold"
                onClick={() => handleStepClick('cta_contact', '/contact')}
              >
                Contact Support
              </Button>
            </div>
            
            {/* Enhanced Trust Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {[
                { icon: Shield, text: "Bank-Level Security" },
                { icon: CheckCircle, text: "99.8% Accuracy" },
                { icon: Users, text: "10,000+ Users" },
                { icon: Clock, text: "24/7 Support" }
              ].map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <div key={index} className="flex flex-col items-center text-white/80 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                    <IconComponent className="h-6 w-6 mb-2" />
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}