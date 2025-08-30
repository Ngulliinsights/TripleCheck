import { Router, Request, Response } from 'express';

const router = Router();

// Type definitions
interface SalesInquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  companySize: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  industry: string;
  interestedProducts: string[];
  message: string;
  budget?: string;
  timeline?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'closed' | 'lost';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  followUpDate?: string;
}

interface B2BProduct {
  id: string;
  name: string;
  description: string;
  category: 'api' | 'platform' | 'analytics' | 'verification' | 'integration';
  pricing: {
    model: 'subscription' | 'usage' | 'enterprise';
    startingPrice?: number;
    currency: string;
  };
  features: string[];
  targetAudience: string[];
}

interface B2BAnalytics {
  inquiries: {
    total: number;
    thisMonth: number;
    conversionRate: number;
    averageResponseTime: number; // hours
  };
  leadSources: Array<{
    source: string;
    count: number;
    percentage: number;
  }>;
  industryBreakdown: Array<{
    industry: string;
    count: number;
    percentage: number;
  }>;
  companySizeBreakdown: Array<{
    size: string;
    count: number;
    percentage: number;
  }>;
}

// Helper functions
const generateInquiryId = (): string => {
  return `INQ_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
};

const getB2BProducts = (): B2BProduct[] => [
  {
    id: 'property-api',
    name: 'Property Data API',
    description: 'Comprehensive property data and verification API for real estate platforms',
    category: 'api',
    pricing: {
      model: 'usage',
      startingPrice: 0.10,
      currency: 'USD'
    },
    features: [
      'Property verification',
      'Market data',
      'Historical records',
      'Real-time updates',
      'Fraud detection'
    ],
    targetAudience: ['Real Estate Platforms', 'PropTech Companies', 'Financial Institutions']
  },
  {
    id: 'verification-platform',
    name: 'Document Verification Platform',
    description: 'AI-powered document authentication and verification system',
    category: 'verification',
    pricing: {
      model: 'subscription',
      startingPrice: 299,
      currency: 'USD'
    },
    features: [
      'AI document analysis',
      'Fraud detection',
      'Compliance reporting',
      'API integration',
      'Custom workflows'
    ],
    targetAudience: ['Legal Firms', 'Government Agencies', 'Financial Services']
  },
  {
    id: 'trust-analytics',
    name: 'Trust & Risk Analytics',
    description: 'Advanced analytics platform for trust scoring and risk assessment',
    category: 'analytics',
    pricing: {
      model: 'enterprise',
      currency: 'USD'
    },
    features: [
      'Trust scoring algorithms',
      'Risk assessment models',
      'Predictive analytics',
      'Custom dashboards',
      'Real-time monitoring'
    ],
    targetAudience: ['Insurance Companies', 'Banks', 'Investment Firms']
  }
];

// Sales inquiry submission
router.post('/sales-inquiry', (req: Request, res: Response) => {
  const {
    companyName,
    contactName,
    email,
    phone,
    companySize,
    industry,
    interestedProducts,
    message,
    budget,
    timeline,
    source = 'website'
  } = req.body;
  
  // Validate required fields
  if (!companyName || !contactName || !email || !message) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Company name, contact name, email, and message are required'
    });
  }
  
  // Determine priority based on company size and budget
  let priority: SalesInquiry['priority'] = 'medium';
  if (companySize === 'enterprise' || (budget && parseInt(budget) > 10000)) {
    priority = 'high';
  } else if (companySize === 'startup' || companySize === 'small') {
    priority = 'low';
  }
  
  const inquiry: SalesInquiry = {
    id: generateInquiryId(),
    companyName,
    contactName,
    email,
    phone,
    companySize: companySize || 'medium',
    industry: industry || 'Other',
    interestedProducts: interestedProducts || [],
    message,
    budget,
    timeline,
    source,
    status: 'new',
    priority,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    followUpDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
  };
  
  // In a real implementation, this would:
  // 1. Save to database
  // 2. Send notification to sales team
  // 3. Send confirmation email to prospect
  // 4. Create CRM entry
  
  res.status(201).json({
    success: true,
    data: {
      inquiryId: inquiry.id,
      status: inquiry.status,
      priority: inquiry.priority,
      estimatedResponseTime: '24 hours',
      nextSteps: [
        'Our sales team will review your inquiry',
        'You will receive a confirmation email shortly',
        'A sales representative will contact you within 24 hours',
        'We will schedule a discovery call to understand your needs'
      ]
    },
    message: 'Sales inquiry submitted successfully'
  });
});

// Get B2B products catalog
router.get('/products', (req: Request, res: Response) => {
  const { category, targetAudience } = req.query;
  
  let products = getB2BProducts();
  
  if (category) {
    products = products.filter(p => p.category === category);
  }
  
  if (targetAudience) {
    products = products.filter(p => 
      p.targetAudience.some(audience => 
        audience.toLowerCase().includes((targetAudience as string).toLowerCase())
      )
    );
  }
  
  res.json({
    success: true,
    data: products,
    categories: ['api', 'platform', 'analytics', 'verification', 'integration'],
    filters: { category, targetAudience }
  });
});

// Get specific product details
router.get('/products/:productId', (req: Request, res: Response) => {
  const { productId } = req.params;
  const products = getB2BProducts();
  const product = products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      error: 'Product not found',
      message: `Product with ID ${productId} does not exist`
    });
  }
  
  // Add additional details for specific product
  const productDetails = {
    ...product,
    documentation: {
      apiReference: `/docs/api/${productId}`,
      gettingStarted: `/docs/getting-started/${productId}`,
      examples: `/docs/examples/${productId}`,
      sdks: ['JavaScript', 'Python', 'PHP', 'Java', 'C#']
    },
    support: {
      sla: '99.9% uptime',
      responseTime: '< 2 hours',
      channels: ['Email', 'Chat', 'Phone'],
      documentation: 'Comprehensive API docs and tutorials'
    },
    compliance: ['SOC 2', 'GDPR', 'CCPA', 'ISO 27001'],
    integrations: ['Salesforce', 'HubSpot', 'Zapier', 'Webhook', 'REST API'],
    testimonials: [
      {
        company: 'TechCorp Real Estate',
        quote: 'This API transformed our property verification process',
        author: 'John Smith, CTO'
      },
      {
        company: 'PropData Solutions',
        quote: 'Excellent reliability and comprehensive data coverage',
        author: 'Sarah Johnson, Product Manager'
      }
    ]
  };
  
  res.json({
    success: true,
    data: productDetails
  });
});

// Request product demo
router.post('/products/:productId/demo', (req: Request, res: Response) => {
  const { productId } = req.params;
  const { companyName, contactName, email, phone, preferredTime, useCase } = req.body;
  
  if (!companyName || !contactName || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Company name, contact name, and email are required'
    });
  }
  
  const demoRequest = {
    id: `DEMO_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    productId,
    companyName,
    contactName,
    email,
    phone,
    preferredTime,
    useCase,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    scheduledFor: preferredTime || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  res.status(201).json({
    success: true,
    data: demoRequest,
    message: 'Demo request submitted successfully',
    nextSteps: [
      'Demo request has been received',
      'Our team will contact you to confirm the schedule',
      'You will receive a calendar invitation',
      'Demo materials will be prepared based on your use case'
    ]
  });
});

