import type { Config } from "tailwindcss";

/** 
 * TRIPLECHECK UNIFIED DESIGN SYSTEM - TAILWIND CONFIGURATION
 * ==========================================================
 * 
 * Streamlined configuration that perfectly complements the unified design system,
 * eliminating redundancy while maintaining comprehensive functionality.
 */
export default {
  darkMode: ["class"],
  
  // Future-proofing with modern Tailwind features
  future: {
    hoverOnlyWhenSupported: true,
    respectDefaultRingColorOpacity: true,
    disableColorOpacityUtilitiesByDefault: true,
  },
  
  content: [
    "./index.html", 
    "./src/**/*.{js,jsx,ts,tsx}",
    "./server/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}",
  ],
  
  theme: {
    extend: {
      /* 
        UNIFIED BORDER RADIUS SYSTEM
        ===========================
        Consistent radius values using CSS custom properties
      */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      
      /* 
        UNIFIED COLOR SYSTEM
        ===================
        All colors reference the design system CSS variables
      */
      colors: {
        // Core UI foundation
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Brand color families
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          active: "hsl(var(--primary-active))",
          muted: "hsl(var(--primary-muted))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
          active: "hsl(var(--secondary-active))",
          muted: "hsl(var(--secondary-muted))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
          active: "hsl(var(--accent-active))",
          muted: "hsl(var(--accent-muted))",
        },
        
        // Property semantic colors
        property: {
          residential: "hsl(var(--property-residential))",
          commercial: "hsl(var(--property-commercial))",
          featured: "hsl(var(--property-featured))",
          luxury: "hsl(var(--property-luxury))",
        },
        
        // Trust status colors
        trust: {
          verified: "hsl(var(--trust-verified))",
          pending: "hsl(var(--trust-pending))",
          warning: "hsl(var(--trust-warning))",
          danger: "hsl(var(--trust-danger))",
        },
        
        // Status colors
        status: {
          success: "hsl(var(--status-success))",
          warning: "hsl(var(--status-warning))",
          error: "hsl(var(--status-error))",
          info: "hsl(var(--status-info))",
        },
        
        // UI component colors
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
          border: "hsl(var(--card-border))",
        },
        
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          hover: "hsl(var(--destructive-hover))",
        },
        
        // Form and interaction colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      
      /* 
        UNIFIED ANIMATION SYSTEM
        =======================
        Performance-optimized animations with GPU acceleration
      */
      keyframes: {
        // Radix UI animations
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        
        // Core design system animations
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translate3d(0, 20px, 0)", opacity: "0" },
          "100%": { transform: "translate3d(0, 0, 0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale3d(0.95, 0.95, 1)", opacity: "0" },
          "100%": { transform: "scale3d(1, 1, 1)", opacity: "1" },
        },
        
        // Legacy compatibility
        "fadeInUp": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },

        // B2B animations
        "slide-down": {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)" },
          "50%": { boxShadow: "0 0 0 10px rgba(59, 130, 246, 0)" },
        },
        "shimmer": {
          "0%": { left: "-100%" },
          "100%": { left: "100%" },
        },
        "gradient-border": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "fadeInUp": "fadeInUp 0.5s ease forwards",
        "slide-down": "slide-down 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "shimmer": "shimmer 3s infinite",
        "gradient-border": "gradient-border 3s ease infinite",
      },
      
      /* 
        UNIFIED TRANSITION SYSTEM
        ========================
        Consistent transition properties
      */
      transitionProperty: {
        'property-card': "transform, box-shadow, border-color, background-color",
        'glass': "background-color, backdrop-filter, border-color, box-shadow",
      },
      
      /* 
        UNIFIED SPACING SYSTEM
        =====================
        Key spacing values for consistent layouts
      */
      spacing: {
        18: "4.5rem",   // 72px
        22: "5.5rem",   // 88px (nav height)
        30: "7.5rem",   // 120px
      },
      
      /* 
        UNIFIED SHADOW SYSTEM
        ====================
        Comprehensive shadow system for depth and glass effects
      */
      boxShadow: {
        // Basic shadows
        'soft': '0 2px 8px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        
        // Property-specific shadows
        'property-warm': '0 4px 12px -1px hsl(var(--secondary) / 0.15), 0 2px 4px -1px hsl(var(--secondary) / 0.06)',
        'property-trust': '0 4px 12px -1px hsl(var(--primary) / 0.15), 0 2px 4px -1px hsl(var(--primary) / 0.06)',
        
        // Glass shadows
        'glass-light': '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-medium': '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-heavy': '0 16px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
        'glass-primary': '0 8px 32px hsl(var(--primary) / 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        'glass-secondary': '0 8px 32px hsl(var(--secondary) / 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
      },
      
      /* 
        UNIFIED TYPOGRAPHY SYSTEM
        ========================
        Font family and fluid typography
      */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
      },
      
      /* 
        UNIFIED LAYOUT SYSTEM
        ====================
        Grid templates and aspect ratios for property layouts
      */
      gridTemplateColumns: {
        'property-cards': 'repeat(auto-fit, minmax(300px, 1fr))',
      },
      
      aspectRatio: {
        'property': '4 / 3',
        'property-wide': '16 / 9',
      },
      
      maxWidth: {
        'property-card': '360px',
        'content': '1200px',
      },

      /* 
        UNIFIED GLASS SYSTEM
        ===================
        Backdrop blur utilities for glassmorphism effects
      */
      backdropBlur: {
        'glass-light': '12px',
        'glass-medium': '16px',
        'glass-heavy': '24px',
        'glass-ultra': '32px',
      },

      /* 
        UNIFIED BACKGROUND SYSTEM
        ========================
        Gradient backgrounds and patterns
      */
      backgroundImage: {
        // Dark gradients
        'dark-gradient-primary': 'var(--dark-gradient)',
        'dark-gradient-secondary': 'linear-gradient(135deg, hsl(222.2 84% 4.9%) 0%, hsl(var(--primary) / 0.1) 50%, hsl(222.2 84% 4.9%) 100%)',
        'dark-gradient-accent': 'linear-gradient(135deg, hsl(222.2 84% 4.9%) 0%, hsl(var(--secondary) / 0.08) 35%, hsl(var(--accent) / 0.05) 70%, hsl(222.2 84% 4.9%) 100%)',
        
        // Glass gradients
        'glass-primary': 'linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'glass-secondary': 'linear-gradient(135deg, hsl(var(--secondary) / 0.1) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'glass-accent': 'linear-gradient(135deg, hsl(var(--accent) / 0.1) 0%, rgba(255, 255, 255, 0.1) 100%)',
        
        // Brand gradients
        'gradient-brand': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
        'gradient-premium': 'linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--accent)))',
      },
    },
  },
  
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")
  ],
} satisfies Config;