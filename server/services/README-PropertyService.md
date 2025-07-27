# PropertyService

The PropertyService is a comprehensive service class that handles all property management business logic including creation, retrieval, search, validation, and data processing.

## Features

- **Property CRUD Operations**: Create, read, update properties
- **Advanced Search**: Text search and filter-based search with pagination
- **Data Validation**: Comprehensive validation using Zod schemas and custom business rules
- **Data Processing**: Sanitization and processing of property data
- **Error Handling**: Consistent error handling with detailed error messages
- **Type Safety**: Full TypeScript support with proper type definitions

## Usage

### Basic Usage

```typescript
import { PropertyService } from './PropertyService';

const propertyService = new PropertyService();

// Create a new property
const propertyData = {
  title: 'Beautiful Family Home',
  description: 'A spacious 4-bedroom house with a large garden',
  location: 'Karen, Nairobi',
  price: 25000000,
  features: {
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2500,
    propertyType: 'house'
  }
};

const result = await propertyService.createProperty(propertyData, ownerId);
if (result.success) {
  console.log('Property created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### Search Properties

```typescript
// Text search
const searchResult = await propertyService.searchProperties('Karen');

// Filter-based search
const filterResult = await propertyService.searchProperties(undefined, {
  location: 'Karen',
  priceMin: 20000000,
  priceMax: 30000000,
  bedrooms: 4,
  propertyType: 'house'
});

// Search with pagination
const paginatedResult = await propertyService.searchPropertiesWithPagination(
  { location: 'Karen' },
  { page: 1, limit: 10 }
);
```

### Get Properties

```typescript
// Get all properties
const allProperties = await propertyService.getProperties();

// Get properties with pagination
const paginatedProperties = await propertyService.getProperties({
  page: 1,
  limit: 20
});

// Get single property
const property = await propertyService.getProperty(propertyId);

// Get properties by owner
const ownerProperties = await propertyService.getPropertiesByOwner(ownerId);
```

### Update Properties

```typescript
const updateData = {
  title: 'Updated Property Title',
  price: 30000000
};

const updateResult = await propertyService.updateProperty(
  propertyId,
  updateData,
  ownerId
);
```

## API Reference

### Methods

#### `getProperties(pagination?: PaginationParams)`
Retrieves all properties with optional pagination.

**Parameters:**
- `pagination` (optional): Pagination parameters

**Returns:** `PropertyServiceResult<readonly Property[] | PaginatedResult<Property>>`

#### `getProperty(id: number)`
Retrieves a single property by ID.

**Parameters:**
- `id`: Property ID

**Returns:** `PropertyServiceResult<Property>`

#### `createProperty(propertyData: PropertyCreateRequest, ownerId: number)`
Creates a new property with validation and data processing.

**Parameters:**
- `propertyData`: Property creation data
- `ownerId`: ID of the property owner

**Returns:** `PropertyServiceResult<Property>`

#### `updateProperty(id: number, updates: PropertyUpdateRequest, ownerId: number)`
Updates an existing property.

**Parameters:**
- `id`: Property ID
- `updates`: Property update data
- `ownerId`: ID of the property owner (for authorization)

**Returns:** `PropertyServiceResult<Property>`

#### `searchProperties(query?: string, filters?: PropertySearchFilters)`
Searches properties with text query or filters.

**Parameters:**
- `query` (optional): Text search query
- `filters` (optional): Search filters

**Returns:** `PropertyServiceResult<readonly Property[]>`

#### `searchPropertiesWithPagination(filters: PropertySearchFilters, pagination: PaginationParams)`
Searches properties with filters and pagination.

**Parameters:**
- `filters`: Search filters
- `pagination`: Pagination parameters

**Returns:** `PropertyServiceResult<PaginatedResult<Property>>`

#### `updateVerificationStatus(id: number, status: string, results?: any, ownerId?: number)`
Updates property verification status.

**Parameters:**
- `id`: Property ID
- `status`: New verification status
- `results` (optional): Verification results
- `ownerId` (optional): Owner ID for authorization

**Returns:** `PropertyServiceResult<Property>`

#### `getPropertiesByOwner(ownerId: number)`
Gets all properties owned by a specific user.

**Parameters:**
- `ownerId`: Owner ID

**Returns:** `PropertyServiceResult<readonly Property[]>`

## Types

### PropertyCreateRequest
```typescript
interface PropertyCreateRequest {
  title: string;
  description: string;
  location: string;
  price: number;
  address?: string;
  coordinates?: { lat: number; lng: number; };
  features?: PropertyFeatures;
  imageUrls?: string[];
}
```

### PropertyUpdateRequest
```typescript
interface PropertyUpdateRequest {
  title?: string;
  description?: string;
  location?: string;
  price?: number;
  address?: string;
  coordinates?: { lat: number; lng: number; };
  features?: PropertyFeatures;
  imageUrls?: string[];
}
```

### PropertySearchFilters
```typescript
interface PropertySearchFilters {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
}
```

### PropertyServiceResult
```typescript
interface PropertyServiceResult<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
```

## Validation Rules

### Property Creation
- **Title**: 5-100 characters
- **Description**: 20-2000 characters
- **Price**: Must be positive, cannot exceed 1 billion
- **Location**: 2-100 characters
- **Images**: Maximum 20 images
- **Features**: Optional property features with validation

### Property Updates
- Same validation rules as creation, but all fields are optional
- Owner authorization required

## Error Handling

The service provides consistent error handling with detailed error messages:

```typescript
const result = await propertyService.createProperty(data, ownerId);
if (!result.success) {
  console.error('Error:', result.error);
  // Handle error appropriately
}
```

Common error scenarios:
- Invalid property data
- Unauthorized access
- Property not found
- Database errors
- Validation failures

## Integration with Storage Layer

The PropertyService integrates seamlessly with the existing storage layer:

- Uses the `storage` instance for all database operations
- Converts between service types and storage types
- Handles pagination and filtering through storage methods
- Maintains compatibility with existing property data structure

## Testing

The service includes comprehensive unit tests:

```bash
npm test -- __tests__/PropertyService.test.ts --run
```

Test coverage includes:
- All CRUD operations
- Validation scenarios
- Error handling
- Search functionality
- Authorization checks

## Requirements Fulfilled

This PropertyService implementation fulfills the following requirements from the specification:

- **3.1**: Business logic extracted into service classes ✓
- **3.2**: Authentication handled through service methods ✓
- **3.3**: Property verification through dedicated service ✓
- **3.4**: Property management through dedicated service ✓
- **3.5**: Services can be tested independently ✓

The service provides a clean, testable, and maintainable interface for all property management operations while integrating with the existing storage layer and validation infrastructure.