// Get pricing information
router.get('/pricing', (req: Request, res: Response) => {
  const { product, companySize, volume } = req.query;
  
  const pricingPlans = {
    'property-api': {
      starter: {
        name: 'Starter',
        price: 99,
        currency: 'USD',
        billing: 'monthly',
        requests: 10000,
        features: ['Basic property data', 'Email support', 'API access']
      },
      professional: {
        name: 'Professional',
        price: 299,
        currency: 'USD',
        billing: 'monthly',
        requests: 50000,
        features: ['Full property data', 'Verification API', 'Priority support', 'Webhooks']
      },
      enterprise: {
        name: 'Enterprise',
        price: 'Custom',
        currency: 'USD',
        billing: 'annual',
        requests: 'Unlimited',
        features: ['All features', 'Custom integrations', 'Dedicated support', 'SLA guarantee']
      }
    },
    'verification-platform': {
      basic: {
        name: 'Basic',
        price: 199,
        currency: 'USD',
        billing: 'monthly',
        documents: 1000,
        features: ['Document verification', 'Basic fraud detection', 'Email support']
      },
      advanced: {
        name: 'Advanced',
        price: 499,
        currency: 'USD',
        billing: 'monthly',
        documents: 5000,
        features: ['AI verification', 'Advanced fraud detection', 'API access', 'Priority support']
      },
      enterprise: {
        name: 'Enterprise',
        price: 'Custom',
        currency: 'USD',
        billing: 'annual',
        documents: 'Unlimited',
        features: ['All features', 'Custom workflows', 'Dedicated support', 'On-premise option']
      }
    }
  };
  
  let pricing = pricingPlans;
  
  if (product && pricingPlans[product as keyof typeof pricingPlans]) {
    pricing = { [product as string]: pricingPlans[product as keyof typeof pricingPlans] };
  }
  
  res.json({
    success: true,
    data: pricing,
    discounts: {
      annual: '20% off annual plans',
      volume: 'Volume discounts available for enterprise',
      nonprofit: '50% off for qualified nonprofits'
    },
    additionalInfo: {
      freeTrial: '14-day free trial available',
      setupFee: 'No setup fees',
      cancellation: 'Cancel anytime',
      support: '24/7 support for enterprise plans'
    }
  });
});

