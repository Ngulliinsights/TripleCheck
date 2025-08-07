/**
 * Centralized Asset Management System
 * 
 * This file provides a single source of truth for all assets used throughout
 * the TripleCheck application. It ensures consistent asset usage, enables
 * easy updates, and provides type safety for asset references.
 * 
 * Integrates with the comprehensive image configuration system
 */

// Import comprehensive image system for integration
import { images, getBestImageSrc } from './images';
import type { ImageAsset } from './images';

// Asset base paths
const ASSET_PATHS = {
  images: '/assets',
  icons: '/assets',
  logos: '/assets'
} as const;

// Logo assets with variants
export const LOGOS = {
  primary: `${ASSET_PATHS.logos}/Artmark.svg`,
  favicon: `/assets/Artmark.svg`
} as const;

// Hero background images for different variants
export const HERO_BACKGROUNDS = {
  default: `${ASSET_PATHS.images}/hero-bg.webp`,
  fallback: `${ASSET_PATHS.images}/hero-bg.jpg`,
  premium: `${ASSET_PATHS.images}/elizeu-dias-2EGNqazbAMk-unsplash.jpg`,
  warm: `${ASSET_PATHS.images}/maria-fernanda-pissioli-6BOGBGy2-sU-unsplash.jpg`,
  professional: `${ASSET_PATHS.images}/alice-pasqual-Olki5QpHxts-unsplash.jpg`,
  modern: `${ASSET_PATHS.images}/diogo-brandao-cUXK9-kQfy4-unsplash.jpg`,
  elegant: `${ASSET_PATHS.images}/e-fedorzyn-dS3qN-_VWuk-unsplash.jpg`,
  vibrant: `${ASSET_PATHS.images}/etty-fidele-YYfzJhfNU14-unsplash.jpg`
} as const;

// Blog and content images
export const BLOG_IMAGES = {
  post1: {
    webp: `${ASSET_PATHS.images}/blog1.webp`,
    jpg: `${ASSET_PATHS.images}/blog1.jpg`,
    alt: 'Real estate market trends and analysis'
  },
  post2: {
    webp: `${ASSET_PATHS.images}/blog2.webp`,
    jpg: `${ASSET_PATHS.images}/blog2.jpg`,
    alt: 'Property verification best practices'
  },
  post3: {
    webp: `${ASSET_PATHS.images}/blog3.webp`,
    jpg: `${ASSET_PATHS.images}/blog3.jpg`,
    alt: 'Fraud prevention in real estate'
  }
} as const;

// Customer testimonial images
export const CUSTOMER_IMAGES = {
  customer1: {
    src: `${ASSET_PATHS.images}/customer1.png`,
    alt: 'Sarah Johnson - Property Owner',
    name: 'Sarah Johnson',
    role: 'Property Owner'
  },
  customer2: {
    src: `${ASSET_PATHS.images}/customer2.png`,
    alt: 'Michael Chen - Real Estate Agent',
    name: 'Michael Chen',
    role: 'Real Estate Agent'
  },
  customer3: {
    src: `${ASSET_PATHS.images}/customer3.png`,
    alt: 'Amara Okafor - First-time Buyer',
    name: 'Amara Okafor',
    role: 'First-time Buyer'
  },
  professional: {
    src: `${ASSET_PATHS.images}/confident-entrepreneur-looking-camera-with-arms-folded-smiling.jpg`,
    alt: 'Professional real estate expert',
    name: 'David Martinez',
    role: 'Senior Property Consultant'
  },
  diverse: {
    src: `${ASSET_PATHS.images}/depositphotos_68088663-stock-photo-portrait-of-a-young-african.jpg`,
    alt: 'Young professional in real estate',
    name: 'Kwame Asante',
    role: 'Property Investment Advisor'
  }
} as const;

// Utility function to get optimized image with fallback
export function getOptimizedImage(
  webpSrc: string, 
  fallbackSrc: string, 
  alt: string
): { webp: string; fallback: string; alt: string } {
  return {
    webp: webpSrc,
    fallback: fallbackSrc,
    alt
  };
}

// Hero variant configurations with proper asset integration
export const HERO_VARIANTS = {
  A: {
    id: 'trust-focused',
    title: 'Verified. Transparent. Trusted.',
    subtitle: 'Your trusted partner in real estate verification.',
    backgroundImage: HERO_BACKGROUNDS.default,
    fallbackImage: HERO_BACKGROUNDS.fallback,
    ctaText: 'Start Verification',
    theme: 'trust' as const
  },
  B: {
    id: 'premium-focused',
    title: 'Premium Property Intelligence',
    subtitle: 'Unlock exclusive insights and verified listings from our network of trusted real estate professionals.',
    backgroundImage: HERO_BACKGROUNDS.premium,
    fallbackImage: HERO_BACKGROUNDS.default,
    ctaText: 'Explore Premium',
    theme: 'premium' as const
  },
  C: {
    id: 'warm-focused',
    title: 'Find Your Perfect Home',
    subtitle: 'Discover verified properties with confidence. Our comprehensive verification process ensures every listing is authentic.',
    backgroundImage: HERO_BACKGROUNDS.warm,
    fallbackImage: HERO_BACKGROUNDS.default,
    ctaText: 'Find Properties',
    theme: 'warm' as const
  },
  D: {
    id: 'professional-focused',
    title: 'Professional Property Services',
    subtitle: 'Connect with verified professionals and access premium property insights.',
    backgroundImage: HERO_BACKGROUNDS.professional,
    fallbackImage: HERO_BACKGROUNDS.default,
    ctaText: 'Get Started',
    theme: 'trust' as const
  }
} as const;

