"use strict";
/**
 * COMPREHENSIVE IMAGE ASSET CONFIGURATION
 * ======================================
 *
 * Centralized configuration for all image assets in the TripleCheck application.
 * This system provides type-safe access to all images with optimized loading strategies,
 * WebP support, and responsive image handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.cssClassMappings = exports.loadingStrategies = exports.images = exports.decorativeAssets = exports.blogAssets = exports.customerAssets = exports.propertyAssets = exports.heroAssets = exports.brandAssets = void 0;
exports.getBestImageSrc = getBestImageSrc;
exports.getFallbackImageSrc = getFallbackImageSrc;
exports.generateSrcSet = generateSrcSet;
exports.getLogoSrc = getLogoSrc;
exports.getCustomerAvatar = getCustomerAvatar;
exports.getPropertySample = getPropertySample;
exports.getBlogImage = getBlogImage;
/**
 * BRAND ASSETS
 * ============
 * Primary brand elements including logos and icons
 */
exports.brandAssets = {
    logo: {
        svg: '/assets/Artmark.svg',
        ico: '/assets/TripleCheck.ico',
        alt: 'TripleCheck - Secure Real Estate Verification',
        sizes: {
            small: { width: 24, height: 24 },
            medium: { width: 32, height: 32 },
            large: { width: 48, height: 48 },
            xl: { width: 64, height: 64 }
        }
    },
    favicon: {
        ico: '/assets/Artmark.svg',
        alt: 'TripleCheck Favicon'
    }
};
/**
 * HERO SECTION ASSETS
 * ==================
 * Large format images for hero sections and landing pages
 */
exports.heroAssets = {
    primary: {
        webp: '/assets/hero-bg.webp',
        jpg: '/assets/hero-bg.jpg',
        alt: 'African Property Trust - Verified Real Estate Platform',
        aspectRatio: '16/9'
    }
};
/**
 * PROPERTY SAMPLE ASSETS
 * =====================
 * High-quality property images for demonstrations and placeholders
 */
exports.propertyAssets = {
    placeholder: {
        jpg: '/assets/alice-pasqual-Olki5QpHxts-unsplash.jpg',
        alt: 'Modern residential property exterior',
        aspectRatio: '4/3'
    },
    sample1: {
        jpg: '/assets/diogo-brandao-cUXK9-kQfy4-unsplash.jpg',
        alt: 'Contemporary apartment building',
        aspectRatio: '4/3'
    },
    sample2: {
        jpg: '/assets/elizeu-dias-2EGNqazbAMk-unsplash.jpg',
        alt: 'Luxury residential complex',
        aspectRatio: '4/3'
    },
    sample3: {
        jpg: '/assets/maria-fernanda-pissioli-6BOGBGy2-sU-unsplash.jpg',
        alt: 'Modern commercial property',
        aspectRatio: '4/3'
    },
    sample4: {
        jpg: '/assets/e-fedorzyn-dS3qN-_VWuk-unsplash.jpg',
        alt: 'Urban residential development',
        aspectRatio: '4/3'
    },
    sample5: {
        jpg: '/assets/etty-fidele-YYfzJhfNU14-unsplash.jpg',
        alt: 'Premium property exterior',
        aspectRatio: '4/3'
    }
};
/**
 * CUSTOMER & TESTIMONIAL ASSETS
 * =============================
 * Professional portraits for testimonials and user profiles
 */
exports.customerAssets = {
    customer1: {
        png: '/assets/customer1.png',
        alt: 'Sarah Johnson - Property Investor',
        aspectRatio: '1/1'
    },
    customer2: {
        png: '/assets/customer2.png',
        alt: 'Michael Chen - Real Estate Agent',
        aspectRatio: '1/1'
    },
    customer3: {
        png: '/assets/customer3.png',
        alt: 'Grace Wanjiku - First-time Buyer',
        aspectRatio: '1/1'
    },
    entrepreneur: {
        jpg: '/assets/confident-entrepreneur-looking-camera-with-arms-folded-smiling.jpg',
        alt: 'Confident business professional',
        aspectRatio: '4/5'
    },
    africanPortrait: {
        jpg: '/assets/depositphotos_68088663-stock-photo-portrait-of-a-young-african.jpg',
        alt: 'Young African professional',
        aspectRatio: '4/5'
    }
};
/**
 * BLOG & CONTENT ASSETS
 * =====================
 * Images for blog posts, articles, and content sections
 */
exports.blogAssets = {
    post1: {
        webp: '/assets/blog1.webp',
        jpg: '/assets/blog1.jpg',
        alt: 'Real Estate Market Trends in Africa',
        aspectRatio: '16/9'
    },
    post2: {
        webp: '/assets/blog2.webp',
        jpg: '/assets/blog2.jpg',
        alt: 'Property Verification Best Practices',
        aspectRatio: '16/9'
    },
    post3: {
        webp: '/assets/blog3.webp',
        jpg: '/assets/blog3.jpg',
        alt: 'Investment Opportunities in African Real Estate',
        aspectRatio: '16/9'
    }
};
/**
 * DECORATIVE & UI ASSETS
 * ======================
 * Supporting graphics and decorative elements
 */
