"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PropertyWizard;
var react_1 = require("react");
var wizard_1 = require("../components/wizard");
var config_1 = require("../components/wizard/config");
function PropertyWizard() {
    return (<wizard_1.UnifiedPropertyWizard config={config_1.enhancedWizardConfig}/>);
}
