"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeToggle = ThemeToggle;
var ThemeContext_1 = require("../../contexts/ThemeContext");
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("./button");
var dropdown_menu_1 = require("./dropdown-menu");
var tooltip_1 = require("./tooltip");
// Enhanced theme configuration with improved type safety
var THEME_CONFIG = {
    light: {
        icon: lucide_react_1.Sun,
        label: "Light",
        description: "Clean, bright interface",
        shortcut: "⌘+L",
        key: "l",
    },
    dark: {
        icon: lucide_react_1.Moon,
        label: "Dark",
        description: "Easy on the eyes",
        shortcut: "⌘+D",
        key: "d",
    },
    system: {
        icon: lucide_react_1.Monitor,
        label: "System",
        description: "Follows system preference",
        shortcut: "⌘+S",
        key: "s",
    },
};
// Consolidated CSS classes with semantic naming
var STYLES = {
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
};
// Animation duration constant for consistency
var ANIMATION_DURATION = 200;
function ThemeToggle() {
    var _a = (0, ThemeContext_1.useTheme)(), theme = _a.theme, setTheme = _a.setTheme, resolvedTheme = _a.resolvedTheme;
    var _b = (0, react_1.useState)(false), isOpen = _b[0], setIsOpen = _b[1];
    var _c = (0, react_1.useState)(false), isAnimating = _c[0], setIsAnimating = _c[1];
    // Optimized keyboard shortcut handler with improved key mapping
    (0, react_1.useEffect)(function () {
        var handleKeyDown = function (event) {
            // Only proceed if meta/ctrl key is pressed
            if (!(event.metaKey || event.ctrlKey))
                return;
            var pressedKey = event.key.toLowerCase();
            // Find matching theme configuration by key
            var matchingTheme = Object.entries(THEME_CONFIG).find(function (_a) {
                var config = _a[1];
                return config.key === pressedKey;
            });
            if (matchingTheme) {
                event.preventDefault();
                var themeKey = matchingTheme[0];
                setTheme(themeKey);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return function () { return document.removeEventListener("keydown", handleKeyDown); };
    }, [setTheme]);
    // Memoized theme configuration getter with better error handling
    var getThemeConfig = (0, react_1.useCallback)(function (themeKey) {
        // Type guard to ensure we have a valid theme key
        if (themeKey in THEME_CONFIG) {
            return THEME_CONFIG[themeKey];
        }
        // Fallback to light theme if invalid key provided
        if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("Invalid theme key: ".concat(themeKey, ", falling back to light"));
        }
        return THEME_CONFIG.light;
    }, []);
    // Animation handler with consistent timing
    var triggerAnimation = (0, react_1.useCallback)(function () {
        setIsAnimating(true);
        // Use the same duration constant for consistency
        var timeoutId = setTimeout(function () { return setIsAnimating(false); }, ANIMATION_DURATION);
        // Return cleanup function for potential cancellation
        return function () { return clearTimeout(timeoutId); };
    }, []);
    // Current theme configuration (memoized for performance)
    var currentThemeConfig = (0, react_1.useMemo)(function () { return getThemeConfig(theme); }, [theme, getThemeConfig]);
    // Toggle button icon with improved animation logic
    var toggleButtonIcon = (0, react_1.useMemo)(function () {
        // Determine which theme icon to show based on current state
        var displayTheme = theme === "system" ? resolvedTheme : theme;
        var themeConfig = getThemeConfig(displayTheme);
        var IconComponent = themeConfig.icon;
        var iconStyles = "".concat(STYLES.icon.base, " ").concat(isAnimating ? STYLES.icon.animated : STYLES.icon.static);
        return <IconComponent className={iconStyles}/>;
    }, [theme, resolvedTheme, isAnimating, getThemeConfig]);
    // Enhanced theme change handler with proper cleanup
    var handleThemeChange = (0, react_1.useCallback)(function (selectedTheme) { return function () {
        // Prevent unnecessary state changes
        if (selectedTheme === theme)
            return;
        // Trigger animation and update theme
        var cleanup = triggerAnimation();
        setTheme(selectedTheme);
        setIsOpen(false);
        // Return cleanup function if needed
        return cleanup;
    }; }, [setTheme, theme, triggerAnimation]);
    // Cycle theme function - implements the cycling logic directly
    var cycleTheme = (0, react_1.useCallback)(function () {
        var nextTheme;
        if (theme === "light") {
            nextTheme = "dark";
        }
        else if (theme === "dark") {
            nextTheme = "system";
        }
        else {
            nextTheme = "light";
        }
        setTheme(nextTheme);
    }, [theme, setTheme]);
    // Quick toggle handler for direct button clicks
    var handleQuickToggle = (0, react_1.useCallback)(function () {
        triggerAnimation();
        cycleTheme();
    }, [cycleTheme, triggerAnimation]);
    // Optimized menu items generation with better accessibility
    var themeMenuItems = (0, react_1.useMemo)(function () {
        return Object.entries(THEME_CONFIG).map(function (_a) {
            var themeKey = _a[0], config = _a[1];
            var typedThemeKey = themeKey;
            var isSelected = theme === typedThemeKey;
            var IconComponent = config.icon, label = config.label, description = config.description, shortcut = config.shortcut;
            // Build className dynamically for better performance
            var itemClassName = [
                STYLES.menuItem.base,
                isSelected ? STYLES.menuItem.selected : STYLES.menuItem.hover,
            ].join(" ");
            return (<dropdown_menu_1.DropdownMenuItem key={themeKey} onClick={handleThemeChange(typedThemeKey)} className={itemClassName} role="menuitemradio" aria-checked={isSelected}>
          <div className="flex items-center gap-3">
            <IconComponent className="h-4 w-4"/>
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
            {isSelected && (<lucide_react_1.Check className="h-3 w-3 text-primary" aria-hidden="true"/>)}
          </div>
        </dropdown_menu_1.DropdownMenuItem>);
        });
    }, [theme, handleThemeChange]);
    // Build button className for better maintainability
    var buttonClassName = [
        STYLES.button.base,
        isOpen ? STYLES.button.active : "",
    ].join(" ");
    return (<tooltip_1.TooltipProvider>
      <tooltip_1.Tooltip>
        <dropdown_menu_1.DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <tooltip_1.TooltipTrigger asChild>
            <dropdown_menu_1.DropdownMenuTrigger asChild>
              <button_1.Button variant="ghost" size="icon" className={buttonClassName} onClick={isOpen ? undefined : handleQuickToggle} aria-label={"Toggle theme (current: ".concat(currentThemeConfig.label, ")")} aria-expanded={isOpen} aria-haspopup="menu">
                {toggleButtonIcon}
                <span className="sr-only">
                  Toggle theme - Current: {currentThemeConfig.label}
                </span>
              </button_1.Button>
            </dropdown_menu_1.DropdownMenuTrigger>
          </tooltip_1.TooltipTrigger>

          <tooltip_1.TooltipContent side="bottom" className="text-xs">
            <p>Theme: {currentThemeConfig.label}</p>
            <p className="text-muted-foreground">
              Click to cycle, or open menu
            </p>
          </tooltip_1.TooltipContent>

          <dropdown_menu_1.DropdownMenuContent align="end" className={STYLES.dropdown.container} role="menu" aria-label="Theme selection menu" sideOffset={8}>
            <dropdown_menu_1.DropdownMenuLabel className="flex items-center gap-2 px-2 py-1.5">
              <lucide_react_1.Palette className="h-4 w-4"/>
              <span>Choose Theme</span>
            </dropdown_menu_1.DropdownMenuLabel>

            <dropdown_menu_1.DropdownMenuSeparator />

            <div role="radiogroup" aria-label="Theme options">
              {themeMenuItems}
            </div>

            <dropdown_menu_1.DropdownMenuSeparator />

            <div className="px-2 py-1.5">
              <p className="text-xs text-muted-foreground">
                Use keyboard shortcuts: ⌘+L/D/S
              </p>
            </div>
          </dropdown_menu_1.DropdownMenuContent>
        </dropdown_menu_1.DropdownMenu>
      </tooltip_1.Tooltip>
    </tooltip_1.TooltipProvider>);
}
