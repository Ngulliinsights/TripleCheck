"use strict";
/**
 * PageWrapper Component
 *
 * A wrapper component that provides consistent layout and spacing for pages,
 * ensuring proper navbar clearance and responsive behavior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageWrapper = PageWrapper;
exports.HeroSection = HeroSection;
var react_1 = require("react");
var NavbarSpacer_1 = require("./NavbarSpacer");
var utils_1 = require("@/local/lib/utils");
/**
 * PageWrapper provides consistent page layout with proper navbar spacing
 *
 * @param hasHero - Whether the page has a hero section (affects spacing)
 * @param fullHeight - Whether the page should take full viewport height
 * @param navbarSpacing - Type of navbar spacing to apply
 */
function PageWrapper(_a) {
    var children = _a.children, className = _a.className, _b = _a.hasHero, hasHero = _b === void 0 ? false : _b, _c = _a.fullHeight, fullHeight = _c === void 0 ? false : _c, _d = _a.navbarSpacing, navbarSpacing = _d === void 0 ? 'default' : _d;
    return (<div className={(0, utils_1.cn)('w-full', fullHeight && 'min-h-screen', className)}>
      {/* Add navbar spacing unless explicitly disabled */}
      {navbarSpacing !== 'none' && (<NavbarSpacer_1.NavbarSpacer variant={hasHero ? 'hero' : navbarSpacing}/>)}
      
      {children}
    </div>);
}
function HeroSection(_a) {
    var children = _a.children, className = _a.className, backgroundClassName = _a.backgroundClassName;
    return (<div className={(0, utils_1.cn)('relative', backgroundClassName)}>
      {/* Navbar spacing specifically for hero sections */}
      <NavbarSpacer_1.NavbarSpacer variant="hero"/>
      
      <div className={(0, utils_1.cn)('relative isolate overflow-hidden', className)}>
        {children}
      </div>
    </div>);
}
