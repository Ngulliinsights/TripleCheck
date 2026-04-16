"use strict";
/**
 * User Journey Mapping System
 *
 * This file defines the strategic user journeys and conversion paths
 * for different user types visiting the TripleCheck platform.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JOURNEY_TRACKING = exports.PAGE_CONVERSION_CONFIG = exports.CONVERSION_FUNNELS = exports.USER_JOURNEYS = void 0;
// Primary User Journeys
exports.USER_JOURNEYS = [
    {
        id: 'property-buyer-verification',
        name: 'Property Buyer Verification Journey',
        description: 'First-time buyer looking to verify a property before purchase',
        userType: 'buyer',
        entryPoints: [
            '/',
            '/services/basic-checks',
            '/services/fraud-detection',
            '/search'
        ],
        conversionGoals: [
            'Complete property verification',
            'Sign up for account',
            'Purchase verification report'
        ],
        keyPages: [
            {
                page: '/',
                purpose: 'Build trust and explain value proposition',
                nextSteps: ['/services/basic-checks', '/pricing', '/auth/register'],
                conversionTriggers: ['Free verification offer', 'Success stories', 'Risk examples'],
                exitRisks: ['Unclear pricing', 'Complex process', 'Lack of social proof']
            },
            {
                page: '/services/basic-checks',
                purpose: 'Demonstrate verification process and build confidence',
                nextSteps: ['/pricing', '/auth/register', '/services/fraud-detection'],
                conversionTriggers: ['Step-by-step process', 'Sample reports', 'Instant results'],
                exitRisks: ['Too technical', 'Expensive perception', 'Time concerns']
            },
            {
                page: '/pricing',
                purpose: 'Convert to paid verification service',
                nextSteps: ['/auth/register', '/services/basic-checks'],
                conversionTriggers: ['Money-back guarantee', 'Limited-time offer', 'Risk comparison'],
                exitRisks: ['Price shock', 'Unclear value', 'No trial option']
            }
        ],
        ctaSequence: [
            'Start Free Check',
            'Get Verification Report',
            'Secure Your Purchase',
            'Complete Verification'
        ]
    },
    {
        id: 'property-seller-listing',
        name: 'Property Seller Listing Journey',
        description: 'Property owner wanting to list verified property for sale',
        userType: 'seller',
        entryPoints: [
            '/',
            '/services/list-property',
            '/solutions/sellers',
            '/pricing'
        ],
        conversionGoals: [
            'List verified property',
            'Complete seller verification',
            'Subscribe to seller plan'
        ],
        keyPages: [
            {
                page: '/solutions/sellers',
                purpose: 'Show benefits of verified listings and increased trust',
                nextSteps: ['/services/list-property', '/pricing', '/auth/register'],
                conversionTriggers: ['Higher sale prices', 'Faster sales', 'Buyer confidence'],
                exitRisks: ['Complex verification', 'High costs', 'Time investment']
            },
            {
                page: '/services/list-property',
                purpose: 'Guide through property listing and verification process',
                nextSteps: ['/auth/register', '/pricing', '/dashboard'],
                conversionTriggers: ['Easy upload process', 'Instant verification', 'Professional presentation'],
                exitRisks: ['Technical difficulties', 'Document requirements', 'Verification delays']
            }
        ],
        ctaSequence: [
            'List Your Property',
            'Start Verification',
            'Publish Listing',
            'Manage Properties'
        ]
    },
    {
        id: 'real-estate-agent-tools',
        name: 'Real Estate Agent Professional Tools Journey',
        description: 'Real estate agent seeking professional verification tools',
        userType: 'agent',
        entryPoints: [
            '/solutions/agents',
            '/pricing',
            '/services',
            '/features'
        ],
        conversionGoals: [
            'Sign up for agent account',
            'Subscribe to professional plan',
            'Integrate verification tools'
        ],
        keyPages: [
            {
                page: '/solutions/agents',
                purpose: 'Demonstrate professional tools and competitive advantages',
                nextSteps: ['/pricing', '/auth/register', '/features'],
                conversionTriggers: ['Client trust building', 'Competitive edge', 'Professional credibility'],
                exitRisks: ['Complex integration', 'High learning curve', 'Cost concerns']
            }
        ],
        ctaSequence: [
            'Join Agent Network',
            'Start Free Trial',
            'Upgrade to Pro',
            'Integrate Tools'
        ]
    },
    {
        id: 'developer-project-verification',
        name: 'Developer Project Verification Journey',
        description: 'Property developer needing project and document verification',
        userType: 'developer',
        entryPoints: [
            '/solutions/developers',
            '/services/document-auth',
            '/pricing',
            '/contact'
        ],
        conversionGoals: [
            'Verify development project',
            'Subscribe to enterprise plan',
            'Establish ongoing partnership'
        ],
        keyPages: [
            {
                page: '/solutions/developers',
                purpose: 'Show enterprise-level verification and compliance benefits',
                nextSteps: ['/contact', '/pricing', '/services/document-auth'],
                conversionTriggers: ['Regulatory compliance', 'Investor confidence', 'Risk mitigation'],
                exitRisks: ['Enterprise complexity', 'Integration challenges', 'Budget constraints']
            }
        ],
        ctaSequence: [
            'Schedule Demo',
            'Get Custom Quote',
            'Start Enterprise Trial',
            'Deploy Solution'
        ]
    }
];
// Conversion Funnel Configuration
exports.CONVERSION_FUNNELS = {
    awareness: {
        pages: ['/', '/blog', '/about', '/features'],
        metrics: ['page_views', 'time_on_page', 'bounce_rate'],
        goals: ['newsletter_signup', 'social_follow', 'content_engagement']
    },
    interest: {
        pages: ['/services', '/pricing', '/solutions/*'],
        metrics: ['page_depth', 'cta_clicks', 'demo_requests'],
        goals: ['pricing_page_visit', 'service_exploration', 'comparison_usage']
    },
    consideration: {
        pages: ['/pricing', '/help', '/contact', '/auth/register'],
        metrics: ['form_starts', 'support_contacts', 'trial_signups'],
        goals: ['account_creation', 'trial_start', 'consultation_booking']
    },
    conversion: {
        pages: ['/dashboard', '/services/*/checkout', '/auth/login'],
        metrics: ['payment_completion', 'service_usage', 'feature_adoption'],
        goals: ['paid_subscription', 'service_purchase', 'active_usage']
    },
    retention: {
        pages: ['/dashboard', '/inbox', '/properties', '/team'],
        metrics: ['login_frequency', 'feature_usage', 'support_satisfaction'],
        goals: ['monthly_active_usage', 'feature_expansion', 'referral_generation']
    }
};
// Page-specific conversion optimization
exports.PAGE_CONVERSION_CONFIG = {
    '/': {
        primaryCTA: 'Start Free Verification',
        secondaryCTA: 'View Pricing',
        conversionElements: ['hero_cta', 'features_cta', 'testimonials_cta', 'pricing_preview'],
        exitIntentOffer: 'Get 50% off your first verification'
    },
    '/pricing': {
        primaryCTA: 'Start Free Trial',
        secondaryCTA: 'Contact Sales',
        conversionElements: ['plan_selection', 'feature_comparison', 'money_back_guarantee'],
        exitIntentOffer: 'Schedule a free consultation'
    },
    '/services/basic-checks': {
        primaryCTA: 'Start Verification Now',
        secondaryCTA: 'See Sample Report',
        conversionElements: ['process_steps', 'sample_report', 'instant_results'],
        exitIntentOffer: 'Try one free verification'
    },
    '/services/list-property': {
        primaryCTA: 'List Property Now',
        secondaryCTA: 'Learn More',
        conversionElements: ['upload_form', 'verification_preview', 'listing_benefits'],
        exitIntentOffer: 'Free property valuation included'
    }
};
// Cross-page journey tracking
exports.JOURNEY_TRACKING = {
    entryPointMapping: {
        organic_search: ['/', '/services/*', '/pricing'],
        paid_ads: ['/landing/*', '/pricing', '/auth/register'],
        social_media: ['/', '/blog/*', '/about'],
        referral: ['/', '/auth/register?ref=*'],
        direct: ['/', '/dashboard', '/auth/login']
    },
    conversionPaths: [
        ['/', '/services/basic-checks', '/pricing', '/auth/register'],
        ['/', '/pricing', '/auth/register'],
        ['/services/list-property', '/auth/register', '/dashboard'],
        ['/solutions/agents', '/pricing', '/contact'],
        ['/blog/*', '/', '/services/*', '/auth/register']
    ],
    dropOffPoints: [
        '/pricing', // Price sensitivity
        '/auth/register', // Registration friction
        '/services/*/checkout', // Payment friction
        '/help', // Confusion or issues
    ]
};
exports.default = exports.USER_JOURNEYS;
