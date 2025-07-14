import { OptimizedImage } from "@/components/ui/optimized-image";
import { images } from "@/config/images";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "light" | "dark";
}

export function Logo({ 
  className,
  size = "md",
  variant = "default"
}: LogoProps) {
  const sizes = {
    sm: "h-6",
    md: "h-8",
    lg: "h-10"
  };

  const variants = {
    default: "brightness-110 contrast-125", // Enhanced visibility
    light: "brightness-0 invert brightness-110", // Brighter white
    dark: "brightness-0 contrast-125" // Deeper black
  };

  // Container styles for consistent logo presentation
  const containerStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-300";
  const containerVariants = {
    default: "bg-white/15 hover:bg-white/25 backdrop-blur-sm",
    light: "bg-black/15 hover:bg-black/25 backdrop-blur-sm",
    dark: "bg-white/15 hover:bg-white/25 backdrop-blur-sm"
  };

  // Enhanced drop shadow based on variant
  const shadowVariants = {
    default: "drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.4)]",
    light: "drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] hover:drop-shadow-[0_0_16px_rgba(255,255,255,0.3)]",
    dark: "drop-shadow-[0_0_12px_rgba(0,0,0,0.2)] hover:drop-shadow-[0_0_16px_rgba(0,0,0,0.3)]"
  };

  return (
    <div className={cn(
      containerStyles,
      containerVariants[variant],
      "p-3", // Slightly more padding
      "transform hover:scale-105", // Subtle grow effect on hover
      className
    )}>
      <OptimizedImage
        fallbackSrc={images.logo}
        alt="TripleCheck Logo"
        className={cn(
          sizes[size],
          variants[variant],
          shadowVariants[variant],
          "transition-all duration-300",
          "transform hover:rotate-[5deg]", // Subtle rotation on hover
          "filter hover:saturate-150" // Increased color saturation on hover
        )}
      />
    </div>
  );
}
