import { useTheme } from "@shared/contexts/ThemeContext";
type Theme = "light" | "dark" | "system";
import { Moon, Sun, Monitor, Palette, Check } from "lucide-react";
import { useMemo, useCallback, useState, useEffect } from "react";

import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "./dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";

// Enhanced theme configuration with improved type safety
const THEME_CONFIG = {
  light: {
    icon: Sun,
    label: "Light",
    description: "Clean, bright interface",
    shortcut: "⌘+L",
    key: "l",
  },
  dark: {
    icon: Moon,
    label: "Dark",
    description: "Easy on the eyes",
    shortcut: "⌘+D",
    key: "d",
  },
  system: {
    icon: Monitor,
    label: "System",
    description: "Follows system preference",
    shortcut: "⌘+S",
    key: "s",
  },
} as const;

// Improved type extraction with better naming
type ThemeKey = keyof typeof THEME_CONFIG;
type ThemeConfigItem = (typeof THEME_CONFIG)[ThemeKey];

// Consolidated CSS classes with semantic naming
const STYLES = {
  button: {
    base: "h-9 w-9 transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
    active: "bg-accent text-accent-foreground",
  },
  menuItem: {
    base: "flex items-center justify-between gap-3 cursor-pointer px-3 py-2 rounded-sm transition-colors",
    hover: "hover:bg-accent/50",
    selected: "bg-accent text-accent-foreground",
  },
  dropdown: {
    container: "min-w-[280px] p-2 animate-in fade-in-0 zoom-in-95 duration-200",
  },
  icon: {
    base: "h-4 w-4 transition-transform duration-200",
    animated: "scale-110",
    static: "scale-100",
  },
} as const;

// Animation duration constant for consistency
const ANIMATION_DURATION = 200;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Optimized keyboard shortcut handler with improved key mapping
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only proceed if meta/ctrl key is pressed
      if (!(event.metaKey || event.ctrlKey)) return;

      const pressedKey = event.key.toLowerCase();

      // Find matching theme configuration by key
      const matchingTheme = Object.entries(THEME_CONFIG).find(
        ([, config]) => config.key === pressedKey
      );

      if (matchingTheme) {
        event.preventDefault();
        const [themeKey] = matchingTheme;
        setTheme(themeKey as ThemeKey);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setTheme]);

  // Memoized theme configuration getter with better error handling
  const getThemeConfig = useCallback((themeKey: string): ThemeConfigItem => {
    // Type guard to ensure we have a valid theme key
    if (themeKey in THEME_CONFIG) {
      return THEME_CONFIG[themeKey as ThemeKey];
    }

    // Fallback to light theme if invalid key provided
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.warn(`Invalid theme key: ${themeKey}, falling back to light`);
    }
    return THEME_CONFIG.light;
  }, []);

  // Animation handler with consistent timing
  const triggerAnimation = useCallback(() => {
    setIsAnimating(true);
    // Use the same duration constant for consistency
    const timeoutId = setTimeout(
      () => setIsAnimating(false),
      ANIMATION_DURATION
    );

    // Return cleanup function for potential cancellation
    return () => clearTimeout(timeoutId);
  }, []);

  // Current theme configuration (memoized for performance)
  const currentThemeConfig = useMemo(
    () => getThemeConfig(theme),
    [theme, getThemeConfig]
  );

  // Toggle button icon with improved animation logic
  const toggleButtonIcon = useMemo(() => {
    // Determine which theme icon to show based on current state
    const displayTheme = theme === "system" ? resolvedTheme : theme;
    const themeConfig = getThemeConfig(displayTheme);
    const IconComponent = themeConfig.icon;

    const iconStyles = `${STYLES.icon.base} ${
      isAnimating ? STYLES.icon.animated : STYLES.icon.static
    }`;

    return <IconComponent className={iconStyles} />;
  }, [theme, resolvedTheme, isAnimating, getThemeConfig]);

  // Enhanced theme change handler with proper cleanup
  const handleThemeChange = useCallback(
    (selectedTheme: ThemeKey) => () => {
      // Prevent unnecessary state changes
      if (selectedTheme === theme) return;

      // Trigger animation and update theme
      const cleanup = triggerAnimation();
      setTheme(selectedTheme);
      setIsOpen(false);

      // Return cleanup function if needed
      return cleanup;
    },
    [setTheme, theme, triggerAnimation]
  );

  // Cycle theme function - implements the cycling logic directly
  const cycleTheme = useCallback(() => {
    let nextTheme: Theme;
    if (theme === "light") {
      nextTheme = "dark";
    } else if (theme === "dark") {
      nextTheme = "system";
    } else {
      nextTheme = "light";
    }
    setTheme(nextTheme);
  }, [theme, setTheme]);

  // Quick toggle handler for direct button clicks
  const handleQuickToggle = useCallback(() => {
    triggerAnimation();
    cycleTheme();
  }, [cycleTheme, triggerAnimation]);

  // Optimized menu items generation with better accessibility
  const themeMenuItems = useMemo(() => {
    return Object.entries(THEME_CONFIG).map(([themeKey, config]) => {
      const typedThemeKey = themeKey as ThemeKey;
      const isSelected = theme === typedThemeKey;
      const { icon: IconComponent, label, description, shortcut } = config;

      // Build className dynamically for better performance
      const itemClassName = [
        STYLES.menuItem.base,
        isSelected ? STYLES.menuItem.selected : STYLES.menuItem.hover,
      ].join(" ");

      return (
        <DropdownMenuItem
          key={themeKey}
          onClick={handleThemeChange(typedThemeKey)}
          className={itemClassName}
          role="menuitemradio"
          aria-checked={isSelected}
        >
          <div className="flex items-center gap-3">
            <IconComponent className="h-4 w-4" />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">
                {description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">
              {shortcut}
            </span>
            {isSelected && (
              <Check className="h-3 w-3 text-primary" aria-hidden="true" />
            )}
          </div>
        </DropdownMenuItem>
      );
    });
  }, [theme, handleThemeChange]);

  // Build button className for better maintainability
  const buttonClassName = [
    STYLES.button.base,
    isOpen ? STYLES.button.active : "",
  ].join(" ");

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={buttonClassName}
                onClick={isOpen ? undefined : handleQuickToggle}
                aria-label={`Toggle theme (current: ${currentThemeConfig.label})`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
              >
                {toggleButtonIcon}
                <span className="sr-only">
                  Toggle theme - Current: {currentThemeConfig.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom" className="text-xs">
            <p>Theme: {currentThemeConfig.label}</p>
            <p className="text-muted-foreground">
              Click to cycle, or open menu
            </p>
          </TooltipContent>

          <DropdownMenuContent
            align="end"
            className={STYLES.dropdown.container}
            role="menu"
            aria-label="Theme selection menu"
            sideOffset={8}
          >
            <DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5">
              <Palette className="h-4 w-4" />
              <span>Choose Theme</span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <div role="radiogroup" aria-label="Theme options">
              {themeMenuItems}
            </div>

            <DropdownMenuSeparator />

            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                Use keyboard shortcuts: ⌘+L/D/S
              </p>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
