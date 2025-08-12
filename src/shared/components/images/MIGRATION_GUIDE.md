# Image System Migration Guide

## Overview
This guide helps you migrate existing components to use the new unified image system, which consolidates all image-related functionality into a single, consistent API.

## Quick Migration Steps

### 1. Update Imports

**Before:**
```typescript
import { formatFileSize, formatTimestamp } from '../../utils/images/formatters';
import { STATUS_COLORS, APPROVAL_STATUS_COLORS } from '../../utils/images/constants';
import { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator';
```

**After:**
```typescript
import { 
  ImageUtils, 
  UnifiedImageServiceFactory,
  UnifiedImage,
  createPropertyImage 
} from '@shared/components/images';
```

### 2. Replace Utility Functions

**Before:**
```typescript
const src = img.src ?? img.preview ?? '/placeholder.jpg';
const alt = img.alt ?? img.file?.name ?? 'Image';
const sizeText = formatFileSize(img.file.size);
const statusColor = STATUS_COLORS[img.status] || 'bg-gray-500';
```

**After:**
```typescript
const src = ImageUtils.getSrc(img);
const alt = ImageUtils.getAlt(img);
const sizeText = ImageUtils.formatFileSize(img.file.size);
const statusColor = ImageUtils.getStatusColor(img.status);
```

### 3. Update Service Creation

**Before:**
```typescript
const uploadCoordinator = new PropertyImageUploadCoordinator(dependencies);
const validationService = new PropertyImageValidationService(dependencies);
const workflowManager = new PropertyImageWorkflowManager(dependencies);
```

**After:**
```typescript
const services = UnifiedImageServiceFactory.createServiceSuite({
  useMockServices: true, // for development
  enableAuditLogging: true
});

const { uploadCoordinator, validationService, workflowManager } = services;
```

### 4. Use Unified Types

**Before:**
```typescript
interface ComponentProps {
  images: BaseImage[] | PropertyImage[] | EnterpriseImage[];
}
```

**After:**
```typescript
interface ComponentProps {
  images: UnifiedImage[];
}
```

## Component-Specific Migrations

### ImageGallery Component

**Before:**
```typescript
// Inline utility functions
const getSrc = (img: GalleryImage): string =>
  img.src ?? img.preview ?? (img.file && URL.createObjectURL(img.file)) ?? "/placeholder.jpg";

const getStatusColor = (status?: string): string => {
  switch (status) {
    case "pending": return "bg-yellow-500";
    case "uploading": return "bg-blue-500";
    // ... more cases
  }
};

// Usage in component
const src = getSrc(image);
const statusColor = getStatusColor(image.status);
```

**After:**
```typescript
import { ImageUtils } from '@shared/components/images';

// Usage in component
const src = ImageUtils.getSrc(image);
const statusColor = ImageUtils.getStatusColor(image.status);
```

### PropertyImageVault Component

**Before:**
```typescript
// Multiple service instantiations
const uploadCoordinator = new PropertyImageUploadCoordinator(mockApiClient);
const validationService = new PropertyImageValidationService(mockDependencies);
const workflowManager = new PropertyImageWorkflowManager(mockDependencies);
```

**After:**
```typescript
import { UnifiedImageServiceFactory } from '@shared/components/images';

// Single service suite creation
const services = UnifiedImageServiceFactory.createMockServiceSuite();
const { uploadCoordinator, validationService, workflowManager } = services;
```

### Property Components (ImagesStep, PropertyPhotos)

**Before:**
```typescript
import type { PropertyImage as VaultImage } from '../../../shared/types/images';
import { formatFileSize } from '../../../shared/utils/images/formatters';

const handleImageUpdate = (image: VaultImage) => {
  const sizeText = formatFileSize(image.file.size);
  // ... rest of logic
};
```

**After:**
```typescript
import { UnifiedImage, ImageUtils } from '@shared/components/images';

const handleImageUpdate = (image: UnifiedImage) => {
  const sizeText = ImageUtils.formatFileSize(image.file?.size || 0);
  // ... rest of logic
};
```

## Batch Operations Migration

**Before:**
```typescript
// Manual filtering and sorting
const uploadingImages = images.filter(img => img.status === 'uploading');
const sortedImages = [...images].sort((a, b) => {
  const dateA = a.uploadDate?.getTime() || 0;
  const dateB = b.uploadDate?.getTime() || 0;
  return dateB - dateA; // descending
});

// Manual statistics calculation
const stats = {
  total: images.length,
  completed: images.filter(img => img.status === 'completed').length,
  failed: images.filter(img => img.status === 'error').length,
};
```

**After:**
```typescript
import { ImageUtils } from '@shared/components/images';

// Using unified utilities
const uploadingImages = ImageUtils.filterByStatus(images, 'uploading');
const sortedImages = ImageUtils.sortByUploadDate(images, false); // descending
const stats = ImageUtils.getUploadStats(images);
```

## Type Conversion

### Converting Existing Types

**Before:**
```typescript
interface OldImageType {
  id: string;
  src?: string;
  file?: File;
  status: 'pending' | 'uploading' | 'completed';
}

const convertToNewType = (oldImage: OldImageType): PropertyImage => {
  return {
    ...oldImage,
    // ... manual mapping
  };
};
```

**After:**
```typescript
import { createPropertyImage, UnifiedImage } from '@shared/components/images';

const convertToNewType = (oldImage: OldImageType): UnifiedImage => {
  return createPropertyImage({
    id: oldImage.id,
    src: oldImage.src,
    file: oldImage.file,
    // Factory handles the rest
  });
};
```

