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
exports.DialogFooter = exports.DialogDescription = exports.DialogTitle = exports.DialogHeader = exports.Content = exports.DialogContent = exports.Close = exports.DialogClose = exports.Overlay = exports.DialogOverlay = exports.Portal = exports.DialogPortal = exports.Trigger = exports.DialogTrigger = exports.Root = exports.Dialog = void 0;
var React = require("react");
// Placeholder dialog components - will be replaced with full Radix implementation later
var Dialog = function (_a) {
    var children = _a.children, open = _a.open, onOpenChange = _a.onOpenChange;
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={function () { return onOpenChange === null || onOpenChange === void 0 ? void 0 : onOpenChange(false); }}/>
      <div className="relative z-10">
        {children}
      </div>
    </div>);
};
exports.Dialog = Dialog;
// Alias for compatibility
exports.Root = exports.Dialog;
var DialogTrigger = function (_a) {
    var children = _a.children, asChild = _a.asChild;
    if (asChild) {
        // When asChild is true, render children directly (they should handle the trigger behavior)
        return <>{children}</>;
    }
    return <div>{children}</div>;
};
exports.DialogTrigger = DialogTrigger;
exports.Trigger = exports.DialogTrigger;
var DialogPortal = function (_a) {
    var children = _a.children;
    return <>{children}</>;
};
exports.DialogPortal = DialogPortal;
exports.Portal = exports.DialogPortal;
exports.DialogOverlay = React.forwardRef(function (_a, ref) {
    var _b = _a.className, className = _b === void 0 ? "" : _b, props = __rest(_a, ["className"]);
    return (<div ref={ref} className={"fixed inset-0 bg-black bg-opacity-50 ".concat(className)} {...props}/>);
});
exports.DialogOverlay.displayName = "DialogOverlay";
exports.Overlay = exports.DialogOverlay;
var DialogClose = function (_a) {
    var children = _a.children, asChild = _a.asChild;
    if (asChild) {
        return <>{children}</>;
    }
    return <button type="button">{children}</button>;
};
exports.DialogClose = DialogClose;
exports.Close = exports.DialogClose;
var DialogContent = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? "" : _b;
    return (<div className={"bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4 ".concat(className)}>
      {children}
    </div>);
};
exports.DialogContent = DialogContent;
exports.Content = exports.DialogContent;
var DialogHeader = function (_a) {
    var children = _a.children;
    return <div className="mb-4">{children}</div>;
};
exports.DialogHeader = DialogHeader;
var DialogTitle = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? "" : _b;
    return <h2 className={"text-lg font-semibold ".concat(className)}>{children}</h2>;
};
exports.DialogTitle = DialogTitle;
var DialogDescription = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? "" : _b;
    return <p className={"text-sm text-muted-foreground ".concat(className)}>{children}</p>;
};
exports.DialogDescription = DialogDescription;
var DialogFooter = function (_a) {
    var children = _a.children, _b = _a.className, className = _b === void 0 ? "" : _b;
    return <div className={"flex justify-end gap-2 mt-4 ".concat(className)}>{children}</div>;
};
exports.DialogFooter = DialogFooter;
