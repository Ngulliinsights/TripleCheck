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
exports.SelectValue = exports.SelectTrigger = exports.SelectSeparator = exports.SelectScrollUpButton = exports.SelectScrollDownButton = exports.SelectLabel = exports.SelectItem = exports.SelectGroup = exports.SelectContent = exports.Select = void 0;
var SelectPrimitive = require("@radix-ui/react-select");
var lucide_react_1 = require("lucide-react");
var React = require("react");
var utils_1 = require("../../lib/utils");
// ─── Re-exports ───────────────────────────────────────────────────────────────
var Select = SelectPrimitive.Root;
exports.Select = Select;
var SelectGroup = SelectPrimitive.Group;
exports.SelectGroup = SelectGroup;
var SelectValue = SelectPrimitive.Value;
exports.SelectValue = SelectValue;
// ─── Shared class fragments ───────────────────────────────────────────────────
var animateIn = "data-[state=open]:animate-in data-[state=closed]:animate-out " +
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 " +
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 " +
    "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 " +
    "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2";
var scrollButtonBase = "flex cursor-default items-center justify-center py-1";
// ─── Trigger ──────────────────────────────────────────────────────────────────
var SelectTrigger = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<SelectPrimitive.Trigger ref={ref} className={(0, utils_1.cn)("flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm", "ring-offset-background placeholder:text-muted-foreground", "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", "disabled:cursor-not-allowed disabled:opacity-50", "[&>span]:line-clamp-1", className)} {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <lucide_react_1.ChevronDown className="h-4 w-4 opacity-50" aria-hidden="true"/>
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>);
});
exports.SelectTrigger = SelectTrigger;
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;
// ─── Scroll Buttons ───────────────────────────────────────────────────────────
var SelectScrollUpButton = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.ScrollUpButton ref={ref} className={(0, utils_1.cn)(scrollButtonBase, className)} {...props}>
    <lucide_react_1.ChevronUp className="h-4 w-4" aria-hidden="true"/>
  </SelectPrimitive.ScrollUpButton>);
});
exports.SelectScrollUpButton = SelectScrollUpButton;
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;
var SelectScrollDownButton = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.ScrollDownButton ref={ref} className={(0, utils_1.cn)(scrollButtonBase, className)} {...props}>
    <lucide_react_1.ChevronDown className="h-4 w-4" aria-hidden="true"/>
  </SelectPrimitive.ScrollDownButton>);
});
exports.SelectScrollDownButton = SelectScrollDownButton;
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;
// ─── Content ──────────────────────────────────────────────────────────────────
var SelectContent = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, _b = _a.position, position = _b === void 0 ? "popper" : _b, props = __rest(_a, ["className", "children", "position"]);
    return (<SelectPrimitive.Portal>
    <SelectPrimitive.Content ref={ref} position={position} className={(0, utils_1.cn)("relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md", animateIn, position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className)} {...props}>
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport className={(0, utils_1.cn)("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>);
});
exports.SelectContent = SelectContent;
SelectContent.displayName = SelectPrimitive.Content.displayName;
// ─── Label ────────────────────────────────────────────────────────────────────
var SelectLabel = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.Label ref={ref} className={(0, utils_1.cn)("py-1.5 pl-8 pr-2 text-sm font-semibold", className)} {...props}/>);
});
exports.SelectLabel = SelectLabel;
SelectLabel.displayName = SelectPrimitive.Label.displayName;
// ─── Item ─────────────────────────────────────────────────────────────────────
var SelectItem = React.forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<SelectPrimitive.Item ref={ref} className={(0, utils_1.cn)("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none", "focus:bg-accent focus:text-accent-foreground", "data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className)} {...props}>
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <lucide_react_1.Check className="h-4 w-4" aria-hidden="true"/>
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>);
});
exports.SelectItem = SelectItem;
SelectItem.displayName = SelectPrimitive.Item.displayName;
// ─── Separator ────────────────────────────────────────────────────────────────
var SelectSeparator = React.forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<SelectPrimitive.Separator ref={ref} className={(0, utils_1.cn)("-mx-1 my-1 h-px bg-muted", className)} {...props}/>);
});
exports.SelectSeparator = SelectSeparator;
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
