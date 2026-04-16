"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileNavFallback = MobileNavFallback;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
/**
 * Simple fallback mobile navigation for when the main MobileNav crashes
 * This provides basic mobile navigation without complex animations or gestures
 */
function MobileNavFallback() {
    var _a = (0, react_1.useState)(false), isOpen = _a[0], setIsOpen = _a[1];
    var handleNavigation = function (href) {
        try {
            setIsOpen(false);
            window.location.href = href;
        }
        catch (error) {
            console.error('Mobile nav fallback navigation failed:', error);
            window.location.href = '/';
        }
    };
    var toggleMenu = function () {
        setIsOpen(!isOpen);
    };
    return (<>
      {/* Menu trigger button */}
      <button onClick={toggleMenu} className="lg:hidden p-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100" aria-label="Toggle mobile menu">
        <lucide_react_1.Menu className="h-5 w-5"/>
      </button>

      {/* Simple overlay menu */}
      {isOpen && (<div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={function () { return setIsOpen(false); }}/>
          
          {/* Menu panel */}
          <div className="fixed top-0 left-0 w-80 h-full bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2 text-xl font-bold text-primary">
                <lucide_react_1.Home className="w-6 h-6"/>
                TripleCheck
              </div>
              <button onClick={function () { return setIsOpen(false); }} className="p-2 rounded-md text-gray-500 hover:text-gray-700" aria-label="Close menu">
                <lucide_react_1.X className="h-5 w-5"/>
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <lucide_react_1.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"/>
                <input type="search" placeholder="Search properties..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary" onKeyPress={function (e) {
                if (e.key === 'Enter') {
                    var query = e.target.value;
                    if (query.trim()) {
                        handleNavigation("/search?q=".concat(encodeURIComponent(query.trim())));
                    }
                }
            }}/>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="p-4">
              <div className="space-y-2">
                <button onClick={function () { return handleNavigation('/'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100">
                  Home
                </button>
                <button onClick={function () { return handleNavigation('/properties'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100">
                  Properties
                </button>
                <button onClick={function () { return handleNavigation('/services'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100">
                  Services
                </button>
                <button onClick={function () { return handleNavigation('/pricing'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100">
                  Pricing
                </button>
                <button onClick={function () { return handleNavigation('/help'); }} className="w-full text-left px-3 py-2 rounded-md text-gray-700 hover:text-primary hover:bg-gray-100">
                  Help
                </button>
              </div>

              {/* Auth buttons */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <button onClick={function () { return handleNavigation('/auth/login'); }} className="w-full px-4 py-2 text-primary border border-primary rounded-md hover:bg-primary hover:text-white">
                  Login
                </button>
                <button onClick={function () { return handleNavigation('/auth/register'); }} className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">
                  Get Started
                </button>
              </div>
            </nav>
          </div>
        </div>)}
    </>);
}
