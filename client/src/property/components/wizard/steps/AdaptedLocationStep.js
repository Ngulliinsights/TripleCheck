"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptedLocationStep = AdaptedLocationStep;
var react_1 = require("react");
var lucide_react_1 = require("lucide-react");
var button_1 = require("../../../../local/components/ui/button");
var input_1 = require("../../../../local/components/ui/input");
var label_1 = require("../../../../local/components/ui/label");
var COUNTIES = [
    { value: '', label: 'Select county' },
    { value: 'nairobi', label: 'Nairobi' },
    { value: 'kiambu', label: 'Kiambu' },
    { value: 'machakos', label: 'Machakos' },
    { value: 'kajiado', label: 'Kajiado' },
    { value: 'mombasa', label: 'Mombasa' },
    { value: 'nakuru', label: 'Nakuru' },
    { value: 'kisumu', label: 'Kisumu' }
];
function AdaptedLocationStep(_a) {
    var data = _a.data, onUpdate = _a.onUpdate, onValidation = _a.onValidation;
    // Validate step whenever data changes
    (0, react_1.useEffect)(function () {
        var isValid = !!(data.location.address && data.location.city);
        onValidation === null || onValidation === void 0 ? void 0 : onValidation(isValid);
    }, [data.location.address, data.location.city, onValidation]);
    var updateLocation = function (updates) {
        onUpdate({
            location: __assign(__assign({}, data.location), updates)
        });
    };
    return (<div className="space-y-6">
      <div className="space-y-2">
        <label_1.Label htmlFor="address">Street Address *</label_1.Label>
        <input_1.Input id="address" placeholder="e.g., 123 Westlands Avenue" value={data.location.address} onChange={function (e) { return updateLocation({ address: e.target.value }); }}/>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label_1.Label htmlFor="city">City *</label_1.Label>
          <input_1.Input id="city" placeholder="e.g., Nairobi" value={data.location.city} onChange={function (e) { return updateLocation({ city: e.target.value }); }}/>
        </div>

        <div className="space-y-2">
          <label_1.Label htmlFor="county">County *</label_1.Label>
          <select id="county" title="Select the county where your property is located" value={data.location.county || data.location.state} onChange={function (e) { return updateLocation({
            county: e.target.value,
            state: e.target.value // For compatibility
        }); }} className="w-full p-2 border border-input rounded-md bg-background">
            {COUNTIES.map(function (county) { return (<option key={county.value} value={county.value}>
                {county.label}
              </option>); })}
          </select>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-medium mb-2">Location on Map</h4>
        <div className="h-48 bg-background border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <lucide_react_1.MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2"/>
            <p className="text-sm text-muted-foreground">
              Interactive map will be displayed here
            </p>
            <button_1.Button variant="outline" size="sm" className="mt-2">
              Set Location on Map
            </button_1.Button>
          </div>
        </div>
      </div>
    </div>);
}
