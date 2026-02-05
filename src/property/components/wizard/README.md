# Unified Property Wizard

A single, configurable wizard component that handles all property creation and editing workflows. This unified approach replaces the separate PropertyWizard and PropertyListingWizard components while maintaining full backward compatibility.

## Features

- **Single Component**: One wizard handles all property types (residential, commercial, land)
- **Configurable Steps**: Steps can be defined declaratively through configuration
- **Property Type Specific**: Validation rules and steps adapt based on property type
- **Two UI Modes**: Enhanced UI (PropertyWizard style) and Modern UI (PropertyListingWizard style)
- **Backward Compatible**: Existing PropertyListingWizard functionality is fully preserved
- **Validation System**: Externalized, property-type specific validation rules
- **Step Management**: Robust step progression with validation

## Usage

### Basic Usage (Enhanced UI)

```tsx
import { UnifiedPropertyWizard } from './components/wizard';

function CreatePropertyPage() {
  return (
    <UnifiedPropertyWizard
      onSave={(data) => console.log('Draft saved:', data)}
      onPublish={(data) => console.log('Property published:', data)}
      onCancel={() => router.back()}
    />
  );
}
```

### Modern UI Style

```tsx
import { UnifiedPropertyWizard, modernWizardConfig } from './components/wizard';

function CreatePropertyPage() {
  return (
    <UnifiedPropertyWizard
      config={modernWizardConfig}
      onSave={(data) => console.log('Draft saved:', data)}
      onPublish={(data) => console.log('Property published:', data)}
      onCancel={() => router.back()}
    />
  );
}
```

### Property Type Specific Configuration

```tsx
import { UnifiedPropertyWizard, getWizardConfigForPropertyType } from './components/wizard';

function CreateLandPage() {
  const landConfig = getWizardConfigForPropertyType('land');
  
  return (
    <UnifiedPropertyWizard
      config={landConfig}
      initialData={{ propertyType: 'land' }}
    />
  );
}
```

### Custom Configuration

```tsx
import { UnifiedPropertyWizard, enhancedWizardConfig } from './components/wizard';

function CustomWizard() {
  const customConfig = {
    ...enhancedWizardConfig,
    title: 'Custom Property Listing',
    validationMode: 'lenient' as const,
    showDocumentVerification: false,
  };
  
  return (
    <UnifiedPropertyWizard
      config={customConfig}
      initialData={{ propertyType: 'apartment' }}
    />
  );
}
```

### Backward Compatibility

The original components still work exactly as before:

```tsx
// This still works unchanged
import { PropertyListingWizard } from './components/PropertyListingWizard';

function ExistingComponent() {
  return (
    <PropertyListingWizard
      initialData={{ title: 'My Property' }}
      onPublish={(data) => console.log('Published:', data)}
    />
  );
}
```

```tsx
// This also still works unchanged
import PropertyWizard from './pages/PropertyWizard';

function ExistingPage() {
  return <PropertyWizard />;
}
```

## Configuration System

### Wizard Configuration

```typescript
interface WizardConfig {
  title: string;
  subtitle: string;
  steps: WizardStepConfig[];
  showDocumentVerification: boolean;
  showEnhancedUI: boolean;
  validationMode: 'strict' | 'lenient';
}
```

### Step Configuration

```typescript
interface WizardStepConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  required: boolean;
  component: React.ComponentType<WizardStepProps>;
  validation: (data: UnifiedPropertyFormData) => boolean;
  propertyTypes?: Property["propertyType"][]; // Optional: limit to specific types
}
```

### Available Configurations

- `enhancedWizardConfig`: Full-featured wizard with document verification
- `modernWizardConfig`: Streamlined wizard for quick listings
- `defaultWizardConfigs`: Property-type specific configurations
- Custom configurations can be created by merging base configs

## Steps

The wizard includes these configurable steps:

