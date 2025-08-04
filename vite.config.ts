/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";
import os from "os";

// Calculate directory paths once at module level for better performance
// This avoids repeated path calculations during configuration execution
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Pre-calculate commonly used paths to reduce redundant path.resolve calls
const srcPath = path.resolve(__dirname, "src");
const distPath = path.resolve(__dirname, "dist/public");



export default defineConfig({
  // Ensure correct root directory
  root: __dirname,
  
  // Plugin configuration with optimized ordering for better build performance
  plugins: [
    // React plugin with basic configuration to avoid conflicts
    react(),

    // Runtime error overlay for enhanced debugging during development
    runtimeErrorOverlay(),

    // Theme plugin for consistent UI theming across the application
    themePlugin(),
  ],

  // Enhanced server configuration for optimal development experience
  server: {
    port: 5173,
    // Configure HMR with fallback port strategy
    hmr: {
      port: 5174,
      // Add overlay configuration for better error visibility
      overlay: true,
    },
    // Enable CORS for cross-origin requests during development
    cors: true,
    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
      '/test': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  // Move dependency optimization to root level where it belongs in Vite config
  optimizeDeps: {
    // Include commonly used dependencies to avoid discovery delays
    include: [
      "react",
      "react-dom",
      "react-dom/client",
      "react/jsx-runtime",
      "react-router-dom",
      "@tanstack/react-query",
    ],
    // Exclude problematic packages that should remain external
    exclude: ["@replit/vite-plugin-shadcn-theme-json"],
    // Force pre-bundling to avoid runtime issues
    force: true,
  },

  // Test configuration is now handled by vitest.workspace.ts

  // Optimized build configuration for production performance
  build: {
    // Use standard dist directory for Vercel
    outDir: "dist",
    emptyOutDir: true,

    // Enhanced build optimizations
    target: "es2020", // Modern target for better optimization
    minify: "esbuild", // Faster minification than terser
    sourcemap: false, // Disable source maps for production

    // Simplified Rollup configuration to prevent module issues
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically
        manualChunks: undefined,
      },
    },

    // Increase chunk size warning limit for domain chunks which may be naturally larger
    chunkSizeWarningLimit: 500,

    // Disable build analysis for production
    reportCompressedSize: false,
  },

  // Base path configuration for deployment
  base: '/',

  // Optimized module resolution with comprehensive alias mapping
  resolve: {
    alias: {
      // Primary source alias for general imports
      "@": srcPath,

      // Domain-specific aliases for clear import organization
      // These align with your domain-driven architecture approach
      "@shared": path.resolve(srcPath, "shared"),
      "@property": path.resolve(srcPath, "property"),
      "@trust": path.resolve(srcPath, "trust"),
      "@user": path.resolve(srcPath, "user"),
      "@auth": path.resolve(srcPath, "auth"),
      "@search": path.resolve(srcPath, "search"),
      "@communication": path.resolve(srcPath, "communication"),
      "@analytics": path.resolve(srcPath, "analytics"),
      "@infrastructure": path.resolve(srcPath, "infrastructure"),
      "@land-verification": path.resolve(srcPath, "land-verification"),

      // Additional common aliases for better developer experience
      "@components": path.resolve(srcPath, "shared/components"),
      "@hooks": path.resolve(srcPath, "shared/hooks"),
      "@utils": path.resolve(srcPath, "shared/utils"),
      "@types": path.resolve(srcPath, "shared/types"),
      "@assets": path.resolve(srcPath, "assets"),
    },
    // Ensure React is resolved correctly
    dedupe: ["react", "react-dom"],
  },

  // Define global constants for conditional compilation
  define: {
    // Provide build-time environment detection
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __PROD__: JSON.stringify(process.env.NODE_ENV === "production"),
  },
});
