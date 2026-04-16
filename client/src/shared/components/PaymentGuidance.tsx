import { AlertTriangle, CreditCard, Building, Shield, CheckCircle, XCircle } from 'lucide-react'
import React from 'react'

import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface PaymentMethod {
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  suitableFor: string[];
  notSuitableFor?: string[];
  advantages?: string[];
  warnings?: string[];
  maxRecommendedAmount?: number;
  color: 'green' | 'yellow' | 'blue';
}

const paymentMethods: PaymentMethod[] = [
  {
    name: 'M-Pesa',
    description: 'Mobile money payment system',
    icon: CreditCard,
    suitableFor: [
      'Service fees (verification, listings)',
      'Small consultation fees',
      'Tour bookings',
      'Document authentication'
    ],
    notSuitableFor: [
      'Property purchases',
      'Property deposits',
      'Rent payments above KES 10,000',
      'Large service packages'
    ],
    warnings: [
      'Payments are irreversible',
      'No dispute resolution mechanism',
      'Limited to registered M-Pesa users'
    ],
    maxRecommendedAmount: 10000,
    color: 'yellow'
  },
  {
    name: 'Bank Transfer',
    description: 'Direct bank-to-bank transfer',
    icon: Building,
    suitableFor: [
      'Property purchases',
      'Large deposits',
      'High-value services',
      'Escrow transactions'
    ],
    advantages: [
      'Reversible with proper documentation',
      'Bank dispute resolution available',
      'Higher transaction limits',
      'Better audit trail'
    ],
    color: 'green'
  },
  {
    name: 'Escrow Service',
    description: 'Third-party secured payment holding',
    icon: Shield,
    suitableFor: [
      'Property purchases',
      'Large transactions',
      'International buyers',
      'High-risk transactions'
    ],
    advantages: [
      'Maximum security for both parties',
      'Professional dispute resolution',
      'Legal protection',
      'Conditional release of funds'
    ],
    color: 'blue'
  }
];

interface PaymentGuidanceProps {
  transactionType?: 'service' | 'property' | 'general';
  amount?: number;
  showWarning?: boolean;
  className?: string;
}

export function PaymentGuidance({ 
  transactionType = 'general', 
  amount, 
  showWarning = true,
  className = '' 
}: PaymentGuidanceProps) {
  const getRecommendedMethods = () => {
    if (transactionType === 'property' || (amount && amount > 10000)) {
      return paymentMethods.filter(method => method.name !== 'M-Pesa');
    }
    return paymentMethods;
  };

  const recommendedMethods = getRecommendedMethods();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Critical Warning for Property Transactions */}
      {(transactionType === 'property' || (amount && amount > 10000)) && showWarning && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Important: Property Purchase Payments</AlertTitle>
          <AlertDescription className="text-red-700">
            For property purchases, deposits, or large transactions, use bank transfers or escrow services. 
            M-Pesa payments cannot be reversed and offer no dispute resolution.
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Methods Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recommendedMethods.map((method) => {
          const Icon = method.icon;
          const isRecommended = transactionType === 'service' ? method.name === 'M-Pesa' : method.name !== 'M-Pesa';
          
          return (
            <Card key={method.name} className={`relative ${isRecommended ? 'ring-2 ring-green-200' : ''}`}>
              {isRecommended && (
                <Badge className="absolute -top-2 -right-2 bg-green-500 text-white">
                  Recommended
                </Badge>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${
                    method.color === 'green' ? 'text-green-600' :
                    method.color === 'yellow' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                </div>
                <CardDescription>{method.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Suitable For */}
                <div>
                  <h4 className="font-medium text-sm text-green-700 mb-2 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Suitable For:
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {method.suitableFor.map((item, index) => (
                      <li key={index} className="flex items-start gap-1">
                        <span className="text-green-500 mt-1">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Not Suitable For */}
                {method.notSuitableFor && (
                  <div>
                    <h4 className="font-medium text-sm text-red-700 mb-2 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Not Suitable For:
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {method.notSuitableFor.map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-red-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Advantages */}
                {method.advantages && (
                  <div>
                    <h4 className="font-medium text-sm text-blue-700 mb-2">Advantages:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {method.advantages.map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-blue-500 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {method.warnings && (
                  <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                    <h4 className="font-medium text-sm text-yellow-800 mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Important Warnings:
                    </h4>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {method.warnings.map((item, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <span className="text-yellow-600 mt-1">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Max Amount */}
                {method.maxRecommendedAmount && (
                  <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    Max recommended: KES {method.maxRecommendedAmount.toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* General Recommendation */}
      <Alert className="border-blue-200 bg-blue-50">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">Payment Recommendation</AlertTitle>
        <AlertDescription className="text-blue-700">
          {transactionType === 'property' || (amount && amount > 10000)
            ? 'For your security, we strongly recommend using bank transfers or escrow services for this transaction.'
            : 'Use M-Pesa only for service fees under KES 10,000. For property transactions, always use bank transfers or escrow services.'
          }
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default PaymentGuidance;