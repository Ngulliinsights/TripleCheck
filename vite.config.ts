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
  // Cache for chunk decisions to avoid repeated string operations
  const chunkCache = new Map<string, string>();

  return (id: string): string | undefined => {
    // Check cache first to avoid repeated processing of the same modules
    if (chunkCache.has(id)) {
      return chunkCache.get(id);
    }

    let chunkName: string | undefined;

    // High-priority vendor chunking for stable, frequently-used libraries
    if (id.includes("node_modules")) {
      // React ecosystem - these change rarely and are used everywhere
      if (
        id.includes("react") &&
        !id.includes("react-router") &&
        !id.includes("@tanstack")
      ) {
        chunkName = "react-core";
      }
      // Routing libraries - bundle with React to avoid context issues
      else if (id.includes("react-router") || id.includes("@remix-run")) {
        chunkName = "react-core";
      }
      // State management and data fetching - business logic dependencies
      else if (
        id.includes("@tanstack/react-query") ||
        id.includes("zustand") ||
        id.includes("jotai")
      ) {
        chunkName = "state-management";
      }
      // UI and animation libraries - presentation layer dependencies
      else if (
        id.includes("framer-motion") ||
        id.includes("lucide-react") ||
        id.includes("@radix-ui")
      ) {
        chunkName = "ui-framework";
      }
      // Data visualization - specialized, heavy libraries
      else if (
        id.includes("recharts") ||
        id.includes("d3") ||
        id.includes("chart.js")
      ) {
        chunkName = "data-visualization";
      }
      // Utilities and smaller libraries
      else if (
        id.includes("date-fns") ||
        id.includes("lodash") ||
        id.includes("clsx") ||
        id.includes("nanoid")
      ) {
        chunkName = "utilities";
      }
      // Default vendor chunk for miscellaneous node_modules
      else {
        chunkName = "vendor-misc";
      }
    }
    // Domain-based chunking for application code organization
    // This approach aligns with your domain-driven architecture and route preloading
    else if (id.includes("/src/")) {
      // Core business domains - separate chunks for independent loading and preloading
      if (id.includes("/src/property/")) {
        // Further split property domain by component type for optimal preloading
        if (id.includes("/pages/")) {
          chunkName = "domain-property-pages";
        } else if (id.includes("/components/")) {
          chunkName = "domain-property-components";
        } else {
          chunkName = "domain-property";
        }
      } else if (id.includes("/src/trust/")) {
        if (id.includes("/pages/")) {
          chunkName = "domain-trust-pages";
        } else {
          chunkName = "domain-trust";
        }
      } else if (id.includes("/src/user/")) {
        if (id.includes("/pages/")) {
          chunkName = "domain-user-pages";
        } else {
          chunkName = "domain-user";
        }
      } else if (id.includes("/src/auth/")) {
        // Auth is critical - keep together for immediate loading
        chunkName = "domain-auth";
      } else if (id.includes("/src/search/")) {
        if (id.includes("/pages/")) {
          chunkName = "domain-search-pages";
        } else {
          chunkName = "domain-search";
        }
      } else if (id.includes("/src/communication/")) {
        chunkName = "domain-communication";
      } else if (id.includes("/src/analytics/")) {
        chunkName = "domain-analytics";
      }
      // Infrastructure and shared code - loaded with main application
      else if (id.includes("/src/infrastructure/")) {
        // Separate routing infrastructure for preloading optimization
        if (id.includes("/routing/")) {
          chunkName = "infrastructure-routing";
        } else {
          chunkName = "infrastructure-core";
        }
      } else if (id.includes("/src/shared/")) {
        // Split shared code by usage pattern
        if (id.includes("/pages/")) {
          chunkName = "shared-pages";
        } else if (id.includes("/components/")) {
          chunkName = "shared-components";
        } else {
          chunkName = "shared-core";
        }
      }
    }

    // Cache the decision to improve performance on subsequent calls
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
    port: 3003,
    // Configure HMR with fallback port strategy
    hmr: {
      port: 3004,
      // Add overlay configuration for better error visibility
      overlay: true,
    },
    // Enable CORS for cross-origin requests during development
    cors: true,
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
    chunkSizeWarningLimit: 1000,

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
