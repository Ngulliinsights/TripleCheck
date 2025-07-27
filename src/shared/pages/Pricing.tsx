import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CheckCircle, ArrowRight } from 'lucide-react';

// Define types for better TypeScript safety and code documentation
interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  isPopular: boolean;
  buttonText: string;
  buttonVariant: 'default' | 'outline';
}

interface FAQ {
  question: string;
  answer: string;
}

// Extract pricing data to improve maintainability and separation of concerns
const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Basic',
    price: '$49',
    period: '/month',
    description: 'Perfect for individual property seekers',
    features: [
      'Up to 5 property verifications per month',
      'Basic fraud detection',
      'Email support',
      'Mobile app access',
      'Community reviews access'
    ],
    isPopular: false,
    buttonText: 'Get Started',
    buttonVariant: 'outline'
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    description: 'Ideal for real estate professionals',
    features: [
      'Up to 25 property verifications per month',
      'Advanced fraud detection with AI',
      'Priority email & chat support',
      'Advanced reporting and analytics',
      'API access for integrations',
      'Custom verification workflows'
    ],
    isPopular: true,
    buttonText: 'Start Free Trial',
    buttonVariant: 'default'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For large organizations and agencies',
    features: [
      'Unlimited property verifications',
      'White-label solution available',
      'Dedicated account manager',
      'Custom integrations and APIs',
      '24/7 phone and email support',
      'Advanced security and compliance',
      'Custom training and onboarding'
    ],
    isPopular: false,
    buttonText: 'Contact Sales',
    buttonVariant: 'outline'
  }
];

// Extract FAQ data for better organization
const FAQS: FAQ[] = [
  {
    question: 'Can I change my plan anytime?',
    answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we\'ll prorate any billing adjustments.'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'We offer a 14-day free trial for our Pro plan, giving you full access to all features with no credit card required.'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise customers. All payments are processed securely.'
  }
];

// Create a reusable component for pricing cards to reduce repetition
const PricingCard: React.FC<{ plan: PricingPlan }> = ({ plan }) => {
  return (
    <Card 
      className={`relative h-full transition-all duration-300 hover:shadow-lg ${
        plan.isPopular ? 'border-secondary border-2 shadow-xl bg-gradient-to-br from-secondary/5 to-secondary/10' : 'hover:border-gray-300'
      }`}
    >
      {/* Popular badge with coral accent */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-secondary text-secondary-foreground px-4 py-1 shadow-md" role="banner">
            Most Popular
          </Badge>
        </div>
      )}
      
      <CardHeader className="text-center pb-8">
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <div className="mt-4">
          <span className={`text-4xl font-bold ${plan.isPopular ? 'text-secondary' : 'text-primary'}`} aria-label={`Price: ${plan.price}${plan.period}`}>
            {plan.price}
          </span>
          <span className="text-gray-600">{plan.period}</span>
        </div>
        <p className="text-gray-600 mt-2">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex flex-col h-full">
        {/* Features list with improved accessibility and semantic markup */}
        <ul className="space-y-4 flex-grow" role="list">
          {plan.features.map((feature, featureIndex) => (
            <li key={featureIndex} className="flex items-start" role="listitem">
              <CheckCircle 
                className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" 
                aria-hidden="true"
              />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
        
        {/* Enhanced button with coral accent for popular plan */}
        <Button 
          variant={plan.isPopular ? 'coral' : plan.buttonVariant}
          className={`w-full mt-8 transition-all duration-200 ${
            plan.isPopular 
              ? 'hover:scale-105 focus:ring-2 focus:ring-secondary/50 shadow-lg hover:shadow-xl' 
              : 'hover:scale-105 focus:ring-2 focus:ring-gray-400'
          }`}
          aria-label={`${plan.buttonText} for ${plan.name} plan`}
        >
          {plan.buttonText}
          <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
        </Button>
      </CardContent>
    </Card>
  );
};

// Create a reusable FAQ component for consistency
const FAQItem: React.FC<{ faq: FAQ }> = ({ faq }) => {
  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardContent className="p-6">
        <h3 className="font-semibold mb-2 text-lg">{faq.question}</h3>
        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
      </CardContent>
    </Card>
  );
};

// Enhanced toggle switch component with proper state management
const BillingToggle: React.FC<{ 
  isAnnual: boolean; 
  onToggle: (isAnnual: boolean) => void; 
}> = ({ isAnnual, onToggle }) => {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className={`text-gray-600 transition-colors ${!isAnnual ? 'font-medium text-gray-800' : ''}`}>
        Monthly
      </span>
      <div className="relative">
        <input 
          type="checkbox" 
          className="sr-only"
          checked={isAnnual}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label="Toggle between monthly and annual billing"
        />
        <div 
          className={`w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
            isAnnual ? 'bg-secondary' : 'bg-gray-300'
          }`}
          onClick={() => onToggle(!isAnnual)}
        >
          <div 
            className={`w-5 h-5 bg-white rounded-full transition-transform duration-200 transform ${
              isAnnual ? 'translate-x-6' : 'translate-x-0.5'
            } mt-0.5`}
          />
        </div>
      </div>
      <span className={`text-gray-600 transition-colors ${isAnnual ? 'font-medium text-gray-800' : ''}`}>
        Annual 
        <Badge className="ml-2 bg-green-100 text-green-800">Save 20%</Badge>
      </span>
    </div>
  );
};

export default function Pricing() {
  // Add state management for the billing toggle functionality
  const [isAnnualBilling, setIsAnnualBilling] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced hero section with improved typography and spacing */}
      <section className="bg-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Simple, Transparent
            <span className="text-secondary"> Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
            Choose the plan that fits your needs. All plans include our core verification features 
            with no hidden fees or long-term contracts.
          </p>
          
          {/* Improved billing toggle with proper state management */}
          <BillingToggle 
            isAnnual={isAnnualBilling} 
            onToggle={setIsAnnualBilling}
          />
        </div>
      </section>

      {/* Pricing cards section with improved grid layout */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {PRICING_PLANS.map((plan, index) => (
              <PricingCard key={plan.name} plan={plan} />
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced FAQ section with better structure */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Have questions about our pricing? We're here to help.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto space-y-6">
            {FAQS.map((faq, index) => (
              <FAQItem key={index} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}