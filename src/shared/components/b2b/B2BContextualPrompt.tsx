import { Building2, ArrowRight, Zap, Shield } from 'lucide-react'
import React from 'react'

import { Button } from '../ui/button'

import { cn } from '../../lib/utils'

interface B2BContextualPromptProps {
  className?: string;
  context: 'verification_complete' | 'high_value_property' | 'frequent_user' | 'fraud_detected';
  propertyValue?: number;
  verificationsCount?: number;
  riskScore?: number;
}

export function B2BContextualPrompt({ 
  className, 
  context,
  propertyValue,
  verificationsCount,
  riskScore 
}: B2BContextualPromptProps) {
  const getContextualMessage = () => {
    switch (context) {
      case 'verification_complete':
        return {
          title: 'Verification Complete!',
          message: 'Imagine processing hundreds of these automatically through our API',
          cta: 'See API Demo',
          icon: <Shield className="w-5 h-5 text-green-500" />
        };
      case 'high_value_property':
        return {
          title: 'High-Value Property Detected',
          message: `KES ${propertyValue?.toLocaleString()} properties need enterprise-grade verification`,
          cta: 'Get Enterprise API',
          icon: <Building2 className="w-5 h-5 text-blue-500" />
        };
      case 'frequent_user':
        return {
          title: `${verificationsCount} Verifications This Month`,
          message: 'You could automate this workflow with our business API',
          cta: 'Upgrade to API',
          icon: <Zap className="w-5 h-5 text-yellow-500" />
        };
      case 'fraud_detected':
        return {
          title: 'Fraud Risk Detected',
          message: `Risk score: ${riskScore}%. Our API prevents fraud at scale`,
          cta: 'Learn More',
          icon: <Shield className="w-5 h-5 text-red-500" />
        };
      default:
        return {
          title: 'Business API Available',
          message: 'Integrate this verification power into your platform',
          cta: 'Get Started',
          icon: <Building2 className="w-5 h-5 text-blue-500" />
        };
    }
  };

  const { title, message, cta, icon } = getContextualMessage();

  return (
    <div className={cn(
      'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 shadow-sm',
      className
    )}>
      <div className="flex items-start space-x-3">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-sm text-gray-600 mb-3">{message}</p>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = '/api-demo'}
          >
            {cta}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}