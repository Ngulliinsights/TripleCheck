"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.B2BNotificationBanner = B2BNotificationBanner;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../ui/button");
var utils_1 = require("../../lib/utils");
function B2BNotificationBanner(_a) {
    var className = _a.className, _b = _a.variant, variant = _b === void 0 ? 'default' : _b, _c = _a.dismissible, dismissible = _c === void 0 ? true : _c, _d = _a.showAnimation, showAnimation = _d === void 0 ? true : _d;
    var _e = (0, react_1.useState)(true), isVisible = _e[0], setIsVisible = _e[1];
    var _f = (0, react_1.useState)(false), isAnimating = _f[0], setIsAnimating = _f[1];
    if (!isVisible)
        return null;
    var handleGetStarted = function () {
        setIsAnimating(true);
        // Track B2B interest
        if (window === null || window === void 0 ? void 0 : window.gtag) {
            window.gtag('event', 'b2b_interest', {
                event_category: 'B2B',
                event_label: 'banner_click'
            });
        }
        // Navigate to API demo or contact form
        window.location.href = '/api-demo';
    };
    var handleDismiss = function () {
        setIsVisible(false);
        // Store dismissal in localStorage
        if (typeof window !== 'undefined') {
            localStorage.setItem('b2b-banner-dismissed', Date.now().toString());
        }
    };
    var baseClasses = (0, utils_1.cn)('relative overflow-hidden transition-all duration-300 ease-out', showAnimation && 'animate-slide-down', className);
    if (variant === 'compact') {
        return (<div className={(0, utils_1.cn)(baseClasses, 'bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2')}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <lucide_react_1.Building2 className="w-4 h-4 flex-shrink-0"/>
              <span className="text-sm font-medium">
                <strong>For Businesses:</strong> Integrate our verification API into your platform
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button_1.Button size="sm" variant="secondary" onClick={handleGetStarted} disabled={isAnimating} className="text-xs bg-white/20 hover:bg-white/30 text-white border-white/30">
                {isAnimating ? 'Loading...' : 'Learn More'}
                <lucide_react_1.ArrowRight className="w-3 h-3 ml-1"/>
              </button_1.Button>
              {dismissible && (<button onClick={handleDismiss} className="text-white/80 hover:text-white transition-colors p-1" aria-label="Dismiss notification">
                  <lucide_react_1.X className="w-4 h-4"/>
                </button>)}
            </div>
          </div>
        </div>
      </div>);
    }
    if (variant === 'prominent') {
        return (<div className={(0, utils_1.cn)(baseClasses, 'bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 border-l-4 border-blue-500 shadow-lg')}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <lucide_react_1.Building2 className="w-6 h-6 text-blue-600"/>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Enterprise Land Verification API
                </h3>
                <p className="text-gray-600 mb-3 leading-relaxed">
                  See how our verification works? Integrate this power into your platform with our API. 
                  Banks, real estate platforms, and insurance companies trust our Kenya-specific verification engine.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <lucide_react_1.Zap className="w-4 h-4 mr-1 text-yellow-500"/>
                    <span>10-minute verification vs 30+ day manual process</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    <span>95% fraud detection accuracy</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 ml-4">
              <button_1.Button onClick={handleGetStarted} disabled={isAnimating} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isAnimating ? 'Loading...' : 'View API Demo'}
                <lucide_react_1.ArrowRight className="w-4 h-4 ml-2"/>
              </button_1.Button>
              {dismissible && (<button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 transition-colors p-2" aria-label="Dismiss notification">
                  <lucide_react_1.X className="w-5 h-5"/>
                </button>)}
            </div>
          </div>
        </div>
      </div>);
    }
    // Default variant
    return (<div className={(0, utils_1.cn)(baseClasses, 'bg-blue-50 border-l-4 border-blue-400 shadow-sm')}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-1.5 rounded">
              <lucide_react_1.Building2 className="w-5 h-5 text-blue-600"/>
            </div>
            <div>
              <p className="text-sm text-blue-800">
                <strong>For Businesses:</strong> Integrate this verification power into your platform with our API.
                <span className="ml-2 text-blue-600 underline cursor-pointer hover:text-blue-800">
                  See how it works →
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button_1.Button size="sm" onClick={handleGetStarted} disabled={isAnimating} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
              {isAnimating ? 'Loading...' : 'Get API Access'}
            </button_1.Button>
            {dismissible && (<button onClick={handleDismiss} className="text-blue-400 hover:text-blue-600 transition-colors p-1" aria-label="Dismiss notification">
                <lucide_react_1.X className="w-4 h-4"/>
              </button>)}
          </div>
        </div>
      </div>
    </div>);
}
