
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import themePlugin from '@replit/vite-plugin-shadcn-theme-json';
import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "automatic",
      include: "**/*.{jsx,tsx}",
    }),
    runtimeErrorOverlay(),
    themePlugin(),
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@property": path.resolve(__dirname, "src/property"),
      "@trust": path.resolve(__dirname, "src/trust"),
      "@user": path.resolve(__dirname, "src/user"),
      "@auth": path.resolve(__dirname, "src/auth"),
      "@search": path.resolve(__dirname, "src/search"),
      "@communication": path.resolve(__dirname, "src/communication"),
      "@analytics": path.resolve(__dirname, "src/analytics"),
      "@infrastructure": path.resolve(__dirname, "src/infrastructure"),
      "@components": path.resolve(__dirname, "src/shared/components"),
      "@hooks": path.resolve(__dirname, "src/shared/hooks"),
      "@utils": path.resolve(__dirname, "src/shared/utils"),
      "@types": path.resolve(__dirname, "src/shared/types"),
      "@assets": path.resolve(__dirname, "src/assets"),
    },
  },
  
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["src/shared/test-utils/setup.ts"],
    include: [
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\property\\property-repository-integration.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\fraud-detection\\tests\\integration.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\tests\\security\\SecurityHardening.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\land-verification\\__tests__\\security\\api-security.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\land-verification\\security\\__tests__\\AccessControlService.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\routes\\__tests__\\AuthRoutes.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\property\\property-controller-integration.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\src\\shared\\services\\__tests__\\websocket-integration.test.ts",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\src\\shared\\test-utils\\__tests__\\error-handling-integration.test.tsx",
  "C:\\Users\\Access Granted\\Downloads\\AfricanPropertyTrust\\server\\tests\\ai-integration.test.ts"
],
    
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 2,
        minThreads: 1,
        isolate: true,
      },
    },
    
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    
    maxConcurrency: 2,
    sequence: {
      concurrent: false,
      shuffle: false,
    },
    
    watch: false,
    cache: {
      dir: 'node_modules/.vitest',
    },
    
    reporter: ['verbose'],
    
    coverage: {
      provider: "v8",
      reporter: ["text", "json"],
      clean: true,
      cleanOnRerun: true,
    },
    
    env: {
      NODE_ENV: 'test',
      VITE_API_URL: 'http://localhost:3001',
      VITE_APP_ENV: 'test',
      TEST_CHUNK_ID: 'chunk-3',
      TEST_CHUNK_PRIORITY: 'high',
      TEST_CHUNK_SIZE: '10',
    },
  },
});
