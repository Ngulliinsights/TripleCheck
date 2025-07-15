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
    "./client/index.html", 
    "./client/src/**/*.{js,jsx,ts,tsx}",
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
        COMPREHENSIVE COLOR SYSTEM
        ==========================
        This system integrates perfectly with the CSS variables,
        providing opacity variants and semantic naming for intuitive use.
      */
      colors: {
        // Core UI foundation
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        
        // Brand color families with full interaction states
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
          active: "hsl(var(--primary-active))",
          muted: "hsl(var(--primary-muted))",
          // Opacity variants for overlays and subtle backgrounds
          50: "hsl(var(--primary) / 0.05)",
          100: "hsl(var(--primary) / 0.10)",
          200: "hsl(var(--primary) / 0.20)",
          300: "hsl(var(--primary) / 0.30)",
          400: "hsl(var(--primary) / 0.40)",
          500: "hsl(var(--primary) / 0.50)",
          600: "hsl(var(--primary) / 0.60)",
          700: "hsl(var(--primary) / 0.70)",
          800: "hsl(var(--primary) / 0.80)",
          900: "hsl(var(--primary) / 0.90)",
        },
        
        // Secondary warmth system with complete opacity scale
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
          active: "hsl(var(--secondary-active))",
          muted: "hsl(var(--secondary-muted))",
          50: "hsl(var(--secondary) / 0.05)",
          100: "hsl(var(--secondary) / 0.10)",
          200: "hsl(var(--secondary) / 0.20)",
          300: "hsl(var(--secondary) / 0.30)",
          400: "hsl(var(--secondary) / 0.40)",
          500: "hsl(var(--secondary) / 0.50)",
          600: "hsl(var(--secondary) / 0.60)",
          700: "hsl(var(--secondary) / 0.70)",
          800: "hsl(var(--secondary) / 0.80)",
          900: "hsl(var(--secondary) / 0.90)",
        },
        
        // Premium accent system
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          hover: "hsl(var(--accent-hover))",
          active: "hsl(var(--accent-active))",
          muted: "hsl(var(--accent-muted))",
          50: "hsl(var(--accent) / 0.05)",
          100: "hsl(var(--accent) / 0.10)",
          200: "hsl(var(--accent) / 0.20)",
          300: "hsl(var(--accent) / 0.30)",
          400: "hsl(var(--accent) / 0.40)",
          500: "hsl(var(--accent) / 0.50)",
          600: "hsl(var(--accent) / 0.60)",
          700: "hsl(var(--accent) / 0.70)",
          800: "hsl(var(--accent) / 0.80)",
          900: "hsl(var(--accent) / 0.90)",
        },
        
        // Property semantic colors - each type gets psychologically appropriate treatment
        property: {
          residential: {
            DEFAULT: "hsl(var(--property-residential))",
            foreground: "hsl(var(--property-residential-foreground))",
            muted: "hsl(var(--property-residential-muted))",
            hover: "hsl(var(--property-residential-hover))",
            50: "hsl(var(--property-residential) / 0.05)",
            100: "hsl(var(--property-residential) / 0.10)",
            200: "hsl(var(--property-residential) / 0.20)",
            300: "hsl(var(--property-residential) / 0.30)",
          },
          commercial: {
            DEFAULT: "hsl(var(--property-commercial))",
            foreground: "hsl(var(--property-commercial-foreground))",
            muted: "hsl(var(--property-commercial-muted))",
            hover: "hsl(var(--property-commercial-hover))",
            50: "hsl(var(--property-commercial) / 0.05)",
            100: "hsl(var(--property-commercial) / 0.10)",
            200: "hsl(var(--property-commercial) / 0.20)",
            300: "hsl(var(--property-commercial) / 0.30)",
          },
          featured: {
            DEFAULT: "hsl(var(--property-featured))",
            foreground: "hsl(var(--property-featured-foreground))",
            muted: "hsl(var(--property-featured-muted))",
            hover: "hsl(var(--property-featured-hover))",
            glow: "hsl(var(--property-featured-glow))",
            50: "hsl(var(--property-featured) / 0.05)",
            100: "hsl(var(--property-featured) / 0.10)",
            200: "hsl(var(--property-featured) / 0.20)",
            300: "hsl(var(--property-featured) / 0.30)",
          },
        },
        
        // Status communication system
        status: {
          success: {
            DEFAULT: "hsl(var(--status-success))",
            foreground: "hsl(var(--status-success-foreground))",
            muted: "hsl(var(--status-success-muted))",
            hover: "hsl(var(--status-success-hover))",
            50: "hsl(var(--status-success) / 0.05)",
            100: "hsl(var(--status-success) / 0.10)",
            200: "hsl(var(--status-success) / 0.20)",
            300: "hsl(var(--status-success) / 0.30)",
          },
          warning: {
            DEFAULT: "hsl(var(--status-warning))",
            foreground: "hsl(var(--status-warning-foreground))",
            muted: "hsl(var(--status-warning-muted))",
            hover: "hsl(var(--status-warning-hover))",
            50: "hsl(var(--status-warning) / 0.05)",
            100: "hsl(var(--status-warning) / 0.10)",
            200: "hsl(var(--status-warning) / 0.20)",
            300: "hsl(var(--status-warning) / 0.30)",
          },
          danger: {
            DEFAULT: "hsl(var(--status-danger))",
            foreground: "hsl(var(--status-danger-foreground))",
            muted: "hsl(var(--status-danger-muted))",
            hover: "hsl(var(--status-danger-hover))",
            50: "hsl(var(--status-danger) / 0.05)",
            100: "hsl(var(--status-danger) / 0.10)",
            200: "hsl(var(--status-danger) / 0.20)",
            300: "hsl(var(--status-danger) / 0.30)",
          },
        },
        
        // Enhanced UI component colors with comprehensive state management
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
          hover: "hsl(var(--card-hover))",
          active: "hsl(var(--card-active))",
          border: "hsl(var(--card-border))",
          muted: "hsl(var(--card-muted))",
        },
        
        // Standard utility colors
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
          muted: "hsl(var(--destructive-muted))",
          hover: "hsl(var(--destructive-hover))",
        },
        
        // Form and interaction colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        
        // Popover and dropdown colors
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
          border: "hsl(var(--popover-border))",
        },
        
        // Chart colors for data visualization
        chart: {
          primary: "hsl(var(--chart-primary))",
          secondary: "hsl(var(--chart-secondary))",
          accent: "hsl(var(--chart-accent))",
          success: "hsl(var(--chart-success))",
          warning: "hsl(var(--chart-warning))",
          danger: "hsl(var(--chart-danger))",
          // Muted variants for layered visualizations
          'primary-muted': "hsl(var(--chart-primary-muted))",
          'secondary-muted': "hsl(var(--chart-secondary-muted))",
          'accent-muted': "hsl(var(--chart-accent-muted))",
        },
      },
      
      /* 
        ANIMATION SYSTEM
        ===============
        Optimized keyframes for smooth micro-interactions that enhance
        the user experience without overwhelming the interface.
      */
      keyframes: {
        // Accordion animations for collapsible content
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        
        // Property-specific animations that reinforce brand psychology
        "property-hover": {
          "0%": { transform: "translateY(0) scale(1)" },
          "100%": { transform: "translateY(-4px) scale(1.02)" },
        },
        
        // Entrance animations with optimized timing for perceived performance
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        
        "slide-up": {
          "0%": { 
            transform: "translateY(20px)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateY(0)", 
            opacity: "1" 
          },
        },
        
        "slide-down": {
          "0%": { 
            transform: "translateY(-20px)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateY(0)", 
            opacity: "1" 
          },
        },
        
        "slide-left": {
          "0%": { 
            transform: "translateX(20px)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateX(0)", 
            opacity: "1" 
          },
        },
        
        "slide-right": {
          "0%": { 
            transform: "translateX(-20px)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateX(0)", 
            opacity: "1" 
          },
        },
        
        "scale-in": {
          "0%": { 
            transform: "scale(0.95)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "scale(1)", 
            opacity: "1" 
          },
        },
        
        "scale-out": {
          "0%": { 
            transform: "scale(1)", 
            opacity: "1" 
          },
          "100%": { 
            transform: "scale(0.95)", 
            opacity: "0" 
          },
        },
        
        // Premium animations for featured properties
        "glow-pulse": {
          "0%, 100%": { 
            boxShadow: "0 0 20px hsl(var(--property-featured) / 0.3)" 
          },
          "50%": { 
            boxShadow: "0 0 30px hsl(var(--property-featured) / 0.5)" 
          },
        },
        
        "featured-border": {
          "0%": { 
            borderColor: "hsl(var(--property-featured) / 0.5)" 
          },
          "50%": { 
            borderColor: "hsl(var(--property-featured) / 0.8)" 
          },
          "100%": { 
            borderColor: "hsl(var(--property-featured) / 0.5)" 
          },
        },
        
        // Loading and feedback animations
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.8" },
        },
        
        "bounce-soft": {
          "0%, 100%": { 
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)" 
          },
          "50%": { 
            transform: "translateY(-5px)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)" 
          },
        },
      },
      
      /* 
        ANIMATION UTILITIES
        ==================
        Semantic animation names with performance-optimized timing functions.
      */
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "property-hover": "property-hover 0.3s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "slide-down": "slide-down 0.4s ease-out",
        "slide-left": "slide-left 0.4s ease-out",
        "slide-right": "slide-right 0.4s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-in",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "featured-border": "featured-border 3s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "pulse-soft": "pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-soft": "bounce-soft 1s infinite",
      },
      
      /* 
        ENHANCED TRANSITION SYSTEM
        =========================
        Smooth transitions for professional interactions.
      */
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
        colors: "color, background-color, border-color, text-decoration-color, fill, stroke",
        shadow: "box-shadow, drop-shadow",
        transform: "transform",
        opacity: "opacity",
        'all-smooth': "all",
        'property-card': "transform, box-shadow, border-color, background-color",
      },
      
      transitionDuration: {
        250: "250ms",
        400: "400ms",
        600: "600ms",
        800: "800ms",
      },
      
      transitionTimingFunction: {
        'ease-out-back': "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
        'ease-in-out-circ': "cubic-bezier(0.785, 0.135, 0.15, 0.86)",
        'ease-out-expo': "cubic-bezier(0.19, 1, 0.22, 1)",
        'ease-in-out-quart': "cubic-bezier(0.77, 0, 0.175, 1)",
      },
      
      /* 
        ENHANCED SPACING SYSTEM
        ======================
        Additional spacing values for better layout consistency.
      */
      spacing: {
        15: "3.75rem", // 60px
        18: "4.5rem",  // 72px
        22: "5.5rem",  // 88px
        26: "6.5rem",  // 104px
        30: "7.5rem",  // 120px
        88: "22rem",   // 352px
        100: "25rem",  // 400px
        112: "28rem",  // 448px
        128: "32rem",  // 512px
      },
      
      /* 
        TYPOGRAPHY ENHANCEMENTS
        ======================
        Typography system that works with the fluid design approach.
      */
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }], // 10px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '3.5rem' }],      // 48px
        '6xl': ['3.75rem', { lineHeight: '4rem' }],     // 60px
      },
      
      fontWeight: {
        '450': '450', // Between normal and medium
        '550': '550', // Between medium and semibold
        '650': '650', // Between semibold and bold
      },
      
      /* 
        BOX SHADOW SYSTEM
        ================
        Shadows that reinforce brand psychology and create depth hierarchy.
      */
      boxShadow: {
        // Subtle shadows for general UI elements
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft': '0 2px 8px -1px rgba(0, 0, 0, 0.1), 0 1px 3px -1px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 16px -2px rgba(0, 0, 0, 0.1), 0 2px 6px -2px rgba(0, 0, 0, 0.06)',
        'hard': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        
        // Property-specific shadows using brand colors
        'property-warm': '0 4px 12px -1px hsl(var(--secondary) / 0.15), 0 2px 4px -1px hsl(var(--secondary) / 0.06)',
        'property-trust': '0 4px 12px -1px hsl(var(--primary) / 0.15), 0 2px 4px -1px hsl(var(--primary) / 0.06)',
        'property-premium': '0 4px 12px -1px hsl(var(--accent) / 0.15), 0 2px 4px -1px hsl(var(--accent) / 0.06)',
        'property-featured': '0 8px 25px -5px hsl(var(--property-featured) / 0.25), 0 4px 10px -5px hsl(var(--property-featured) / 0.1)',
        
        // Interactive state shadows
        'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'card-active': '0 4px 8px -2px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        
        // Elevation system
        'elevation-1': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'elevation-2': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'elevation-3': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'elevation-4': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'elevation-5': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      
      /* 
        BACKDROP EFFECTS
        ===============
        Modern glass effects for overlays and modals.
      */
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      
      backdropSaturate: {
        25: '.25',
        75: '.75',
        125: '1.25',
        150: '1.5',
        175: '1.75',
      },
      
      /* 
        TYPOGRAPHY SYSTEM
        ================
        Enhanced typography for real estate content hierarchy.
      */
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      
      letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      
      lineHeight: {
        '11': '2.75rem',
        '12': '3rem',
        '13': '3.25rem',
        '14': '3.5rem',
      },
      
      /* 
        GRID SYSTEM ENHANCEMENTS
        =======================
        Additional grid utilities for property layouts.
      */
      gridTemplateColumns: {
        'property-cards': 'repeat(auto-fit, minmax(300px, 1fr))',
        'property-details': '1fr 300px',
        'dashboard': '250px 1fr',
        'listing-grid': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
      
      gridTemplateRows: {
        'property-card': 'auto 1fr auto',
        'layout': 'auto 1fr auto',
      },
      
      /* 
        ASPECT RATIO UTILITIES
        =====================
        Common aspect ratios for property images and media.
      */
      aspectRatio: {
        'property': '4 / 3',
        'property-wide': '16 / 9',
        'property-square': '1 / 1',
        'property-tall': '3 / 4',
      },
      
      /* 
        Z-INDEX SYSTEM
        =============
        Consistent layering system for complex interfaces.
      */
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'fixed': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'popover': '1060',
        'tooltip': '1070',
        'toast': '1080',
        'max': '9999',
      },
      
      /* 
        CONTAINER SYSTEM
        ===============
        Responsive container utilities for consistent layouts.
      */
      maxWidth: {
        'property-card': '360px',
        'property-detail': '800px',
        'dashboard': '1400px',
        'content': '1200px',
      },
      
      /* 
        MINIMUM HEIGHT UTILITIES
        =======================
        Useful for layout consistency across different screen sizes.
      */
      minHeight: {
        'property-card': '400px',
        'hero': '60vh',
        'section': '300px',
        'modal': '200px',
      },
    },
  },
  
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms")
  ],
} satisfies Config;