exports.decorativeAssets = {
    fun: {
        png: '/assets/fun.png',
        alt: 'Decorative element',
        aspectRatio: '1/1'
    }
};
/**
 * CONSOLIDATED IMAGE CONFIGURATION
 * ===============================
 * Main export combining all asset categories
 */
exports.images = {
    brand: exports.brandAssets,
    hero: exports.heroAssets,
    properties: exports.propertyAssets,
    customers: exports.customerAssets,
    blog: exports.blogAssets,
    decorative: exports.decorativeAssets
};
/**
 * UTILITY FUNCTIONS
 * ================
 * Helper functions for working with image assets
 */
/**
 * Get the best available image format for a given asset
 * Prioritizes WebP for modern browsers with fallback to JPG/PNG
 */
function getBestImageSrc(asset) {
    if (asset.webp && supportsWebP()) {
        return asset.webp;
    }
    return asset.jpg || asset.png || asset.svg || '';
}
/**
 * Get fallback image source for older browsers
 */
function getFallbackImageSrc(asset) {
    return asset.jpg || asset.png || asset.svg || '';
}
/**
 * Check if browser supports WebP format
 */
function supportsWebP() {
    if (typeof window === 'undefined')
        return false;
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}
/**
 * Generate srcSet for responsive images
 */
function generateSrcSet(basePath, sizes) {
    if (sizes === void 0) { sizes = [400, 800, 1200]; }
    return sizes
        .map(function (size) { return "".concat(basePath, "?w=").concat(size, " ").concat(size, "w"); })
        .join(', ');
}
/**
 * Get logo source for specific size
 */
function getLogoSrc(size) {
    if (size === void 0) { size = 'medium'; }
    return exports.brandAssets.logo.svg;
}
/**
 * Get customer avatar source
 */
function getCustomerAvatar(customerId) {
    var customer = exports.customerAssets[customerId];
    return customer.png || customer.jpg || '';
}
/**
 * Get property sample image
 */
function getPropertySample(sampleId) {
    var property = exports.propertyAssets[sampleId];
    return property.jpg || '';
}
/**
 * Get blog post image with WebP support
 */
function getBlogImage(postId) {
    var post = exports.blogAssets[postId];
    return {
        webp: post.webp,
        fallback: post.jpg || '',
        alt: post.alt
    };
}
/**
 * IMAGE LOADING STRATEGIES
 * ========================
 * Optimized loading configurations for different use cases
 */
exports.loadingStrategies = {
    hero: {
        loading: 'eager',
        fetchPriority: 'high',
        decoding: 'sync'
    },
    aboveFold: {
        loading: 'eager',
        fetchPriority: 'high',
        decoding: 'async'
    },
    belowFold: {
        loading: 'lazy',
        fetchPriority: 'low',
        decoding: 'async'
    },
    avatar: {
        loading: 'lazy',
        fetchPriority: 'low',
        decoding: 'async'
    }
};
/**
 * CSS CLASS MAPPINGS
 * ==================
 * Map image assets to corresponding CSS classes
 */
exports.cssClassMappings = {
    // Logo classes
    'logo-small': exports.brandAssets.logo.svg,
    'logo-primary': exports.brandAssets.logo.svg,
    'logo-large': exports.brandAssets.logo.svg,
    'logo-xl': exports.brandAssets.logo.svg,
    // Hero backgrounds
    'hero-bg': exports.heroAssets.primary.webp,
    'hero-bg-fallback': exports.heroAssets.primary.jpg,
    // Property samples
    'property-placeholder': exports.propertyAssets.placeholder.jpg,
    'property-sample-1': exports.propertyAssets.sample1.jpg,
    'property-sample-2': exports.propertyAssets.sample2.jpg,
    'property-sample-3': exports.propertyAssets.sample3.jpg,
    'property-sample-4': exports.propertyAssets.sample4.jpg,
    'property-sample-5': exports.propertyAssets.sample5.jpg,
    // Customer avatars
    'customer-1': exports.customerAssets.customer1.png,
    'customer-2': exports.customerAssets.customer2.png,
    'customer-3': exports.customerAssets.customer3.png,
    // Blog images
    'blog-1-webp': exports.blogAssets.post1.webp,
    'blog-1-fallback': exports.blogAssets.post1.jpg,
    'blog-2-webp': exports.blogAssets.post2.webp,
    'blog-2-fallback': exports.blogAssets.post2.jpg,
    'blog-3-webp': exports.blogAssets.post3.webp,
    'blog-3-fallback': exports.blogAssets.post3.jpg
};
