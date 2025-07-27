import type { Config } from "tailwindcss";

/** 
 * UNIFIED REAL ESTATE DESIGN SYSTEM - TAILWIND CONFIGURATION
 * ==========================================================
 * 
 * This configuration perfectly complements the CSS variables system,
 * creating a cohesive design language that balances psychological impact
 * with technical excellence. Every color, animation, and utility serves
 * both aesthetic and functional purposes in real estate contexts.
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
        BORDER RADIUS SYSTEM
        ===================
        Consistent radius values using CSS custom properties for theming.
      */
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      
      /* 
        STREAMLINED COLOR SYSTEM
        ========================
        Essential colors that integrate with CSS variables for optimal performance.
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
          muted: "hsl(var(--primary-muted))",
        },
        
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
          muted: "hsl(var(--secondary-muted))",
        },
        
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
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
        ESSENTIAL ANIMATIONS
        ===================
        Core animations for smooth interactions.
      */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
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
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
      },
      
      /* 
        ESSENTIAL TRANSITIONS
        ====================
        Core transition utilities for smooth interactions.
      */
      transitionProperty: {
        'property-card': "transform, box-shadow, border-color, background-color",
      },
      
      /* 
        ESSENTIAL SPACING
        ================
        Key spacing values for consistent layouts.
      */
      spacing: {
        18: "4.5rem",  // 72px
        22: "5.5rem",  // 88px
        30: "7.5rem",  // 120px
      },
      
      /* 
        ESSENTIAL SHADOWS
        ================
        Core shadow system for depth and interaction feedback.
      */
      boxShadow: {
        'soft': '0 2px 8px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.06)',
        'property-warm': '0 4px 12px -1px hsl(var(--secondary) / 0.15), 0 2px 4px -1px hsl(var(--secondary) / 0.06)',
        'property-trust': '0 4px 12px -1px hsl(var(--primary) / 0.15), 0 2px 4px -1px hsl(var(--primary) / 0.06)',
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      
      /* 
        ESSENTIAL UTILITIES
        ==================
        Core utilities for property layouts and interactions.
      */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      
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
    },
  },
  
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")
  ],
} satisfies Config;