// Get B2B analytics (internal use)
router.get('/analytics', (req: Request, res: Response) => {
  // This would typically require admin authentication
  const analytics: B2BAnalytics = {
    inquiries: {
      total: Math.floor(Math.random() * 1000) + 500,
      thisMonth: Math.floor(Math.random() * 100) + 50,
      conversionRate: Math.random() * 20 + 15, // 15-35%
      averageResponseTime: Math.random() * 12 + 2 // 2-14 hours
    },
    leadSources: [
      { source: 'Website', count: 45, percentage: 45 },
      { source: 'Referral', count: 25, percentage: 25 },
      { source: 'Social Media', count: 15, percentage: 15 },
      { source: 'Email Campaign', count: 10, percentage: 10 },
      { source: 'Other', count: 5, percentage: 5 }
    ],
    industryBreakdown: [
      { industry: 'Real Estate', count: 40, percentage: 40 },
      { industry: 'Financial Services', count: 25, percentage: 25 },
      { industry: 'PropTech', count: 20, percentage: 20 },
      { industry: 'Legal', count: 10, percentage: 10 },
      { industry: 'Other', count: 5, percentage: 5 }
    ],
    companySizeBreakdown: [
      { size: 'Enterprise', count: 30, percentage: 30 },
      { size: 'Large', count: 25, percentage: 25 },
      { size: 'Medium', count: 25, percentage: 25 },
      { size: 'Small', count: 15, percentage: 15 },
      { size: 'Startup', count: 5, percentage: 5 }
    ]
  };
  
  res.json({
    success: true,
    data: analytics,
    generatedAt: new Date().toISOString()
  });
});

// Subscribe to newsletter/updates
router.post('/newsletter', (req: Request, res: Response) => {
  const { email, companyName, interests } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'Email is required'
    });
  }
  
  res.json({
    success: true,
    data: {
      email,
      companyName,
      interests: interests || [],
      subscribedAt: new Date().toISOString(),
      status: 'subscribed'
    },
    message: 'Successfully subscribed to updates'
  });
});

export { router as b2bRouter };