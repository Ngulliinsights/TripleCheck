#!/usr/bin/env tsx
/**
 * Test Server Start Script
 * 
 * Quick test to see if the server can start without errors
 */

console.log('🧪 Testing server startup...');

try {
  // Test importing the main modules
  console.log('✅ Testing imports...');
  
  // Test cache service
  const { CacheService } = await import('../../server/infrastructure/cache/CacheService');
  const cache = new CacheService();
  console.log('✅ CacheService imported successfully');
  
  // Test property cache service
  const { PropertyCacheService } = await import('../../server/infrastructure/cache/PropertyCacheService');
  const propertyCache = new PropertyCacheService();
  console.log('✅ PropertyCacheService imported successfully');
  
  // Test property service
  const { PropertyService } = await import('../../server/property/property.service');
  const propertyService = new PropertyService();
  console.log('✅ PropertyService imported successfully');
  
  console.log('🎉 All imports successful! Server should start now.');
  
  // Clean up
  cache.destroy();
  
} catch (error) {
  console.error('❌ Server startup test failed:', error);
  process.exit(1);
}