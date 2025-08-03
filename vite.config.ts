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

/**
 * Optimized chunk splitting strategy for better caching and loading performance
 * This function implements a hierarchical chunking approach that prioritizes
 * framework stability and domain-specific code organization
 */


function createOptimizedChunkStrategy() {
  const chunkCache = new Map();

  return (id) => {
    if (chunkCache.has(id)) {
      return chunkCache.get(id);
    }

    let chunkName;

    if (id.includes("node_modules")) {
      // AGGRESSIVE vendor splitting
      if (id.includes("react-dom")) {
        chunkName = "react-dom";
      } else if (id.includes("react") && !id.includes("react-router")) {
        chunkName = "react-core";
      } else if (id.includes("react-router")) {
        chunkName = "react-router";
      } else if (id.includes("@tanstack/react-query")) {
        chunkName = "react-query";
      } else if (id.includes("framer-motion")) {
        chunkName = "framer-motion";
      } else if (id.includes("lucide-react")) {
        chunkName = "lucide-icons";
      } else if (id.includes("@radix-ui")) {
        chunkName = "radix-ui";
      } else if (id.includes("recharts")) {
        chunkName = "recharts";
      } else if (id.includes("d3")) {
        chunkName = "d3-charts";
      } else if (id.includes("date-fns")) {
        chunkName = "date-utils";
      } else if (id.includes("lodash")) {
        chunkName = "lodash-utils";
      } else if (id.includes("zod")) {
        chunkName = "validation";
      } else if (id.includes("axios")) {
        chunkName = "http-client";
      } else {
        chunkName = "vendor-misc";
      }
    } else if (id.includes("/src/")) {
      // AGGRESSIVE app code splitting
      if (id.includes("/src/shared/pages/Home")) {
        chunkName = "page-home";
      } else if (id.includes("/src/shared/pages/FindProfessionals")) {
        chunkName = "page-professionals";
      } else if (id.includes("/src/shared/pages/")) {
        // Split other shared pages individually
        const pageName = id.match(/\/([^\/]+)\.tsx?$/)?.[1];
        chunkName = pageName ? `page-${pageName.toLowerCase()}` : "shared-pages-misc";
      } else if (id.includes("/src/property/pages/PropertyWizard")) {
        chunkName = "property-wizard";
      } else if (id.includes("/src/property/pages/PropertyDetails")) {
        chunkName = "property-details";
      } else if (id.includes("/src/property/pages/")) {
        const pageName = id.match(/\/([^\/]+)\.tsx?$/)?.[1];
        chunkName = pageName ? `property-${pageName.toLowerCase()}` : "property-pages-misc";
      } else if (id.includes("/src/trust/pages/")) {
        const pageName = id.match(/\/([^\/]+)\.tsx?$/)?.[1];
        chunkName = pageName ? `trust-${pageName.toLowerCase()}` : "trust-pages";
      } else if (id.includes("/src/shared/components/ui/")) {
        chunkName = "ui-components";
      } else if (id.includes("/src/shared/components/")) {
        chunkName = "shared-components";
      } else if (id.includes("/src/property/components/")) {
        chunkName = "property-components";
      } else if (id.includes("/src/trust/")) {
        chunkName = "trust-domain";
      } else if (id.includes("/src/auth/")) {
        chunkName = "auth-domain";
      } else if (id.includes("/src/infrastructure/")) {
        chunkName = "infrastructure";
      } else {
        chunkName = "app-core";
      }
    }

    if (chunkName) {
      chunkCache.set(id, chunkName);
    }

    return chunkName;
  };
}

export default defineConfig({
  // Plugin configuration with optimized ordering for better build performance
  plugins: [
    // React plugin with streamlined configuration compatible across versions
    react({
      // Optimize JSX runtime for smaller bundle sizes
      jsxRuntime: "automatic",
      // Include .tsx files for better TypeScript support
      include: "**/*.{jsx,tsx}",
    }),

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
      "react-router-dom",
      "@tanstack/react-query",
    ],
    // Exclude problematic packages that should remain external
    exclude: ["@replit/vite-plugin-shadcn-theme-json"],
  },

  // Test configuration is now handled by vitest.workspace.ts

  // Optimized build configuration for production performance
  build: {
    // Use pre-calculated path for consistency
    outDir: distPath,
    emptyOutDir: true,

    // Enhanced build optimizations
    target: "es2020", // Modern target for better optimization
    minify: "esbuild", // Faster minification than terser
    sourcemap: process.env.NODE_ENV === "development", // Conditional source maps

    // Advanced Rollup configuration for optimal bundling
    rollupOptions: {
      output: {
        // Implement the optimized chunking strategy
        manualChunks: createOptimizedChunkStrategy(),

        // Optimize asset naming for better caching strategies
        assetFileNames: (assetInfo) => {
          // Organize assets by type for better cache management
          const extType = assetInfo.name?.split(".").pop();

          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType || "")) {
            return "assets/images/[name]-[hash][extname]";
          }
          if (/woff2?|eot|ttf|otf/i.test(extType || "")) {
            return "assets/fonts/[name]-[hash][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },

        // Optimize chunk naming for better cache invalidation
        chunkFileNames: "js/[name]-[hash].js",
        entryFileNames: "js/[name]-[hash].js",
      },
    },

    // Increase chunk size warning limit for domain chunks which may be naturally larger
    chunkSizeWarningLimit: 300,

    // Enable build analysis in development for debugging bundle size
    reportCompressedSize: process.env.NODE_ENV === "development",
  },

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
  },

  // Define global constants for conditional compilation
  define: {
    // Provide build-time environment detection
    __DEV__: JSON.stringify(process.env.NODE_ENV === "development"),
    __PROD__: JSON.stringify(process.env.NODE_ENV === "production"),
  },
});
