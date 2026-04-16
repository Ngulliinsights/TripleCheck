#!/usr/bin/env tsx
"use strict";
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
    var CacheService = (await Promise.resolve().then(function () { return require('../../server/infrastructure/cache/CacheService'); })).CacheService;
    var cache = new CacheService();
    console.log('✅ CacheService imported successfully');
    // Test property cache service
    var PropertyCacheService = (await Promise.resolve().then(function () { return require('../../server/infrastructure/cache/PropertyCacheService'); })).PropertyCacheService;
    var propertyCache = new PropertyCacheService();
    console.log('✅ PropertyCacheService imported successfully');
    // Test property service
    var PropertyService = (await Promise.resolve().then(function () { return require('../../server/property/property.service'); })).PropertyService;
    var propertyService = new PropertyService();
    console.log('✅ PropertyService imported successfully');
    console.log('🎉 All imports successful! Server should start now.');
    // Clean up
    cache.destroy();
}
catch (error) {
    console.error('❌ Server startup test failed:', error);
    process.exit(1);
}
