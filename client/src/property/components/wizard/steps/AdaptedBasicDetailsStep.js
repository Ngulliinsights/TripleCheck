"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptedBasicDetailsStep = AdaptedBasicDetailsStep;
var react_1 = require("react");
var input_1 = require("../../../../local/components/ui/input");
var label_1 = require("../../../../local/components/ui/label");
var textarea_1 = require("../../../../local/components/ui/textarea");
var PROPERTY_TYPES = [
    { value: '', label: 'Select property type' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'land', label: 'Land' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'office', label: 'Office' },
    { value: 'warehouse', label: 'Warehouse' }
];
function AdaptedBasicDetailsStep(_a) {
    var data = _a.data, onUpdate = _a.onUpdate, onValidation = _a.onValidation;
    // Validate step whenever data changes
    (0, react_1.useEffect)(function () {
        var isValid = !!(data.title && data.description && data.propertyType);
        onValidation === null || onValidation === void 0 ? void 0 : onValidation(isValid);
    }, [data.title, data.description, data.propertyType, onValidation]);
    return (<div className="space-y-6">
      <div className="space-y-2">
        <label_1.Label htmlFor="title">Property Title *</label_1.Label>
        <input_1.Input id="title" placeholder="e.g., Modern 3-Bedroom Apartment in Westlands" value={data.title} onChange={function (e) { return onUpdate({ title: e.target.value }); }}/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="description">Description *</label_1.Label>
        <textarea_1.Textarea id="description" placeholder="Describe your property in detail..." rows={4} value={data.description} onChange={function (e) { return onUpdate({ description: e.target.value }); }}/>
      </div>

      <div className="space-y-2">
        <label_1.Label htmlFor="propertyType">Property Type *</label_1.Label>
        <select id="propertyType" title="Select the type of property you are listing" value={data.propertyType} onChange={function (e) { return onUpdate({ propertyType: e.target.value }); }} className="w-full p-2 border border-input rounded-md bg-background">
          {PROPERTY_TYPES.map(function (type) { return (<option key={type.value} value={type.value}>
              {type.label}
            </option>); })}
        </select>
      </div>
    </div>);
}
