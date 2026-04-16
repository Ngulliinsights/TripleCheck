"use strict";
/**
 * Centralized Asset Management System
 *
 * This file provides a single source of truth for all assets used throughout
 * the TripleCheck application. It ensures consistent asset usage, enables
 * easy updates, and provides type safety for asset references.
 *
 * Integrates with the comprehensive image configuration system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRITICAL_ASSETS = exports.TESTIMONIALS = exports.BLOG_POSTS = exports.HERO_VARIANTS = exports.CUSTOMER_IMAGES = exports.BLOG_IMAGES = exports.HERO_BACKGROUNDS = exports.LOGOS = void 0;
exports.getOptimizedImage = getOptimizedImage;
exports.validateAssetPath = validateAssetPath;
exports.getOptimizedAsset = getOptimizedAsset;
exports.getBestAssetSrc = getBestAssetSrc;
exports.getResponsiveImageSizes = getResponsiveImageSizes;
// Import comprehensive image system for integration
var images_1 = require("./images");
// Asset base paths
var ASSET_PATHS = {
    images: '/assets',
    icons: '/assets',
    logos: '/assets'
};
// Logo assets with variants
exports.LOGOS = {
    primary: "".concat(ASSET_PATHS.logos, "/Artmark.svg"),
    favicon: "/assets/Artmark.svg"
};
// Hero background images for different variants
exports.HERO_BACKGROUNDS = {
    default: "".concat(ASSET_PATHS.images, "/hero-bg.webp"),
    fallback: "".concat(ASSET_PATHS.images, "/hero-bg.jpg"),
    premium: "".concat(ASSET_PATHS.images, "/elizeu-dias-2EGNqazbAMk-unsplash.jpg"),
    warm: "".concat(ASSET_PATHS.images, "/maria-fernanda-pissioli-6BOGBGy2-sU-unsplash.jpg"),
    professional: "".concat(ASSET_PATHS.images, "/alice-pasqual-Olki5QpHxts-unsplash.jpg"),
    modern: "".concat(ASSET_PATHS.images, "/diogo-brandao-cUXK9-kQfy4-unsplash.jpg"),
    elegant: "".concat(ASSET_PATHS.images, "/e-fedorzyn-dS3qN-_VWuk-unsplash.jpg"),
    vibrant: "".concat(ASSET_PATHS.images, "/etty-fidele-YYfzJhfNU14-unsplash.jpg")
};
// Blog and content images
exports.BLOG_IMAGES = {
    post1: {
        webp: "".concat(ASSET_PATHS.images, "/blog1.webp"),
        jpg: "".concat(ASSET_PATHS.images, "/blog1.jpg"),
        alt: 'Real estate market trends and analysis'
    },
    post2: {
        webp: "".concat(ASSET_PATHS.images, "/blog2.webp"),
        jpg: "".concat(ASSET_PATHS.images, "/blog2.jpg"),
        alt: 'Property verification best practices'
    },
    post3: {
        webp: "".concat(ASSET_PATHS.images, "/blog3.webp"),
        jpg: "".concat(ASSET_PATHS.images, "/blog3.jpg"),
        alt: 'Fraud prevention in real estate'
    }
};
// Customer testimonial images
exports.CUSTOMER_IMAGES = {
    customer1: {
        src: "".concat(ASSET_PATHS.images, "/customer1.png"),
        alt: 'Sarah Johnson - Property Owner',
        name: 'Sarah Johnson',
        role: 'Property Owner'
    },
    customer2: {
        src: "".concat(ASSET_PATHS.images, "/customer2.png"),
        alt: 'Michael Chen - Real Estate Agent',
        name: 'Michael Chen',
        role: 'Real Estate Agent'
    },
    customer3: {
        src: "".concat(ASSET_PATHS.images, "/customer3.png"),
        alt: 'Amara Okafor - First-time Buyer',
        name: 'Amara Okafor',
        role: 'First-time Buyer'
    },
    professional: {
        src: "".concat(ASSET_PATHS.images, "/confident-entrepreneur-looking-camera-with-arms-folded-smiling.jpg"),
        alt: 'Professional real estate expert',
        name: 'David Martinez',
        role: 'Senior Property Consultant'
    },
    diverse: {
        src: "".concat(ASSET_PATHS.images, "/depositphotos_68088663-stock-photo-portrait-of-a-young-african.jpg"),
        alt: 'Young professional in real estate',
        name: 'Kwame Asante',
        role: 'Property Investment Advisor'
    }
};
// Utility function to get optimized image with fallback
function getOptimizedImage(webpSrc, fallbackSrc, alt) {
    return {
        webp: webpSrc,
        fallback: fallbackSrc,
        alt: alt
    };
}
// Hero variant configurations with proper asset integration
exports.HERO_VARIANTS = {
    A: {
        id: 'trust-focused',
        title: 'Verified. Transparent. Trusted.',
        subtitle: 'Your trusted partner in real estate verification.',
        backgroundImage: exports.HERO_BACKGROUNDS.default,
        fallbackImage: exports.HERO_BACKGROUNDS.fallback,
        ctaText: 'Start Verification',
        theme: 'trust'
    },
    B: {
        id: 'premium-focused',
        title: 'Premium Property Intelligence',
        subtitle: 'Unlock exclusive insights and verified listings from our network of trusted real estate professionals.',
        backgroundImage: exports.HERO_BACKGROUNDS.premium,
        fallbackImage: exports.HERO_BACKGROUNDS.default,
        ctaText: 'Explore Premium',
        theme: 'premium'
    },
    C: {
        id: 'warm-focused',
        title: 'Find Your Perfect Home',
        subtitle: 'Discover verified properties with confidence. Our comprehensive verification process ensures every listing is authentic.',
        backgroundImage: exports.HERO_BACKGROUNDS.warm,
        fallbackImage: exports.HERO_BACKGROUNDS.default,
        ctaText: 'Find Properties',
        theme: 'warm'
    },
    D: {
        id: 'professional-focused',
        title: 'Professional Property Services',
        subtitle: 'Connect with verified professionals and access premium property insights.',
        backgroundImage: exports.HERO_BACKGROUNDS.professional,
        fallbackImage: exports.HERO_BACKGROUNDS.default,
        ctaText: 'Get Started',
        theme: 'trust'
    }
};
// Blog post configurations with proper asset integration
exports.BLOG_POSTS = [
    {
        id: 'market-trends-2024',
        title: 'Real Estate Market Trends for 2024',
        excerpt: 'Discover the latest trends shaping the real estate market and how they affect property verification.',
        image: exports.BLOG_IMAGES.post1,
        author: 'Sarah Mitchell',
        date: '2024-01-15',
        readTime: '5 min read',
        category: 'Market Analysis'
    },
    {
        id: 'verification-best-practices',
        title: 'Property Verification Best Practices',
        excerpt: 'Learn the essential steps to verify property authenticity and protect yourself from fraud.',
        image: exports.BLOG_IMAGES.post2,
        author: 'James Rodriguez',
        date: '2024-01-10',
        readTime: '7 min read',
        category: 'Verification Guide'
    },
    {
        id: 'fraud-prevention-guide',
        title: 'Complete Guide to Real Estate Fraud Prevention',
        excerpt: 'Comprehensive strategies to identify and prevent real estate fraud in today\'s market.',
        image: exports.BLOG_IMAGES.post3,
        author: 'Dr. Emily Watson',
        date: '2024-01-05',
        readTime: '10 min read',
        category: 'Security'
    }
];
// Customer testimonials with proper asset integration
exports.TESTIMONIALS = [
    {
        id: 'sarah-johnson',
        name: exports.CUSTOMER_IMAGES.customer1.name,
        role: exports.CUSTOMER_IMAGES.customer1.role,
        image: exports.CUSTOMER_IMAGES.customer1,
        rating: 5,
        text: "TripleCheck saved me from a fraudulent listing. Their verification process is thorough and gave me complete peace of mind.",
        location: "Nairobi, Kenya",
        verified: true
    },
    {
        id: 'michael-chen',
        name: exports.CUSTOMER_IMAGES.customer2.name,
        role: exports.CUSTOMER_IMAGES.customer2.role,
        image: exports.CUSTOMER_IMAGES.customer2,
        rating: 5,
        text: "As a real estate agent, TripleCheck has become an essential tool for building trust with my clients. Highly recommended!",
        location: "Mombasa, Kenya",
        verified: true
    },
    {
        id: 'amara-okafor',
        name: exports.CUSTOMER_IMAGES.customer3.name,
        role: exports.CUSTOMER_IMAGES.customer3.role,
        image: exports.CUSTOMER_IMAGES.customer3,
        rating: 5,
        text: "The verification report was detailed and easy to understand. It helped me make an informed decision on my first property purchase.",
        location: "Kisumu, Kenya",
        verified: true
    },
    {
        id: 'david-martinez',
        name: exports.CUSTOMER_IMAGES.professional.name,
        role: exports.CUSTOMER_IMAGES.professional.role,
        image: exports.CUSTOMER_IMAGES.professional,
        rating: 5,
        text: "TripleCheck's fraud detection capabilities are impressive. It's become an integral part of our due diligence process.",
        location: "Eldoret, Kenya",
        verified: true
    },
    {
        id: 'kwame-asante',
        name: exports.CUSTOMER_IMAGES.diverse.name,
        role: exports.CUSTOMER_IMAGES.diverse.role,
        image: exports.CUSTOMER_IMAGES.diverse,
        rating: 5,
        text: "The platform's transparency and verification standards have revolutionized how we approach property investments.",
        location: "Nakuru, Kenya",
        verified: true
    }
];
// Asset preloading configuration for performance
exports.CRITICAL_ASSETS = {
    // Above-the-fold images that should be preloaded
    hero: [
        exports.HERO_BACKGROUNDS.default,
        exports.HERO_BACKGROUNDS.fallback
    ],
    logos: [
        exports.LOGOS.primary
    ],
    // Customer images for testimonials section
    testimonials: [
        exports.CUSTOMER_IMAGES.customer1.src,
        exports.CUSTOMER_IMAGES.customer2.src,
        exports.CUSTOMER_IMAGES.customer3.src
    ]
};
// Asset validation helper
function validateAssetPath(path) {
    return path.startsWith('/assets/') && (path.endsWith('.jpg') ||
        path.endsWith('.jpeg') ||
        path.endsWith('.png') ||
        path.endsWith('.webp') ||
        path.endsWith('.svg') ||
        path.endsWith('.ico'));
}
// Integration with comprehensive image system
function getOptimizedAsset(assetKey, category) {
    var categoryAssets = images_1.images[category];
    var asset = categoryAssets === null || categoryAssets === void 0 ? void 0 : categoryAssets[assetKey];
    if (!asset)
        return null;
    return {
        webp: asset.webp,
        jpg: asset.jpg,
        png: asset.png,
        svg: asset.svg,
        alt: asset.alt,
        aspectRatio: asset.aspectRatio
    };
}
// Bridge function to use comprehensive image system
function getBestAssetSrc(assetKey, category) {
    var asset = getOptimizedAsset(assetKey, category);
    return asset ? (0, images_1.getBestImageSrc)(asset) : '';
}
// Asset optimization helper
function getResponsiveImageSizes(baseWidth) {
    if (baseWidth === void 0) { baseWidth = 1200; }
    return "(max-width: 640px) ".concat(Math.round(baseWidth * 0.5), "px, (max-width: 1024px) ").concat(Math.round(baseWidth * 0.75), "px, ").concat(baseWidth, "px");
}
