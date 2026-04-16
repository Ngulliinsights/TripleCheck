"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppLayout = AppLayout;
var react_1 = require("react");
function AppLayout(_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? '' : _b;
    return (<div className={"min-h-screen bg-gray-50 ".concat(className)}>
      {children}
    </div>);
}
exports.default = AppLayout;
