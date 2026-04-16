"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WizardExamples = WizardExamples;
var react_1 = require("react");
var button_1 = require("../../../../local/components/ui/button");
var card_1 = require("../../../../local/components/ui/card");
var UnifiedPropertyWizard_1 = require("../UnifiedPropertyWizard");
var config_1 = require("../config");
function WizardExamples() {
    var _a = (0, react_1.useState)(null), currentMode = _a[0], setCurrentMode = _a[1];
    var handleSave = function (data) {
        console.log('Draft saved:', data);
        alert('Draft saved successfully!');
    };
    var handlePublish = function (data) {
        console.log('Property published:', data);
        alert('Property published successfully!');
    };
    var handleCancel = function () {
        setCurrentMode(null);
    };
    // Custom configuration example
    var customConfig = (0, config_1.mergeWizardConfig)(config_1.enhancedWizardConfig, {
        title: 'Custom Property Wizard',
        subtitle: 'Customized workflow for special property types',
        validationMode: 'lenient',
        showDocumentVerification: false,
    });
    if (currentMode) {
        var config = void 0;
        var initialData = {};
        switch (currentMode) {
            case 'enhanced':
                config = config_1.enhancedWizardConfig;
                break;
            case 'modern':
                config = config_1.modernWizardConfig;
                break;
            case 'land':
                config = (0, config_1.getWizardConfigForPropertyType)('land');
                initialData = { propertyType: 'land' };
                break;
            case 'custom':
                config = customConfig;
                initialData = { propertyType: 'apartment' };
                break;
            default:
                config = config_1.enhancedWizardConfig;
        }
        return (<UnifiedPropertyWizard_1.UnifiedPropertyWizard config={config} initialData={initialData} onSave={handleSave} onPublish={handlePublish} onCancel={handleCancel}/>);
    }
    return (<div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Unified Property Wizard Examples</h1>
        <p className="text-gray-600">
          Choose an example to see different wizard configurations in action
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Enhanced Wizard</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Full-featured wizard with document verification, enhanced UI, and strict validation.
              This is the default PropertyWizard experience.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Enhanced gradient header</li>
              <li>• Document verification step</li>
              <li>• Strict step validation</li>
              <li>• Visual step progress</li>
            </ul>
            <button_1.Button onClick={function () { return setCurrentMode('enhanced'); }} className="w-full">
              Try Enhanced Wizard
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Modern Wizard</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Streamlined wizard with modern UI, optimized for quick property listings.
              This is the PropertyListingWizard experience.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Clean, modern interface</li>
              <li>• Tabbed step navigation</li>
              <li>• Save draft functionality</li>
              <li>• Lenient validation</li>
            </ul>
            <button_1.Button onClick={function () { return setCurrentMode('modern'); }} className="w-full">
              Try Modern Wizard
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Land Property Wizard</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Property-type specific configuration optimized for land listings.
              Shows how the wizard adapts to different property types.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Land-specific validation</li>
              <li>• No bedroom/bathroom fields</li>
              <li>• Enhanced documentation</li>
              <li>• Area-focused features</li>
            </ul>
            <button_1.Button onClick={function () { return setCurrentMode('land'); }} className="w-full">
              Try Land Wizard
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardHeader>
            <card_1.CardTitle>Custom Configuration</card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Example of a custom wizard configuration that merges different settings
              to create a unique workflow.
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Custom title and subtitle</li>
              <li>• Lenient validation mode</li>
              <li>• No document verification</li>
              <li>• Enhanced UI style</li>
            </ul>
            <button_1.Button onClick={function () { return setCurrentMode('custom'); }} className="w-full">
              Try Custom Wizard
            </button_1.Button>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Code Examples</card_1.CardTitle>
        </card_1.CardHeader>
        <card_1.CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Enhanced Wizard (Default)</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        {"<UnifiedPropertyWizard\n  onSave={(data) => console.log('Draft saved:', data)}\n  onPublish={(data) => console.log('Published:', data)}\n  onCancel={() => router.back()}\n/>"}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Modern Wizard</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        {"<UnifiedPropertyWizard\n  config={modernWizardConfig}\n  onSave={(data) => console.log('Draft saved:', data)}\n  onPublish={(data) => console.log('Published:', data)}\n/>"}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Property Type Specific</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        {"const landConfig = getWizardConfigForPropertyType('land');\n\n<UnifiedPropertyWizard\n  config={landConfig}\n  initialData={{ propertyType: 'land' }}\n/>"}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Custom Configuration</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
        {"const customConfig = mergeWizardConfig(enhancedWizardConfig, {\n  title: 'Custom Property Wizard',\n  validationMode: 'lenient',\n  showDocumentVerification: false,\n});\n\n<UnifiedPropertyWizard config={customConfig} />"}
              </pre>
            </div>
          </div>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
