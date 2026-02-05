import React, { useState } from 'react'
import { Button } from '../../../../shared/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/components/ui/card'
import { UnifiedPropertyWizard } from '../UnifiedPropertyWizard'
import { 
  enhancedWizardConfig, 
  modernWizardConfig, 
  getWizardConfigForPropertyType,
  mergeWizardConfig 
} from '../config'
import { UnifiedPropertyFormData } from '../types'

type ExampleMode = 'enhanced' | 'modern' | 'land' | 'custom' | null;

export function WizardExamples() {
  const [currentMode, setCurrentMode] = useState<ExampleMode>(null);

  const handleSave = (data: UnifiedPropertyFormData) => {
    console.log('Draft saved:', data);
    alert('Draft saved successfully!');
  };

  const handlePublish = (data: UnifiedPropertyFormData) => {
    console.log('Property published:', data);
    alert('Property published successfully!');
  };

  const handleCancel = () => {
    setCurrentMode(null);
  };

  // Custom configuration example
  const customConfig = mergeWizardConfig(enhancedWizardConfig, {
    title: 'Custom Property Wizard',
    subtitle: 'Customized workflow for special property types',
    validationMode: 'lenient',
    showDocumentVerification: false,
  });

  if (currentMode) {
    let config;
    let initialData: Partial<UnifiedPropertyFormData> = {};

    switch (currentMode) {
      case 'enhanced':
        config = enhancedWizardConfig;
        break;
      case 'modern':
        config = modernWizardConfig;
        break;
      case 'land':
        config = getWizardConfigForPropertyType('land');
        initialData = { propertyType: 'land' };
        break;
      case 'custom':
        config = customConfig;
        initialData = { propertyType: 'apartment' };
        break;
      default:
        config = enhancedWizardConfig;
    }

    return (
      <UnifiedPropertyWizard
        config={config}
        initialData={initialData}
        onSave={handleSave}
        onPublish={handlePublish}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Unified Property Wizard Examples</h1>
        <p className="text-gray-600">
          Choose an example to see different wizard configurations in action
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Enhanced Wizard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={() => setCurrentMode('enhanced')} className="w-full">
              Try Enhanced Wizard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Modern Wizard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={() => setCurrentMode('modern')} className="w-full">
              Try Modern Wizard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Land Property Wizard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={() => setCurrentMode('land')} className="w-full">
              Try Land Wizard
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button onClick={() => setCurrentMode('custom')} className="w-full">
              Try Custom Wizard
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Code Examples</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Enhanced Wizard (Default)</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<UnifiedPropertyWizard
  onSave={(data) => console.log('Draft saved:', data)}
  onPublish={(data) => console.log('Published:', data)}
  onCancel={() => router.back()}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Modern Wizard</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`<UnifiedPropertyWizard
  config={modernWizardConfig}
  onSave={(data) => console.log('Draft saved:', data)}
  onPublish={(data) => console.log('Published:', data)}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Property Type Specific</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const landConfig = getWizardConfigForPropertyType('land');

<UnifiedPropertyWizard
  config={landConfig}
  initialData={{ propertyType: 'land' }}
/>`}
              </pre>
            </div>

            <div>
              <h4 className="font-medium mb-2">Custom Configuration</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
{`const customConfig = mergeWizardConfig(enhancedWizardConfig, {
  title: 'Custom Property Wizard',
  validationMode: 'lenient',
  showDocumentVerification: false,
});

<UnifiedPropertyWizard config={customConfig} />`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}