"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppProviders = void 0;
var AuthContext_1 = require("../auth/contexts/AuthContext");
var PropertyContext_1 = require("../property/contexts/PropertyContext");
var ThemeContext_1 = require("../local/contexts/ThemeContext");
var TrustContext_1 = require("../trust/contexts/TrustContext");
var react_1 = require("react");
var AppProviders = function (_a) {
    var children = _a.children;
    return (<ThemeContext_1.ThemeProvider defaultTheme="dark">
      <AuthContext_1.AuthProvider>
        <PropertyContext_1.PropertyProvider>
          <TrustContext_1.TrustProvider>
            {children}
          </TrustContext_1.TrustProvider>
        </PropertyContext_1.PropertyProvider>
      </AuthContext_1.AuthProvider>
    </ThemeContext_1.ThemeProvider>);
};
exports.AppProviders = AppProviders;
