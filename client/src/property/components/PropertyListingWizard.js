"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyListingWizard = PropertyListingWizard;
var react_1 = require("react");
var wizard_1 = require("./wizard");
var config_1 = require("./wizard/config");
function PropertyListingWizard(_a) {
    var initialData = _a.initialData, onSave = _a.onSave, onPublish = _a.onPublish, onCancel = _a.onCancel;
    return (<wizard_1.UnifiedPropertyWizard config={config_1.modernWizardConfig} initialData={initialData} onSave={onSave} onPublish={onPublish} onCancel={onCancel}/>);
}
