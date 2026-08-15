import React from "react";
import { cn } from "../../lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Size    = "sm" | "md" | "lg" | "xl";
type Variant = "default" | "light" | "dark";

export interface LogoProps {
  className?:   string;
  size?:        Size;
  variant?:     Variant;
  interactive?: boolean;
  priority?:    boolean;
  onClick?:     () => void;
  href?:        string;
  logoSrc?:     string;
  alt?:         string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-6  w-auto",
  md: "h-8  w-auto",
  lg: "h-10 w-auto",
  xl: "h-12 w-auto",
};

const VARIANT_FILTERS: Record<Variant, string> = {
  default: "",
  // Fix: the original stacked "brightness-0 invert brightness-110".
  // Tailwind emits both filter declarations but CSS applies the last one,
  // so `brightness-110` was silently overriding `invert`. Pure white only
  // needs brightness-0 (black silhouette) + invert.
  light: "brightness-0 invert",
  dark:  "brightness-90 contrast-110 saturate-105",
};

// Visual transforms applied to the <img> element.
// Focus ring is intentionally absent here — images inside interactive
// wrappers are never the focused element, so ring styles on <img>
// never fire. They belong on <button> / <a> (see WRAPPER_FOCUS below).
const IMG_INTERACTIVE =
  "transition-[transform,filter] duration-200 ease-out " +
  "hover:scale-105 hover:brightness-110 " +
  "active:scale-95 active:transition-none"; // transition-none on :active for a snappy press feel

// Focus ring lives on the focusable wrapper, not the image.
// Uses the design-system --ring token instead of a hardcoded colour
// so it responds correctly to theme changes and high-contrast mode.
const WRAPPER_FOCUS =
  "focus:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] " +
  "focus-visible:ring-offset-2 focus-visible:rounded-sm";

// ─── Component ────────────────────────────────────────────────────────────────

export function Logo({
  className,
  size        = "md",
  variant     = "default",
  interactive = true,
  priority    = false,
  onClick,
  href        = "/",
  logoSrc     = "/assets/Artmark.svg",
  alt         = "Artmark Logo",
}: LogoProps) {
  // Collapse to invisible on load failure rather than showing a broken-image
  // icon. The DEV warning keeps it debuggable without leaking noise in prod.
  const handleError = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.opacity = "0";
      if (import.meta.env.DEV) {
        console.warn(`[Logo] Failed to load: ${logoSrc}`);
      }
    },
    [logoSrc],
  );

  const img = (
    <img
      src={logoSrc}
      alt={alt}
      className={cn(
        "select-none object-contain",
        SIZE_CLASSES[size],
        VARIANT_FILTERS[variant],
        interactive && IMG_INTERACTIVE,
        className,
      )}
      // React 18 maps fetchPriority (camelCase) → fetchpriority attribute.
      // Using lowercase directly is an HTML attribute, not a React prop,
      // and causes TypeScript errors in strict mode.
      fetchPriority={priority ? "high" : "auto"}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onError={handleError}
    />
  );

  // ── Non-interactive ─────────────────────────────────────────────────────────
  if (!interactive) return img;

  // ── Button (custom SPA dispatch) ────────────────────────────────────────────
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        // Concise aria-label: the alt text identifies the brand; "button"
        // role is already announced by assistive tech, so no need to add
        // "Go to home" — that belongs on the anchor variant below.
        aria-label={alt}
        className={cn(
          "inline-flex appearance-none border-0 bg-transparent p-0",
          WRAPPER_FOCUS,
        )}
      >
        {img}
      </button>
    );
  }

  // ── Anchor (default navigation) ─────────────────────────────────────────────
  const isExternal =
    href.startsWith("http") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:");

  return (
    <a
      href={href}
      // The anchor's accessible name is derived from the child image's alt
      // text automatically, but an explicit aria-label makes the destination
      // unambiguous for screen-reader users who navigate by links.
      aria-label={href === "/" ? `${alt} — home` : alt}
      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn("inline-flex", WRAPPER_FOCUS)}
    >
      {img}
    </a>
  );
}

Logo.displayName = "Logo";