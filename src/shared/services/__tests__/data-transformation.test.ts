import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupMswServer, mockApiSuccess, mockApiError , server } from '../../test-utils/msw-server'
import { ApiClient } from "../../../shared/services/unified-api-client"
import { PropertyApi, type ResidentialProperty, type ResidentialFilters } from '../../property/services/property-api'
import { http, HttpResponse } from 'msw'


// Setup MSW server for all tests
setupMswServer({ quiet: true });

describe('Data Transformation and Validation Tests', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: '/api',
      timeout: 5000,
    });
    
    client.clearCache();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('Request Data Transformation', () => {
    it('should transform JavaScript objects to JSON strings', async () => {
      let receivedBody: any;
      
      server.use(
        http.post('/api/transform-test', async ({ request }) => {
          receivedBody = await request.json();
          return HttpResponse.json({ received: receivedBody });
        })
      );

      const requestData = {
        name: 'Test Property',
        price: 1500000,
        features: {
          bedrooms: 3,
          bathrooms: 2,
          amenities: ['Pool', 'Gym'],
        },
        isActive: true,
        metadata: null,
      };

      const response = await client.post('/transform-test', requestData);
      
      expect(response.success).toBe(true);
      expect(receivedBody).toEqual(requestData);
      expect(typeof receivedBody.name).toBe('string');
      expect(typeof receivedBody.price).toBe('number');
      expect(typeof receivedBody.isActive).toBe('boolean');
      expect(receivedBody.metadata).toBeNull();
      expect(Array.isArray(receivedBody.features.amenities)).toBe(true);
    });

    it('should handle FormData without JSON transformation', async () => {
      let receivedContentType: string | null = null;
      let receivedFormData: FormData | null = null;
      
      server.use(
        http.post('/api/form-data-test', async ({ request }) => {
          receivedContentType = request.headers.get('content-type');
          receivedFormData = await request.formData();
          
          return HttpResponse.json({
            contentType: receivedContentType,
            hasFile: receivedFormData.has('file'),
            name: receivedFormData.get('name'),
          });
        })
      );

      const formData = new FormData();
      formData.append('name', 'Test File Upload');
      // Create a proper File object for testing
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      formData.append('file', file);

      const response = await client.post<{
        contentType: string | null;
        hasFile: boolean;
        name: string;
      }>('/form-data-test', formData);
      
      expect(response.success).toBe(true);
      expect(response.data?.contentType).toContain('multipart/form-data');
      expect(response.data?.hasFile).toBe(true);
      expect(response.data?.name).toBe('Test File Upload');
    });

    it('should handle URLSearchParams correctly', async () => {
      let receivedParams: URLSearchParams | null = null;
      
      server.use(
        http.post('/api/url-params-test', async ({ request }) => {
          receivedParams = new URLSearchParams(await request.text());
          
          return HttpResponse.json({
            param1: receivedParams.get('param1'),
            param2: receivedParams.get('param2'),
            allParams: Array.from(receivedParams.entries()),
          });
        })
      );

      const params = new URLSearchParams();
      params.append('param1', 'value1');
      params.append('param2', 'value2');
      params.append('param1', 'value1-duplicate'); // Test multiple values

      const response = await client.post<{
        param1: string;
        param2: string;
        allParams: [string, string][];
      }>('/url-params-test', params);
      
      expect(response.success).toBe(true);
      expect(response.data?.param1).toBe('value1'); // First value
      expect(response.data?.param2).toBe('value2');
      expect(response.data?.allParams).toHaveLength(3);
    });

    it('should handle string data without transformation', async () => {
      let receivedBody: string | null = null;
      
      server.use(
        http.post('/api/string-test', async ({ request }) => {
          receivedBody = await request.text();
          return HttpResponse.json({ received: receivedBody });
        })
      );

      const stringData = 'Raw string data';
      const response = await client.post<{ received: string }>('/string-test', stringData);
      
      expect(response.success).toBe(true);
      expect(response.data?.received).toBe(stringData);
    });
  });

  describe('Response Data Transformation', () => {
    it('should parse JSON responses correctly', async () => {
      const mockData = {
        id: 1,
        name: 'Test Property',
        price: 1500000,
        features: {
          bedrooms: 3,
          bathrooms: 2,
          amenities: ['Pool', 'Gym'],
        },
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        metadata: null,
      };

      server.use(
        http.get('/api/json-response', () => {
          return HttpResponse.json(mockData);
        })
      );

      const response = await client.get<typeof mockData>('/json-response');
      
      expect(response.success).toBe(true);
      expect(response.data).toEqual(mockData);
      expect(typeof response.data?.id).toBe('number');
      expect(typeof response.data?.name).toBe('string');
      expect(typeof response.data?.price).toBe('number');
      expect(typeof response.data?.isActive).toBe('boolean');
      expect(response.data?.metadata).toBeNull();
      expect(Array.isArray(response.data?.features.amenities)).toBe(true);
    });

    it('should handle text responses', async () => {
      const textContent = 'This is plain text content';
      
      server.use(
        http.get('/api/text-response', () => {
          return new HttpResponse(textContent, {
            headers: { 'Content-Type': 'text/plain' }
          });
        })
      );

      const response = await client.get<string>('/text-response');
      
      expect(response.success).toBe(true);
      expect(response.data).toBe(textContent);
      expect(typeof response.data).toBe('string');
    });

    it('should handle HTML responses', async () => {
      const htmlContent = '<html><body><h1>Test Page</h1></body></html>';
      
      server.use(
        http.get('/api/html-response', () => {
          return new HttpResponse(htmlContent, {
            headers: { 'Content-Type': 'text/html' }
          });
        })
      );

      const response = await client.get<string>('/html-response');
      
      expect(response.success).toBe(true);
      expect(response.data).toBe(htmlContent);
      expect(response.data).toContain('<html>');
    });

    it('should handle binary responses as Blob', async () => {
      const binaryData = new ArrayBuffer(16);
      const view = new Uint8Array(binaryData);
      view.fill(42); // Fill with some data
      
      server.use(
        http.get('/api/binary-response', () => {
          return new HttpResponse(binaryData, {
            headers: { 'Content-Type': 'application/octet-stream' }
          });
        })
      );

      const response = await client.get<Blob>('/binary-response');
      
      expect(response.success).toBe(true);
      expect(response.data).toBeDefined();
      expect(typeof response.data).toBe('object');
      
      // Verify blob content
      const arrayBuffer = await response.data!.arrayBuffer();
      const resultView = new Uint8Array(arrayBuffer);
      expect(resultView[0]).toBe(42);
    });

    it('should handle empty responses', async () => {
      server.use(
        http.delete('/api/empty-response', () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const response = await client.delete('/empty-response');
      
      expect(response.success).toBe(true);
      expect(response.status).toBe(204);
      expect(response.data).toBeDefined(); // Empty response becomes empty Blob
    });

    it('should handle malformed JSON gracefully', async () => {
      server.use(
        http.get('/api/malformed-json', () => {
          return new HttpResponse('{ "invalid": json }', {
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );

      const response = await client.get('/malformed-json');
      
      expect(response.success).toBe(false);
      expect(response.error).toBe('Failed to parse response');
      expect(response.message).toBe('The server response could not be parsed');
    });
  });

  describe('Property API Data Transformation', () => {
    it('should transform filter parameters correctly', async () => {
      let receivedParams: URLSearchParams | null = null;
      
      server.use(
        http.get('/api/properties/residential', ({ request }) => {
          const url = new URL(request.url);
          receivedParams = url.searchParams;
          
          return HttpResponse.json({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
          });
        })
      );

      const filters: ResidentialFilters = {
        query: 'modern apartment',
        location: 'Westlands',
        propertyType: 'apartment',
        priceMin: 1000000,
        priceMax: 5000000,
        bedrooms: 3,
        bathrooms: 2,
        furnished: true,
        parking: true,
        verified: true,
      };

      await PropertyApi.getProperties(filters);
      
      expect(receivedParams?.get('search')).toBe('modern apartment');
      expect(receivedParams?.get('location')).toBe('Westlands');
      expect(receivedParams?.get('type')).toBe('apartment');
      expect(receivedParams?.get('priceMin')).toBe('1000000');
      expect(receivedParams?.get('priceMax')).toBe('5000000');
      expect(receivedParams?.get('bedrooms')).toBe('3');
      expect(receivedParams?.get('bathrooms')).toBe('2');
      expect(receivedParams?.get('furnished')).toBe('true');
      expect(receivedParams?.get('parking')).toBe('true');
      expect(receivedParams?.get('verified')).toBe('true');
    });

    it('should handle null and undefined filter values', async () => {
      let receivedParams: URLSearchParams | null = null;
      
      server.use(
        http.get('/api/properties/residential', ({ request }) => {
          const url = new URL(request.url);
          receivedParams = url.searchParams;
          
          return HttpResponse.json({
            data: [],
            total: 0,
            page: 1,
            limit: 20,
          });
        })
      );

      const filters: ResidentialFilters = {
        query: undefined,
        location: '',
        propertyType: undefined,
        priceMin: undefined,
        priceMax: null as any,
        bedrooms: 0,
        bathrooms: undefined,
        furnished: null,
        parking: false,
        verified: undefined,
      };

      await PropertyApi.getProperties(filters);
      
      expect(receivedParams?.has('search')).toBe(false);
      expect(receivedParams?.has('location')).toBe(false);
      expect(receivedParams?.has('type')).toBe(false);
      expect(receivedParams?.has('priceMin')).toBe(false);
      expect(receivedParams?.has('priceMax')).toBe(false);
      expect(receivedParams?.get('bedrooms')).toBe('0'); // 0 is valid
      expect(receivedParams?.has('bathrooms')).toBe(false);
      expect(receivedParams?.has('furnished')).toBe(false);
      expect(receivedParams?.has('parking')).toBe(false); // false is not included
      expect(receivedParams?.has('verified')).toBe(false);
    });

    it('should transform property response data correctly', async () => {
      const mockPropertyData = {
        id: '1',
        title: 'Modern 3-Bedroom Apartment',
        price: 1500000,
        location: 'Westlands, Nairobi',
        propertyType: 'apartment',
        bedrooms: 3,
        bathrooms: 2,
        furnished: true,
        parking: true,
        verified: true,
      };

      server.use(
        http.get('/api/properties/residential', () => {
          return HttpResponse.json({
            data: [mockPropertyData],
            total: 1,
            page: 1,
            limit: 20,
          });
        })
      );

      const properties = await PropertyApi.getProperties({});
      
      expect(properties).toHaveLength(1);
      expect(properties[0]).toEqual(mockPropertyData);
      expect(typeof properties[0].id).toBe('string');
      expect(typeof properties[0].title).toBe('string');
      expect(typeof properties[0].price).toBe('number');
      expect(typeof properties[0].bedrooms).toBe('number');
      expect(typeof properties[0].furnished).toBe('boolean');
      expect(typeof properties[0].parking).toBe('boolean');
      expect(typeof properties[0].verified).toBe('boolean');
    });
  });

  describe('Error Response Transformation', () => {
    it('should extract error messages from different response formats', async () => {
      // Test error response with message field
      server.use(
        http.get('/api/error-message', () => {
          return new HttpResponse(
            JSON.stringify({ message: 'Custom error message' }),
            { status: 400 }
          );
        })
      );

      const result = await client.get('/api/error-message');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Custom error message');
      expect(result.status).toBe(400);
    });

    it('should handle nested error objects', async () => {
      const nestedError = {
        error: {
          message: 'Nested error message',
          code: 'VALIDATION_ERROR',
          details: {
            field: 'email',
            reason: 'Invalid format',
          },
        },
      };

      server.use(
        http.post('/api/nested-error', () => {
          return new HttpResponse(JSON.stringify(nestedError), { status: 422 });
        })
      );

      const response = await client.post('/nested-error', { email: 'invalid' });
      
      expect(response.success).toBe(false);
      expect(response.status).toBe(422);
      expect(response.message).toBe('Request failed'); // Doesn't extract nested messages
    });

    it('should handle validation errors with multiple fields', async () => {
      const validationError = {
        message: 'Validation failed',
        errors: {
          email: ['Email is required', 'Email format is invalid'],
          password: ['Password must be at least 8 characters'],
        },
      };

      server.use(
        http.post('/api/validation-error', () => {
          return new HttpResponse(JSON.stringify(validationError), { status: 422 });
        })
      );

      const response = await client.post('/validation-error', {});
      
      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.status).toBe(422);
    });
  });

  describe('Data Type Validation', () => {
    it('should preserve number types in responses', async () => {
      const numericData = {
        id: 123,
        price: 1500000.50,
        rating: 4.5,
        count: 0,
        negative: -100,
      };

      server.use(
        http.get('/api/numeric-data', () => {
          return HttpResponse.json(numericData);
        })
      );

      const response = await client.get<typeof numericData>('/numeric-data');
      
      expect(response.success).toBe(true);
      expect(typeof response.data?.id).toBe('number');
      expect(typeof response.data?.price).toBe('number');
      expect(typeof response.data?.rating).toBe('number');
      expect(typeof response.data?.count).toBe('number');
      expect(typeof response.data?.negative).toBe('number');
      expect(response.data?.price).toBe(1500000.50);
      expect(response.data?.count).toBe(0);
      expect(response.data?.negative).toBe(-100);
    });

    it('should preserve boolean types in responses', async () => {
      const booleanData = {
        isActive: true,
        isVerified: false,
        hasParking: true,
        isFurnished: false,
      };

      server.use(
        http.get('/api/boolean-data', () => {
          return HttpResponse.json(booleanData);
        })
      );

      const response = await client.get<typeof booleanData>('/boolean-data');
      
      expect(response.success).toBe(true);
      expect(typeof response.data?.isActive).toBe('boolean');
      expect(typeof response.data?.isVerified).toBe('boolean');
      expect(typeof response.data?.hasParking).toBe('boolean');
      expect(typeof response.data?.isFurnished).toBe('boolean');
      expect(response.data?.isActive).toBe(true);
      expect(response.data?.isVerified).toBe(false);
    });

    it('should handle null and undefined values correctly', async () => {
      const nullableData = {
        optionalField: null,
        undefinedField: undefined,
        emptyString: '',
        zeroValue: 0,
        falseValue: false,
      };

      server.use(
        http.get('/api/nullable-data', () => {
          return HttpResponse.json(nullableData);
        })
      );

      const response = await client.get<typeof nullableData>('/nullable-data');
      
      expect(response.success).toBe(true);
      expect(response.data?.optionalField).toBeNull();
      expect(response.data?.undefinedField).toBeUndefined();
      expect(response.data?.emptyString).toBe('');
      expect(response.data?.zeroValue).toBe(0);
      expect(response.data?.falseValue).toBe(false);
    });

    it('should handle array data correctly', async () => {
      const arrayData = {
        numbers: [1, 2, 3, 4, 5],
        strings: ['a', 'b', 'c'],
        booleans: [true, false, true],
        mixed: [1, 'two', true, null],
        nested: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
        empty: [],
      };

      server.use(
        http.get('/api/array-data', () => {
          return HttpResponse.json(arrayData);
        })
      );

      const response = await client.get<typeof arrayData>('/array-data');
      
      expect(response.success).toBe(true);
      expect(Array.isArray(response.data?.numbers)).toBe(true);
      expect(Array.isArray(response.data?.strings)).toBe(true);
      expect(Array.isArray(response.data?.booleans)).toBe(true);
      expect(Array.isArray(response.data?.mixed)).toBe(true);
      expect(Array.isArray(response.data?.nested)).toBe(true);
      expect(Array.isArray(response.data?.empty)).toBe(true);
      
      expect(response.data?.numbers).toEqual([1, 2, 3, 4, 5]);
      expect(response.data?.strings).toEqual(['a', 'b', 'c']);
      expect(response.data?.booleans).toEqual([true, false, true]);
      expect(response.data?.mixed).toEqual([1, 'two', true, null]);
      expect(response.data?.empty).toHaveLength(0);
    });

    it('should handle date strings correctly', async () => {
      const dateData = {
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T12:30:00.123Z',
        dateOnly: '2024-01-15',
        invalidDate: 'not-a-date',
      };

      server.use(
        http.get('/api/date-data', () => {
          return HttpResponse.json(dateData);
        })
      );

      const response = await client.get<typeof dateData>('/date-data');
      
      expect(response.success).toBe(true);
      expect(typeof response.data?.createdAt).toBe('string');
      expect(typeof response.data?.updatedAt).toBe('string');
      expect(typeof response.data?.dateOnly).toBe('string');
      expect(typeof response.data?.invalidDate).toBe('string');
      
      // Verify date strings can be parsed
      expect(new Date(response.data?.createdAt!).getTime()).not.toBeNaN();
      expect(new Date(response.data?.updatedAt!).getTime()).not.toBeNaN();
      expect(new Date(response.data?.dateOnly!).getTime()).not.toBeNaN();
      expect(new Date(response.data?.invalidDate!).getTime()).toBeNaN();
    });
  });

  describe('Complex Data Structure Transformation', () => {
    it('should handle deeply nested objects', async () => {
      const complexData = {
        property: {
          id: '1',
          details: {
            basic: {
              title: 'Test Property',
              price: 1500000,
            },
            features: {
              rooms: {
                bedrooms: 3,
                bathrooms: 2,
                kitchen: 1,
              },
              amenities: {
                indoor: ['Gym', 'Pool'],
                outdoor: ['Garden', 'Parking'],
              },
            },
          },
          location: {
            address: {
              street: '123 Test Street',
              city: 'Nairobi',
              country: 'Kenya',
            },
            coordinates: {
              lat: -1.2921,
              lng: 36.8219,
            },
          },
        },
      };

      server.use(
        http.get('/api/complex-data', () => {
          return HttpResponse.json(complexData);
        })
      );

      const response = await client.get<typeof complexData>('/complex-data');
      
      expect(response.success).toBe(true);
      expect(response.data?.property.details.basic.title).toBe('Test Property');
      expect(response.data?.property.details.basic.price).toBe(1500000);
      expect(response.data?.property.details.features.rooms.bedrooms).toBe(3);
      expect(response.data?.property.details.features.amenities.indoor).toEqual(['Gym', 'Pool']);
      expect(response.data?.property.location.coordinates.lat).toBe(-1.2921);
    });

    it('should handle arrays of complex objects', async () => {
      const arrayOfObjects = {
        properties: [
          {
            id: '1',
            title: 'Property 1',
            features: { bedrooms: 3, amenities: ['Pool'] },
          },
          {
            id: '2',
            title: 'Property 2',
            features: { bedrooms: 2, amenities: ['Gym', 'Parking'] },
          },
        ],
        metadata: {
          total: 2,
          page: 1,
        },
      };

      server.use(
        http.get('/api/array-objects', () => {
          return HttpResponse.json(arrayOfObjects);
        })
      );

      const response = await client.get<typeof arrayOfObjects>('/array-objects');
      
      expect(response.success).toBe(true);
      expect(response.data?.properties).toHaveLength(2);
      expect(response.data?.properties[0].title).toBe('Property 1');
      expect(response.data?.properties[0].features.bedrooms).toBe(3);
      expect(response.data?.properties[1].features.amenities).toEqual(['Gym', 'Parking']);
      expect(response.data?.metadata.total).toBe(2);
    });
  });
});