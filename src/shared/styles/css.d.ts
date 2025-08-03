// CSS Module type definitions for better IDE support
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}

// CSS Custom Properties type definitions
declare global {
  interface CSSStyleDeclaration {
    "--background": string;
    "--foreground": string;
    "--primary": string;
    "--primary-foreground": string;
    "--primary-hover": string;
    "--primary-active": string;
    "--primary-muted": string;
    "--secondary": string;
    "--secondary-foreground": string;
    "--secondary-hover": string;
    "--secondary-active": string;
    "--secondary-muted": string;
    "--accent": string;
    "--accent-foreground": string;
    "--accent-hover": string;
    "--accent-active": string;
    "--accent-muted": string;
    "--property-residential": string;
    "--property-commercial": string;
    "--property-featured": string;
    "--property-luxury": string;
    "--trust-verified": string;
    "--trust-pending": string;
    "--trust-warning": string;
    "--trust-danger": string;
    "--status-success": string;
    "--status-warning": string;
    "--status-error": string;
    "--status-info": string;
    "--muted": string;
    "--muted-foreground": string;
    "--border": string;
    "--input": string;
    "--ring": string;
    "--card": string;
    "--card-foreground": string;
    "--card-hover": string;
    "--card-border": string;
    "--destructive": string;
    "--destructive-foreground": string;
    "--destructive-hover": string;
    "--glass-blur": string;
    "--glass-opacity": string;
    "--glass-border": string;
    "--glass-shadow": string;
    "--nav-height": string;
    "--dark-gradient": string;
    "--radius": string;
  }
}

export {};