1. **Basic Details**: Property title, description, and type
2. **Location**: Address, city, county, and map location with geocoding
3. **Features**: Bedrooms, bathrooms, area, and amenities selection
4. **Images**: Property photos with advanced image vault management
5. **Pricing**: Price setting with market insights and analysis
6. **Preview**: Comprehensive review and submit with listing preview

## Validation

### Validation Modes

- **Strict**: Users must complete each step before proceeding
- **Lenient**: Users can navigate freely between steps

### Step Validation

Each step has its own validation function that checks:
- Required fields are filled
- Data format is correct
- Property-type specific requirements are met

### Property Type Specific Validation

- **Residential**: Requires bedrooms, bathrooms, and area
- **Commercial**: Requires area and price
- **Land**: Requires area and price (no bedrooms/bathrooms)

## Data Structure

The unified form data structure supports all property types:

```typescript
interface UnifiedPropertyFormData {
  // Basic Details
  title: string;
  description: string;
  propertyType: Property["propertyType"];

  // Location
  location: {
    address: string;
    city: string;
    state: string;
    county: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };

  // Features (conditional based on property type)
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  amenities: string[];
  features: string[]; // For backward compatibility
  customFeatures: string[];

  // Images & Media
  images: File[];
  imageUrls: string[];
  documents: File[];

  // Pricing
  price: number;
  priceType: "sale" | "rent";
  currency: string;

  // Verification Documents
  titleDeed: File | null;
  surveyPlan: File | null;
  ownershipProof: File | null;

  // Status
  status: "draft" | "active";
}
```

## Migration Guide

### From PropertyWizard

No changes needed - the component automatically uses the enhanced configuration.

### From PropertyListingWizard

No changes needed - the component automatically uses the modern configuration.

### Custom Implementations

If you were using the wizard components directly, you can now:

1. Use the unified component with appropriate configuration
2. Customize steps through configuration instead of code changes
3. Add property-type specific behavior through configuration

## Advanced Usage

### Adding Custom Steps

```typescript
import { WizardStepConfig } from './types';
import { CustomStep } from './CustomStep';

const customStep: WizardStepConfig = {
  id: 'custom',
  title: 'Custom Step',
  icon: Star,
  description: 'Custom functionality',
  required: false,
  component: CustomStep,
  validation: (data) => true,
  propertyTypes: ['apartment', 'house'] // Only show for these types
};

const customConfig = {
  ...enhancedWizardConfig,
  steps: [...enhancedWizardConfig.steps, customStep]
};
```

### Step Architecture

The unified wizard uses an adapter pattern to bridge the existing comprehensive wizard-steps with the new unified system:

- **Existing Steps**: Located in `src/property/components/wizard-steps/` - these are feature-rich, well-tested components
- **Adapter Components**: Located in `src/property/components/wizard/steps/` - these bridge the data formats
- **Unified Interface**: The `UnifiedPropertyWizard` provides a consistent interface while preserving all existing functionality

### Property Type Detection

The wizard automatically adapts based on the property type:

```typescript
// Steps and validation automatically adjust based on propertyType
const initialData = { propertyType: 'land' as const };

// This will show land-specific steps and validation
<UnifiedPropertyWizard initialData={initialData} />
```

## API Integration

The wizard integrates with the existing property API:

- **Draft Save**: Saves property with `status: 'inactive'`
- **Publish**: Saves property with `status: 'active'`
- **Validation**: Uses existing property validation logic
- **Error Handling**: Consistent error handling with toast notifications

## Testing

The unified wizard maintains all existing test coverage and adds:

- Configuration-based step testing
- Property-type specific validation testing
- UI mode switching testing
- Backward compatibility testing

## Performance

- **Lazy Loading**: Step components are loaded as needed
- **Memoization**: Form updates are optimized to prevent unnecessary re-renders
- **Validation Caching**: Step validation results are cached
- **API Optimization**: Uses existing API optimization features