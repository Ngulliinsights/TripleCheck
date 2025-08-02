/**
 * IMAGE COMPONENT EXAMPLES
 * ========================
 * 
 * Example usage of the optimized image components and CSS classes
 * for testing and documentation purposes.
 */

import React from 'react';
import { OptimizedImage } from '../ui/optimized-image';
import { Logo, PropertyImage, AvatarImage, HeroImage } from '../ui/image-components';
import { images } from '@/shared/config/images';

export function ImageExamples() {
  return (
    <div className="space-y-12 p-8">
      {/* Logo Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Logo Examples</h2>
        <div className="flex items-center gap-6">
          <Logo size="small" />
          <Logo size="medium" />
          <Logo size="large" />
          <Logo size="xl" />
        </div>
        
        <div className="mt-4 p-4 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-6">
            <Logo size="medium" variant="white" />
            <span className="text-white">White variant on dark background</span>
          </div>
        </div>
      </section>

      {/* CSS Class Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">CSS Class Examples</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="logo-small" />
            <p className="text-sm text-muted-foreground">.logo-small</p>
          </div>
          <div className="space-y-2">
            <div className="logo-primary" />
            <p className="text-sm text-muted-foreground">.logo-primary</p>
          </div>
          <div className="space-y-2">
            <div className="logo-large" />
            <p className="text-sm text-muted-foreground">.logo-large</p>
          </div>
          <div className="space-y-2">
            <div className="logo-xl" />
            <p className="text-sm text-muted-foreground">.logo-xl</p>
          </div>
        </div>
      </section>

      {/* Property Image Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Property Image Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PropertyImage
            src={images.properties.sample1.jpg}
            alt={images.properties.sample1.alt}
            variant="standard"
            propertyType="residential"
          />
          <PropertyImage
            src={images.properties.sample2.jpg}
            alt={images.properties.sample2.alt}
            variant="standard"
            propertyType="commercial"
          />
          <PropertyImage
            src={images.properties.sample3.jpg}
            alt={images.properties.sample3.alt}
            variant="standard"
            propertyType="featured"
          />
        </div>
      </section>

      {/* CSS Property Background Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">CSS Property Background Examples</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="property-sample-1 h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.property-sample-1</p>
          </div>
          <div className="space-y-2">
            <div className="property-sample-2 h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.property-sample-2</p>
          </div>
          <div className="space-y-2">
            <div className="property-sample-3 h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.property-sample-3</p>
          </div>
          <div className="space-y-2">
            <div className="property-sample-4 h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.property-sample-4</p>
          </div>
          <div className="space-y-2">
            <div className="property-sample-5 h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.property-sample-5</p>
          </div>
          <div className="space-y-2">
            <div className="property-placeholder h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.property-placeholder</p>
          </div>
        </div>
      </section>

      {/* Avatar Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Avatar Examples</h2>
        <div className="flex items-center gap-6">
          <AvatarImage
            src={images.customers.customer1.png}
            alt={images.customers.customer1.alt}
            size="sm"
          />
          <AvatarImage
            src={images.customers.customer2.png}
            alt={images.customers.customer2.alt}
            size="md"
          />
          <AvatarImage
            src={images.customers.customer3.png}
            alt={images.customers.customer3.alt}
            size="lg"
          />
          <AvatarImage
            src={images.customers.entrepreneur.jpg}
            alt={images.customers.entrepreneur.alt}
            size="xl"
          />
        </div>
      </section>

      {/* CSS Avatar Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">CSS Avatar Examples</h2>
        <div className="flex items-center gap-6">
          <div className="space-y-2 text-center">
            <div className="customer-1 w-12 h-12" />
            <p className="text-sm text-muted-foreground">.customer-1</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="customer-2 w-12 h-12" />
            <p className="text-sm text-muted-foreground">.customer-2</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="customer-3 w-12 h-12" />
            <p className="text-sm text-muted-foreground">.customer-3</p>
          </div>
        </div>
      </section>

      {/* Hero Background Example */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Hero Background Examples</h2>
        
        {/* React Component Hero */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">React Component</h3>
          <HeroImage
            src={images.hero.primary.jpg}
            webpSrc={images.hero.primary.webp}
            alt={images.hero.primary.alt}
            className="h-64 rounded-lg"
            overlay={true}
            overlayOpacity={0.4}
          >
            <div className="text-center text-white">
              <h1 className="text-3xl font-bold mb-2">Welcome to TripleCheck</h1>
              <p className="text-lg">Secure Real Estate Verification</p>
            </div>
          </HeroImage>
        </div>

        {/* CSS Class Hero */}
        <div>
          <h3 className="text-lg font-semibold mb-3">CSS Class</h3>
          <div className="hero-bg h-64 rounded-lg relative flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 rounded-lg" />
            <div className="relative text-center text-white">
              <h1 className="text-3xl font-bold mb-2">CSS Background Hero</h1>
              <p className="text-lg">Using .hero-bg class</p>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Image Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Blog Image Examples</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="blog-1-webp h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.blog-1-webp</p>
          </div>
          <div className="space-y-2">
            <div className="blog-2-webp h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.blog-2-webp</p>
          </div>
          <div className="space-y-2">
            <div className="blog-3-webp h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">.blog-3-webp</p>
          </div>
        </div>
      </section>

      {/* Loading States */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Loading States</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="image-loading h-32 rounded-lg" />
            <p className="text-sm text-muted-foreground">Image Loading</p>
          </div>
          <div className="space-y-2">
            <div className="logo-loading" />
            <p className="text-sm text-muted-foreground">Logo Loading</p>
          </div>
          <div className="space-y-2">
            <div className="property-image-loading" />
            <p className="text-sm text-muted-foreground">Property Loading</p>
          </div>
          <div className="space-y-2">
            <div className="avatar-loading w-12 h-12" />
            <p className="text-sm text-muted-foreground">Avatar Loading</p>
          </div>
        </div>
      </section>

      {/* Brand Color Examples */}
      <section>
        <h2 className="text-2xl font-bold mb-6">Brand Color Examples</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-brand-primary text-white p-4 rounded-lg text-center">
            <p className="font-semibold">Primary</p>
            <p className="text-sm opacity-90">.bg-brand-primary</p>
          </div>
          <div className="bg-brand-secondary text-white p-4 rounded-lg text-center">
            <p className="font-semibold">Secondary</p>
            <p className="text-sm opacity-90">.bg-brand-secondary</p>
          </div>
          <div className="bg-brand-accent text-black p-4 rounded-lg text-center">
            <p className="font-semibold">Accent</p>
            <p className="text-sm opacity-70">.bg-brand-accent</p>
          </div>
          <div className="bg-gradient-brand text-white p-4 rounded-lg text-center">
            <p className="font-semibold">Gradient</p>
            <p className="text-sm opacity-90">.bg-gradient-brand</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ImageExamples;