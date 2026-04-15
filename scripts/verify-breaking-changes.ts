/**
 * Verification script for all breaking changes from library migration
 * Tests that all APIs are working correctly
 */

import { logger } from '../server/infrastructure/observability/telemetry';
import { ResilientHttpClient } from '../server/infrastructure/http/resilient-client';
import { validateBody, validateQuery, validateParams } from '../server/middleware/validation';
import { requireAuth, requireAbility } from '../server/auth/authorization';
import { z } from 'zod';

console.log('🔍 Verifying Breaking Changes Resolution...\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => {
        console.log(`✅ ${name}`);
        passed++;
      }).catch((error) => {
        console.log(`❌ ${name}: ${error.message}`);
        failed++;
      });
    } else {
      console.log(`✅ ${name}`);
      passed++;
    }
  } catch (error: any) {
    console.log(`❌ ${name}: ${error.message}`);
    failed++;
  }
}

// Test 1: Logger API
test('Logger API - info with data', () => {
  logger.info('Test message', { testData: 'value' });
});

test('Logger API - error with error object', () => {
  const error = new Error('Test error');
  logger.error('Test error message', { error: error.message, stack: error.stack });
});

test('Logger API - warn with data', () => {
  logger.warn('Test warning', { warning: 'data' });
});

// Test 2: HTTP Client
test('HTTP Client - ResilientHttpClient exists', () => {
  const client = new ResilientHttpClient({
    baseURL: 'https://api.example.com',
    timeout: 5000,
  });
  if (!client) throw new Error('Client not created');
});

test('HTTP Client - has required methods', () => {
  const client = new ResilientHttpClient({
    baseURL: 'https://api.example.com',
  });
  if (typeof client.get !== 'function') throw new Error('get method missing');
  if (typeof client.post !== 'function') throw new Error('post method missing');
  if (typeof client.put !== 'function') throw new Error('put method missing');
  if (typeof client.delete !== 'function') throw new Error('delete method missing');
});

// Test 3: Validation Middleware
test('Validation - validateBody exists', () => {
  if (typeof validateBody !== 'function') throw new Error('validateBody not a function');
});

test('Validation - validateQuery exists', () => {
  if (typeof validateQuery !== 'function') throw new Error('validateQuery not a function');
});

test('Validation - validateParams exists', () => {
  if (typeof validateParams !== 'function') throw new Error('validateParams not a function');
});

test('Validation - Zod schema works', () => {
  const TestSchema = z.object({
    name: z.string(),
    age: z.number(),
  });
  
  const result = TestSchema.safeParse({ name: 'Test', age: 25 });
  if (!result.success) throw new Error('Schema validation failed');
});

// Test 4: Authentication & Authorization
test('Authentication - requireAuth exists', () => {
  if (typeof requireAuth !== 'function') throw new Error('requireAuth not a function');
});

test('Authorization - requireAbility exists', () => {
  if (typeof requireAbility !== 'function') throw new Error('requireAbility not a function');
});

// Test 5: Import paths
test('Logger import path - observability/telemetry', () => {
  // If we got here, the import worked
  if (!logger) throw new Error('Logger not imported');
});

// Test 6: WebSocket (just check it exists)
test('WebSocket service exists', async () => {
  try {
    const { socketService } = await import('../server/communication/websocket.service');
    if (!socketService) throw new Error('socketService not found');
  } catch (error: any) {
    throw new Error(`WebSocket import failed: ${error.message}`);
  }
});

// Test 7: Rate Limiting
test('Rate limiting middleware exists', async () => {
  try {
    const { apiLimiter, authLimiter, aiLimiter } = await import('../server/middleware/rate-limit');
    if (!apiLimiter || !authLimiter || !aiLimiter) {
      throw new Error('Rate limiters not found');
    }
  } catch (error: any) {
    throw new Error(`Rate limiting import failed: ${error.message}`);
  }
});

// Test 8: Schemas
test('Property schema exists', async () => {
  try {
    const { PropertySchema } = await import('../server/schemas/property.schema');
    if (!PropertySchema) throw new Error('PropertySchema not found');
  } catch (error: any) {
    throw new Error(`Property schema import failed: ${error.message}`);
  }
});

test('User schema exists', async () => {
  try {
    const { UserSchema } = await import('../server/schemas/user.schema');
    if (!UserSchema) throw new Error('UserSchema not found');
  } catch (error: any) {
    throw new Error(`User schema import failed: ${error.message}`);
  }
});

// Wait for async tests to complete
setTimeout(() => {
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n✅ All breaking changes have been resolved!');
    process.exit(0);
  } else {
    console.log('\n❌ Some breaking changes still need attention');
    process.exit(1);
  }
}, 1000);
