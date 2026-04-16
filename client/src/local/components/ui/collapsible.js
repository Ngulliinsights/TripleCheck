"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CollapsibleContent = exports.CollapsibleTrigger = exports.Collapsible = void 0;
var CollapsiblePrimitive = require("@radix-ui/react-collapsible");
var React = require("react");
var Collapsible = CollapsiblePrimitive.Root;
exports.Collapsible = Collapsible;
var CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger;
exports.CollapsibleTrigger = CollapsibleTrigger;
var CollapsibleContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<CollapsiblePrimitive.CollapsibleContent ref={ref} className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down" {...props}/>);
});
exports.CollapsibleContent = CollapsibleContent;
CollapsibleContent.displayName = CollapsiblePrimitive.CollapsibleContent.displayName;