// Blog post configurations with proper asset integration
export const BLOG_POSTS = [
  {
    id: 'market-trends-2024',
    title: 'Real Estate Market Trends for 2024',
    excerpt: 'Discover the latest trends shaping the real estate market and how they affect property verification.',
    image: BLOG_IMAGES.post1,
    author: 'Sarah Mitchell',
    date: '2024-01-15',
    readTime: '5 min read',
    category: 'Market Analysis'
  },
  {
    id: 'verification-best-practices',
    title: 'Property Verification Best Practices',
    excerpt: 'Learn the essential steps to verify property authenticity and protect yourself from fraud.',
    image: BLOG_IMAGES.post2,
    author: 'James Rodriguez',
    date: '2024-01-10',
    readTime: '7 min read',
    category: 'Verification Guide'
  },
  {
    id: 'fraud-prevention-guide',
    title: 'Complete Guide to Real Estate Fraud Prevention',
    excerpt: 'Comprehensive strategies to identify and prevent real estate fraud in today\'s market.',
    image: BLOG_IMAGES.post3,
    author: 'Dr. Emily Watson',
    date: '2024-01-05',
    readTime: '10 min read',
    category: 'Security'
  }
] as const;

// Customer testimonials with proper asset integration
export const TESTIMONIALS = [
  {
    id: 'sarah-johnson',
    name: CUSTOMER_IMAGES.customer1.name,
    role: CUSTOMER_IMAGES.customer1.role,
    image: CUSTOMER_IMAGES.customer1,
    rating: 5,
    text: "TripleCheck saved me from a fraudulent listing. Their verification process is thorough and gave me complete peace of mind.",
    location: "Nairobi, Kenya",
    verified: true
  },
  {
    id: 'michael-chen',
    name: CUSTOMER_IMAGES.customer2.name,
    role: CUSTOMER_IMAGES.customer2.role,
    image: CUSTOMER_IMAGES.customer2,
    rating: 5,
    text: "As a real estate agent, TripleCheck has become an essential tool for building trust with my clients. Highly recommended!",
    location: "Mombasa, Kenya",
    verified: true
  },
  {
    id: 'amara-okafor',
    name: CUSTOMER_IMAGES.customer3.name,
    role: CUSTOMER_IMAGES.customer3.role,
    image: CUSTOMER_IMAGES.customer3,
    rating: 5,
    text: "The verification report was detailed and easy to understand. It helped me make an informed decision on my first property purchase.",
    location: "Kisumu, Kenya",
    verified: true
  },
  {
    id: 'david-martinez',
    name: CUSTOMER_IMAGES.professional.name,
    role: CUSTOMER_IMAGES.professional.role,
    image: CUSTOMER_IMAGES.professional,
    rating: 5,
    text: "TripleCheck's fraud detection capabilities are impressive. It's become an integral part of our due diligence process.",
    location: "Eldoret, Kenya",
    verified: true
  },
  {
    id: 'kwame-asante',
    name: CUSTOMER_IMAGES.diverse.name,
    role: CUSTOMER_IMAGES.diverse.role,
    image: CUSTOMER_IMAGES.diverse,
    rating: 5,
    text: "The platform's transparency and verification standards have revolutionized how we approach property investments.",
    location: "Nakuru, Kenya",
    verified: true
  }
] as const;

// Asset preloading configuration for performance
export const CRITICAL_ASSETS = {
  // Above-the-fold images that should be preloaded
  hero: [
    HERO_BACKGROUNDS.default,
    HERO_BACKGROUNDS.fallback
  ],
  logos: [
    LOGOS.primary
  ],
  // Customer images for testimonials section
  testimonials: [
    CUSTOMER_IMAGES.customer1.src,
    CUSTOMER_IMAGES.customer2.src,
    CUSTOMER_IMAGES.customer3.src
  ]
} as const;

// Asset validation helper
export function validateAssetPath(path: string): boolean {
  return path.startsWith('/assets/') && (
    path.endsWith('.jpg') || 
    path.endsWith('.jpeg') || 
    path.endsWith('.png') || 
    path.endsWith('.webp') || 
    path.endsWith('.svg') ||
    path.endsWith('.ico')
  );
}

// Integration with comprehensive image system
export function getOptimizedAsset(assetKey: string, category: keyof typeof images): ImageAsset | null {
  const categoryAssets = images[category] as any;
  const asset = categoryAssets?.[assetKey];
  
  if (!asset) return null;
  
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
export function getBestAssetSrc(assetKey: string, category: keyof typeof images): string {
  const asset = getOptimizedAsset(assetKey, category);
  return asset ? getBestImageSrc(asset) : '';
}

// Asset optimization helper
export function getResponsiveImageSizes(baseWidth: number = 1200): string {
  return `(max-width: 640px) ${Math.round(baseWidth * 0.5)}px, (max-width: 1024px) ${Math.round(baseWidth * 0.75)}px, ${baseWidth}px`;
}

export type HeroVariantKey = keyof typeof HERO_VARIANTS;
export type BlogImageKey = keyof typeof BLOG_IMAGES;
export type CustomerImageKey = keyof typeof CUSTOMER_IMAGES;