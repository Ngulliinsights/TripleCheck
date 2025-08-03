import { useTheme } from "@shared/contexts/ThemeContext";
import {
  Moon,
  Sun,
  Monitor,
  Palette,
  Check,
} from "lucide-react";
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

// Define theme options with enhanced metadata
const THEME_OPTIONS = {
  light: {
    icon: Sun,
    label: "Light",
    description: "Clean, bright interface",
    shortcut: "⌘+L",
  },
  dark: {
    icon: Moon,
    label: "Dark",
    description: "Easy on the eyes",
    shortcut: "⌘+D",
  },
  system: {
    icon: Monitor,
    label: "System",
    description: "Follows system preference",
    shortcut: "⌘+S",
  },
} as const;

// Extract theme type from the options for better type safety
type ThemeOption = keyof typeof THEME_OPTIONS;



// Animation variants for smooth transitions
const ANIMATION_CLASSES = {
  enter: "animate-in fade-in-0 zoom-in-95 duration-200",
  exit: "animate-out fade-out-0 zoom-out-95 duration-200",
} as const;

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Keyboard shortcuts for theme switching
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey) {
        switch (event.key.toLowerCase()) {
          case "l":
            event.preventDefault();
            setTheme("light");
            break;
          case "d":
            event.preventDefault();
            setTheme("dark");
            break;
          case "s":
            event.preventDefault();
            setTheme("system");
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [setTheme]);

  // Memoize the current theme configuration based on resolved theme
  const currentThemeConfig = useMemo(() => {
    return THEME_OPTIONS[resolvedTheme as ThemeOption] ?? THEME_OPTIONS.system;
  }, [resolvedTheme]);

  // Memoize the current theme icon with animation support
  const currentThemeIcon = useMemo(() => {
    const { icon: ThemeIcon } = currentThemeConfig;
    return (
      <ThemeIcon
        className={`h-4 w-4 transition-transform duration-200 ${
          isAnimating ? "scale-110" : "scale-100"
        }`}
      />
    );
  }, [currentThemeConfig, isAnimating]);

  // Enhanced theme change handler with animation
  const handleThemeChange = useCallback(
    (selectedTheme: ThemeOption) => {
      return () => {
        if (selectedTheme !== theme) {
          setIsAnimating(true);
          setTheme(selectedTheme);
          setIsOpen(false);

          // Reset animation state
          setTimeout(() => setIsAnimating(false), 200);

          // Store user preference
          localStorage.setItem("theme-preference", selectedTheme);
        }
      };
    },
    [setTheme, theme]
  );

  // Generate enhanced theme menu items
  const themeMenuItems = useMemo(() => {
    return Object.entries(THEME_OPTIONS).map(([themeKey, config]) => {
      const { icon: IconComponent, label, description, shortcut } = config;
      const themeOption = themeKey as ThemeOption;
      const isSelected = theme === themeOption;

      return (
        <DropdownMenuItem
          key={themeKey}
          onClick={handleThemeChange(themeOption)}
          className={`flex items-center justify-between gap-3 cursor-pointer px-3 py-2 rounded-sm transition-colors ${
            isSelected ?
              "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
          }`}
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
            {isSelected && <Check className="h-3 w-3 text-primary" />}
          </div>
        </DropdownMenuItem>
      );
    });
  }, [theme, handleThemeChange]);

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={`h-9 w-9 transition-all duration-200 hover:bg-accent hover:text-accent-foreground ${
                  isOpen ? "bg-accent text-accent-foreground" : ""
                }`}
                aria-label={`Toggle theme (current: ${currentThemeConfig.label})`}
                aria-expanded={isOpen}
                aria-haspopup="menu"
              >
                {currentThemeIcon}
                <span className="sr-only">
                  Toggle theme - Current: {currentThemeConfig.label}
                </span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>

          <TooltipContent side="bottom" className="text-xs">
            <p>Theme: {currentThemeConfig.label}</p>
            <p className="text-muted-foreground">Click to change</p>
          </TooltipContent>

          <DropdownMenuContent
            align="end"
            className={`min-w-[280px] p-2 ${ANIMATION_CLASSES.enter}`}
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
