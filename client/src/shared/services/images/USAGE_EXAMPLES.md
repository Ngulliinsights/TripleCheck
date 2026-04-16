# Image Services Usage Examples

## Migration from Old Services to New Orchestrator

### Example 1: Simple Image Upload Component

#### Before (Old Services)
```typescript
import { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator';
import { PropertyImageValidationService } from '../../services/images/PropertyImageValidationService';

const MyComponent = () => {
  const [uploadCoordinator] = useState(() => new PropertyImageUploadCoordinator());
  const [validationService] = useState(() => new PropertyImageValidationService());

  const handleUpload = async (file: File) => {
    // Manual validation
    const validation = await validationService.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Manual upload
    const session = await uploadCoordinator.initiateUpload(file);
    for (const chunk of session.chunks) {
      await uploadCoordinator.uploadChunk(session.id, chunk);
    }
  };

  return <div>...</div>;
};
```

#### After (New Orchestrator)
```typescript
import { getImageServiceOrchestrator } from '../../services/images/ImageServiceOrchestrator';

const MyComponent = () => {
  const orchestrator = getImageServiceOrchestrator();

  const handleUpload = async (file: File) => {
    // One-line complete processing
    const propertyImage = await orchestrator.processPropertyImage(file, 'property_photo');
    console.log('Upload complete:', propertyImage.id);
  };

  return <div>...</div>;
};
```

### Example 2: Hook-based Upload Management

#### Before (Old Hook)
```typescript
import { usePropertyImageUpload } from '../../hooks/images/usePropertyImageUpload';
import { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator';
import { PropertyImageWorkflowManager } from '../../services/images/PropertyImageWorkflowManager';

const MyUploadComponent = () => {
  const uploadCoordinator = useMemo(() => new PropertyImageUploadCoordinator(), []);
  const workflowManager = useMemo(() => new PropertyImageWorkflowManager({...}), []);

  const { uploadFile, images } = usePropertyImageUpload(
    uploadCoordinator,
    workflowManager,
    { defaultDocumentType: 'property_photo' }
  );

  return <div>...</div>;
};
```

#### After (New Hook)
```typescript
import { usePropertyImageUpload } from '../../hooks/images/usePropertyImageUpload';

const MyUploadComponent = () => {
  const { uploadFile, images } = usePropertyImageUpload(
    undefined, // Uses orchestrator automatically
    undefined,
    { defaultDocumentType: 'property_photo' }
  );

  return <div>...</div>;
};
```

### Example 3: Advanced Workflow Management

#### Before (Manual Service Coordination)
```typescript
import { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator';
import { PropertyImageValidationService } from '../../services/images/PropertyImageValidationService';
import { PropertyImageWorkflowManager } from '../../services/images/PropertyImageWorkflowManager';
import { ImageMetadataService } from '../../services/images/ImageMetadataService';

const AdvancedComponent = () => {
  const uploadCoordinator = new PropertyImageUploadCoordinator();
  const validationService = new PropertyImageValidationService();
  const workflowManager = new PropertyImageWorkflowManager({...});
  const metadataService = new ImageMetadataService();

  const processImage = async (file: File) => {
    // Step 1: Validate
    const validation = await validationService.validateFile(file);
    if (!validation.isValid) throw new Error('Validation failed');

    // Step 2: Upload
    const session = await uploadCoordinator.initiateUpload(file);
    // ... manual chunk upload

    // Step 3: Extract metadata
    const metadata = await metadataService.extractMetadata(`storage://${session.imageId}`);

    // Step 4: Start workflow
    await workflowManager.startProcessingWorkflow(session.imageId, `storage://${session.imageId}`);
  };

  return <div>...</div>;
};
```

#### After (Orchestrated Workflow)
```typescript
import { getImageServiceOrchestrator } from '../../services/images/ImageServiceOrchestrator';

const AdvancedComponent = () => {
  const orchestrator = getImageServiceOrchestrator();

  const processImage = async (file: File) => {
    // All steps handled automatically
    const result = await orchestrator.processPropertyImage(file, 'property_photo');
    
    // Access individual services if needed
    const uploadProgress = orchestrator.getUploadProgress(result.sessionId!);
    const workflowStatus = orchestrator.getWorkflowStatus(result.id);
    
    return result;
  };

  return <div>...</div>;
};
```

### Example 4: Batch Processing

#### Before (Manual Batch Handling)
```typescript
const processBatch = async (files: File[]) => {
  const results = [];
  
  for (const file of files) {
    try {
      const validation = await validationService.validateFile(file);
      if (validation.isValid) {
        const session = await uploadCoordinator.initiateUpload(file);
        // ... manual processing
        results.push({ success: true, imageId: session.imageId });
      } else {
        results.push({ success: false, errors: validation.errors });
      }
    } catch (error) {
      results.push({ success: false, error: error.message });
    }
  }
  
  return results;
};
```

#### After (Orchestrated Batch)
```typescript
const processBatch = async (files: File[]) => {
  return orchestrator.processBatch(
    files,
    'property_photo',
    (completed, total) => {
      console.log(`Progress: ${completed}/${total}`);
    }
  );
};
```

### Example 5: Legacy Compatibility (Drop-in Replacement)

If you need to maintain the exact same API during migration:

```typescript
// Instead of:
// import { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator';

// Use:
import { LegacyPropertyImageUploadCoordinator as PropertyImageUploadCoordinator } from '../../services/images/LegacyServiceAdapter';

// The rest of your code remains exactly the same
const uploadCoordinator = new PropertyImageUploadCoordinator();
// ... existing code works unchanged
```

## Performance Benefits

### Bundle Size Comparison
```
Old Architecture:
- PropertyImageUploadCoordinator: ~8KB
- PropertyImageValidationService: ~6KB  
- PropertyImageWorkflowManager: ~7KB
- ImageMetadataService: ~5KB
- UnifiedImageServiceFactory: ~4KB
Total: ~30KB

New Architecture:
- ImageServiceCore (shared): ~5KB
- All specialized services: ~10KB
- ImageServiceOrchestrator: ~3KB
- LegacyServiceAdapter: ~2KB
Total: ~20KB

Savings: ~10KB (33% reduction)
```

### Runtime Performance
- **Shared instances**: Reduced memory usage
- **Consistent caching**: Better performance across services
- **Optimized coordination**: Fewer service calls

### Developer Experience
- **Single import**: `getImageServiceOrchestrator()`
- **Consistent APIs**: All services follow same patterns
- **Better TypeScript**: Improved type inference
- **Easier testing**: Focused service boundaries

## Migration Strategy

### Phase 1: Update Hooks and Utilities
1. Update `usePropertyImageUpload` to use orchestrator
2. Update utility functions to use orchestrator
3. Test existing components still work

### Phase 2: Update Components Gradually
1. Start with new components using orchestrator directly
2. Update existing components one by one
3. Use legacy adapters for components that can't be updated immediately

### Phase 3: Remove Legacy Services
1. Ensure all components use orchestrator or legacy adapters
2. Mark old services as deprecated
3. Remove old services after migration is complete

This approach ensures zero downtime and allows gradual migration at your own pace.