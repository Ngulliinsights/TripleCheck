import React from "react";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size = "sm" | "md" | "lg" | "xl";
type Variant = "default" | "light" | "dark";

interface LogoProps {
  className?: string;
  size?: Size;
  variant?: Variant;
  interactive?: boolean;
  priority?: boolean;
  onClick?: () => void;
  href?: string;
  logoSrc?: string;
  alt?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-6 w-auto",
  md: "h-8 w-auto",
  lg: "h-10 w-auto",
  xl: "h-12 w-auto",
};

const VARIANT_FILTERS: Record<Variant, string> = {
  default: "",
  light: "brightness-0 invert brightness-110",
  dark: "brightness-90 contrast-110 saturate-105",
};

const INTERACTIVE_CLASSES =
  "cursor-pointer transition-all duration-200 ease-out " +
  "hover:scale-105 hover:brightness-110 active:scale-95 active:transition-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 " +
  "focus-visible:ring-offset-2 focus-visible:rounded-sm";

// ─── Component ────────────────────────────────────────────────────────────────

export function Logo({
  className,
  size = "md",
  variant = "default",
  interactive = true,
  priority = false,
  onClick,
  href = "/",
  logoSrc = "/assets/Artmark.svg",
  alt = "Artmark Logo",
}: LogoProps) {
  const imgClassName = cn(
    "select-none object-contain",
    SIZE_CLASSES[size],
    VARIANT_FILTERS[variant],
    interactive && INTERACTIVE_CLASSES,
    className
  );

  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.opacity = "0";
      if (import.meta.env.DEV) {
        console.warn(`[Logo] Image failed to load: ${logoSrc}`);
      }
    },
    [logoSrc]
  );

  const img = (
    <img
      src={logoSrc}
      alt={alt}
      className={imgClassName}
      loading={priority ? "eager" : "lazy"}
      fetchpriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      onError={handleError}
    />
  );

  // Non-interactive: render image only
  if (!interactive) return img;

  // Interactive with custom click handler (e.g. SPA dispatch)
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="inline-flex appearance-none border-0 bg-transparent p-0 focus:outline-none"
        aria-label={`${alt} - Go to home`}
      >
        {img}
      </button>
    );
  }

  // Default: semantic anchor link
  const isExternal =
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");

  return (
    <a
      href={href}
      aria-label={`${alt} - Navigate to ${href === "/" ? "home page" : href}`}
      {...(isExternal
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="inline-flex focus:outline-none"
    >
      {img}
    </a>
  );
}

Logo.displayName = "Logo";