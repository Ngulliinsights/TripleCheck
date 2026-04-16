"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePropertyCardState = usePropertyCardState;
var react_1 = require("react");
/**
 * Enhanced shared hook for managing property card UI state
 * Handles hover, focus, active states and keyboard interactions with accessibility support
 * Used by PropertyCard, EnhancedLandCard, and other interactive property components
 *
 * @param options - Configuration options for state management
 * @returns State values and event handlers
 */
function usePropertyCardState(options) {
    if (options === void 0) { options = {}; }
    var _a = options.enableHover, enableHover = _a === void 0 ? true : _a, _b = options.enableFocus, enableFocus = _b === void 0 ? true : _b, _c = options.enableKeyboard, enableKeyboard = _c === void 0 ? true : _c, onStateChange = options.onStateChange;
    var _d = (0, react_1.useState)(false), isHovered = _d[0], setIsHovered = _d[1];
    var _e = (0, react_1.useState)(false), isFocused = _e[0], setIsFocused = _e[1];
    var _f = (0, react_1.useState)(false), isActive = _f[0], setIsActive = _f[1];
    var cardRef = (0, react_1.useRef)(null);
    var handleMouseEnter = (0, react_1.useCallback)(function () {
        if (enableHover) {
            setIsHovered(true);
            onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange('hover', true);
        }
    }, [enableHover, onStateChange]);
    var handleMouseLeave = (0, react_1.useCallback)(function () {
        if (enableHover) {
            setIsHovered(false);
            setIsActive(false); // Reset active state when mouse leaves
            onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange('hover', false);
        }
    }, [enableHover, onStateChange]);
    var handleMouseDown = (0, react_1.useCallback)(function () {
        setIsActive(true);
    }, []);
    var handleMouseUp = (0, react_1.useCallback)(function () {
        setIsActive(false);
    }, []);
    var handleFocus = (0, react_1.useCallback)(function () {
        if (enableFocus) {
            setIsFocused(true);
            onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange('focus', true);
        }
    }, [enableFocus, onStateChange]);
    var handleBlur = (0, react_1.useCallback)(function () {
        if (enableFocus) {
            setIsFocused(false);
            setIsActive(false); // Reset active state when focus is lost
            onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange('blur', false);
        }
    }, [enableFocus, onStateChange]);
    var handleKeyDown = (0, react_1.useCallback)(function (event, onClick) {
        if (!enableKeyboard || !onClick)
            return;
        switch (event.key) {
            case "Enter":
            case " ": // Space key
                event.preventDefault();
                setIsActive(true);
                onClick();
                // Reset active state after a short delay
                setTimeout(function () { return setIsActive(false); }, 150);
                break;
            case "Escape":
                // Remove focus from the card
                if (cardRef.current) {
                    cardRef.current.blur();
                }
                break;
            default:
                break;
        }
    }, [enableKeyboard]);
    // Handle global mouse up to reset active state
    (0, react_1.useEffect)(function () {
        var handleGlobalMouseUp = function () {
            setIsActive(false);
        };
        document.addEventListener('mouseup', handleGlobalMouseUp);
        return function () {
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, []);
    // Manual setter with analytics
    var setIsHoveredWithAnalytics = (0, react_1.useCallback)(function (hovered) {
        setIsHovered(hovered);
        onStateChange === null || onStateChange === void 0 ? void 0 : onStateChange('hover', hovered);
    }, [onStateChange]);
    return {
        isHovered: isHovered,
        isFocused: isFocused,
        isActive: isActive,
        setIsHovered: setIsHoveredWithAnalytics,
        handleMouseEnter: handleMouseEnter,
        handleMouseLeave: handleMouseLeave,
        handleMouseDown: handleMouseDown,
        handleMouseUp: handleMouseUp,
        handleFocus: handleFocus,
        handleBlur: handleBlur,
        handleKeyDown: handleKeyDown,
        cardRef: cardRef,
    };
}
exports.default = usePropertyCardState;