## Configuration Migration

**Before:**
```typescript
// Hardcoded constants
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png'];

const isValidFile = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE && 
         ALLOWED_FORMATS.includes(file.name.split('.').pop()?.toLowerCase() || '');
};
```

**After:**
```typescript
import { ImageUtils } from '@shared/components/images';

const isValidFile = (file: File): boolean => {
  return ImageUtils.isValidFileSize(file.size) && 
         ImageUtils.isValidFormat(file.name);
};
```

## Error Handling Migration

**Before:**
```typescript
try {
  await uploadFile(file);
} catch (error) {
  console.error('Upload failed:', error);
  setError(error.message || 'Unknown error');
}
```

**After:**
```typescript
import { ImageProcessingError } from '@shared/components/images';

try {
  await uploadFile(file);
} catch (error) {
  if (error instanceof ImageProcessingError) {
    console.error(`Upload failed [${error.code}]:`, error.message);
    setError(error.message);
    
    // Handle retryable errors
    if (error.retryable) {
      // Show retry option
    }
  } else {
    console.error('Unexpected error:', error);
    setError('An unexpected error occurred');
  }
}
```

## Testing Migration

**Before:**
```typescript
// Multiple mock setups
const mockUploadCoordinator = {
  initiateUpload: jest.fn(),
  uploadChunk: jest.fn(),
};

const mockValidationService = {
  validateFile: jest.fn(),
};
```

**After:**
```typescript
import { UnifiedImageServiceFactory } from '@shared/components/images';

// Single mock service suite
const mockServices = UnifiedImageServiceFactory.createMockServiceSuite();

// All services available with consistent mocking
expect(mockServices.uploadCoordinator.initiateUpload).toHaveBeenCalled();
expect(mockServices.validationService.validateFile).toHaveBeenCalled();
```

## Performance Optimizations

### Before (Multiple Utility Imports)
```typescript
import { formatFileSize } from '../../utils/images/formatters';
import { formatTimestamp } from '../../utils/images/formatters';
import { formatDocumentType } from '../../utils/images/formatters';
import { STATUS_COLORS } from '../../utils/images/constants';
```

### After (Single Import with Tree-Shaking)
```typescript
import { ImageUtils } from '@shared/components/images';

// All utilities available through single class
const sizeText = ImageUtils.formatFileSize(size);
const timeText = ImageUtils.formatTimestamp(timestamp);
const docType = ImageUtils.formatDocumentType(type);
const statusColor = ImageUtils.getStatusColor(status);
```

## Common Pitfalls and Solutions

### 1. Type Compatibility Issues

**Problem:**
```typescript
// Old code expecting specific type
function processImage(image: PropertyImage) {
  // ...
}

// New unified type
const unifiedImage: UnifiedImage = createPropertyImage({...});
processImage(unifiedImage); // Type error
```

**Solution:**
```typescript
// Update function signature to use unified type
function processImage(image: UnifiedImage) {
  // Use type guards if needed
  if (ImageUtils.hasEnterpriseFeatures(image)) {
    // Handle enterprise features
  }
}
```

### 2. Missing Properties

**Problem:**
```typescript
// Accessing property that might not exist
const confidence = image.documentAuthResult.confidence; // Error
```

**Solution:**
```typescript
// Use optional chaining and type guards
const confidence = image.documentAuthResult?.confidence;

// Or use utility functions
if (ImageUtils.hasValidationResult(image)) {
  const confidence = image.validationResult?.documentAuthResult?.confidence;
}
```

### 3. Service Dependencies

**Problem:**
```typescript
// Manual dependency management
const service = new PropertyImageValidationService({
  documentAuthService: mockDocAuth,
  fraudDetectionService: mockFraud,
  // ... many dependencies
});
```

**Solution:**
```typescript
// Let factory handle dependencies
const services = UnifiedImageServiceFactory.createServiceSuite({
  useMockServices: true // Factory creates all mock dependencies
});
```

## Rollback Strategy

If you need to rollback changes:

1. **Keep old imports commented** during migration:
```typescript
// Old imports (keep for rollback)
// import { formatFileSize } from '../../utils/images/formatters';

// New imports
import { ImageUtils } from '@shared/components/images';
```

2. **Use feature flags** for gradual rollout:
```typescript
const USE_UNIFIED_SYSTEM = process.env.NODE_ENV === 'development';

const formatSize = USE_UNIFIED_SYSTEM 
  ? ImageUtils.formatFileSize(size)
  : formatFileSize(size);
```

3. **Maintain parallel implementations** temporarily:
```typescript
// Unified approach
const unifiedServices = UnifiedImageServiceFactory.createServiceSuite();

// Legacy approach (fallback)
const legacyUploadCoordinator = new PropertyImageUploadCoordinator(deps);
```

## Validation Checklist

After migration, verify:

- [ ] All image utilities work correctly
- [ ] Service creation and dependency injection works
- [ ] Type compatibility is maintained
- [ ] Performance is improved or maintained
- [ ] Tests pass with new system
- [ ] Bundle size is reduced
- [ ] No runtime errors in development/production
- [ ] Backward compatibility is maintained where needed

## Support and Resources

- **Unified Types**: `src/shared/types/images/unified.ts`
- **Utilities**: `src/shared/utils/images/unified-utils.ts`
- **Service Factory**: `src/shared/services/images/UnifiedImageServiceFactory.ts`
- **Examples**: See updated `PropertyImageVault` and `ImageGallery` components
- **Tests**: Check test files for usage patterns

For questions or issues during migration, refer to the implementation documentation or create an issue with specific migration challenges.