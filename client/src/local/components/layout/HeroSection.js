"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeroSection = HeroSection;
var react_1 = require("react");
var utils_1 = require("@/local/lib/utils");
function HeroSection(_a) {
    var backgroundImage = _a.backgroundImage, title = _a.title, subtitle = _a.subtitle, children = _a.children, className = _a.className, _b = _a.parallaxIntensity, parallaxIntensity = _b === void 0 ? 0.5 : _b, _c = _a.overlayOpacity, overlayOpacity = _c === void 0 ? 0.4 : _c, _d = _a.minHeight, minHeight = _d === void 0 ? '100vh' : _d;
    var heroRef = (0, react_1.useRef)(null);
    var _e = (0, react_1.useState)(0), scrollY = _e[0], setScrollY = _e[1];
    (0, react_1.useEffect)(function () {
        var handleScroll = function () {
            if (heroRef.current) {
                var rect = heroRef.current.getBoundingClientRect();
                var scrolled = window.pageYOffset;
                var rate = scrolled * -parallaxIntensity;
                if (rect.bottom >= 0) {
                    setScrollY(rate);
                }
            }
        };
        // Throttle scroll events for performance
        var ticking = false;
        var throttledScroll = function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    handleScroll();
                    ticking = false;
                });
                ticking = true;
            }
        };
        window.addEventListener('scroll', throttledScroll, { passive: true });
        return function () { return window.removeEventListener('scroll', throttledScroll); };
    }, [parallaxIntensity]);
    return (<section ref={heroRef} className={(0, utils_1.cn)('relative overflow-hidden flex items-center justify-center', className)} style={{ minHeight: minHeight }}>
      {/* Background Image with Parallax */}
      {backgroundImage && (<div className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform" style={{
                backgroundImage: "url(".concat(backgroundImage, ")"),
                transform: "translateY(".concat(scrollY, "px)"),
                scale: '1.1' // Slight scale to prevent gaps during parallax
            }}/>)}

      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60 transition-opacity duration-300" style={{ opacity: overlayOpacity }}/>

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-fluid-4xl font-bold leading-tight tracking-tight">
            {title}
          </h1>
          
          {subtitle && (<p className="text-fluid-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              {subtitle}
            </p>)}
          
          {children && (<div className="mt-8">
              {children}
            </div>)}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"/>
        </div>
      </div>
    </section>);
}
