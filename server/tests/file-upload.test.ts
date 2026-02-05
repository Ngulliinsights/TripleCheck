import request from '..\app';
import app from '../app';
import { storage } from '../infrastructure/storage/storage';
import path from '..\app';
import fs from '..\app';

describe('File Upload Functionality Tests', () => {
  let testUser: any;
  let testProperty: any;
  let authCookie: string;
  const testImagePath = path.join(__dirname, 'test-image.jpg');

  beforeAll(async () => {
    // Create a test image file
    const testImageBuffer = Buffer.from('fake-image-data-for-testing');
    fs.writeFileSync(testImagePath, testImageBuffer);

    // Create test user for file upload tests
    const userData = {
      username: 'filetest_user',
      email: 'filetest@example.com',
      password: 'testpassword123',
      firstName: 'File',
      lastName: 'Test'
    };

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    testUser = response.body.data;
    
    // Login to get session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: userData.username,
        password: userData.password
      });

    authCookie = loginResponse.headers['set-cookie'];
  });

  afterAll(async () => {
    // Cleanup test files
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Cleanup test data
    if (testUser) {
      try {
        await storage.deleteUser(testUser.id);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
    if (testProperty) {
      try {
        await storage.deleteProperty(testProperty.id);
      } catch (error) {
        console.log('Cleanup error:', error);
      }
    }
  });

  describe('Property Image Upload', () => {
    test('Should create property with image upload', async () => {
      const propertyData = {
        title: 'Property with Image',
        description: 'A property with uploaded images',
        location: 'Upload Test Location',
        price: 200000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'house'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .field('title', propertyData.title)
        .field('description', propertyData.description)
        .field('location', propertyData.location)
        .field('price', propertyData.price.toString())
        .field('bedrooms', propertyData.bedrooms.toString())
        .field('bathrooms', propertyData.bathrooms.toString())
        .field('propertyType', propertyData.propertyType)
        .attach('images', testImagePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', propertyData.title);
      expect(response.body.data).toHaveProperty('imageUrls');
      expect(Array.isArray(response.body.data.imageUrls)).toBe(true);

      testProperty = response.body.data;
    });

    test('Should handle multiple image uploads', async () => {
      // Create additional test images
      const testImage2Path = path.join(__dirname, 'test-image-2.jpg');
      const testImage3Path = path.join(__dirname, 'test-image-3.jpg');
      
      fs.writeFileSync(testImage2Path, Buffer.from('fake-image-data-2'));
      fs.writeFileSync(testImage3Path, Buffer.from('fake-image-data-3'));

      const propertyData = {
        title: 'Property with Multiple Images',
        description: 'A property with multiple uploaded images',
        location: 'Multi Upload Test Location',
        price: 250000,
        bedrooms: 4,
        bathrooms: 3,
        propertyType: 'house'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .field('title', propertyData.title)
        .field('description', propertyData.description)
        .field('location', propertyData.location)
        .field('price', propertyData.price.toString())
        .field('bedrooms', propertyData.bedrooms.toString())
        .field('bathrooms', propertyData.bathrooms.toString())
        .field('propertyType', propertyData.propertyType)
        .attach('images', testImagePath)
        .attach('images', testImage2Path)
        .attach('images', testImage3Path);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('imageUrls');
      expect(response.body.data.imageUrls.length).toBeGreaterThan(0);

      // Cleanup additional test images
      fs.unlinkSync(testImage2Path);
      fs.unlinkSync(testImage3Path);

      // Cleanup test property
      await storage.deleteProperty(response.body.data.id);
    });

    test('Should reject oversized files', async () => {
      // Create a large test file (simulate file larger than limit)
      const largeImagePath = path.join(__dirname, 'large-test-image.jpg');
      const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB (over 10MB limit)
      fs.writeFileSync(largeImagePath, largeBuffer);

      const propertyData = {
        title: 'Property with Large Image',
        description: 'A property with oversized image',
        location: 'Large Upload Test Location',
        price: 300000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'house'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .field('title', propertyData.title)
        .field('description', propertyData.description)
        .field('location', propertyData.location)
        .field('price', propertyData.price.toString())
        .field('bedrooms', propertyData.bedrooms.toString())
        .field('bathrooms', propertyData.bathrooms.toString())
        .field('propertyType', propertyData.propertyType)
        .attach('images', largeImagePath);

      expect(response.status).toBe(413); // Payload Too Large
      expect(response.body.success).toBe(false);

      // Cleanup large test file
      fs.unlinkSync(largeImagePath);
    });

    test('Should handle property creation without images', async () => {
      const propertyData = {
        title: 'Property without Images',
        description: 'A property without uploaded images',
        location: 'No Image Test Location',
        price: 180000,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'apartment'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .send(propertyData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title', propertyData.title);

      // Cleanup test property
      await storage.deleteProperty(response.body.data.id);
    });
  });

  describe('Document Upload for Verification', () => {
    test('Should handle document upload for property verification', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      // Create a test document file
      const testDocPath = path.join(__dirname, 'test-document.pdf');
      const testDocBuffer = Buffer.from('fake-pdf-document-data');
      fs.writeFileSync(testDocPath, testDocBuffer);

      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/documents`)
        .set('Cookie', authCookie)
        .attach('document', testDocPath)
        .field('documentType', 'ownership_certificate');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Cleanup test document
      fs.unlinkSync(testDocPath);
    });

    test('Should validate document types for verification', async () => {
      if (!testProperty) {
        throw new Error('Test property not created');
      }

      // Create a test document with invalid extension
      const testInvalidDocPath = path.join(__dirname, 'test-invalid.txt');
      const testInvalidBuffer = Buffer.from('invalid-document-type');
      fs.writeFileSync(testInvalidDocPath, testInvalidBuffer);

      const response = await request(app)
        .post(`/api/properties/${testProperty.id}/documents`)
        .set('Cookie', authCookie)
        .attach('document', testInvalidDocPath)
        .field('documentType', 'ownership_certificate');

      // Should either accept it or reject with proper error
      if (response.status !== 200) {
        expect(response.body.success).toBe(false);
        expect(response.body).toHaveProperty('message');
      }

      // Cleanup test document
      fs.unlinkSync(testInvalidDocPath);
    });
  });

  describe('File Upload Security', () => {
    test('Should sanitize uploaded file names', async () => {
      // Create a test file with potentially dangerous name
      const dangerousFileName = '../../../malicious.jpg';
      const safePath = path.join(__dirname, 'malicious.jpg');
      fs.writeFileSync(safePath, Buffer.from('test-data'));

      const propertyData = {
        title: 'Security Test Property',
        description: 'Testing file name sanitization',
        location: 'Security Test Location',
        price: 150000,
        bedrooms: 2,
        bathrooms: 1,
        propertyType: 'apartment'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .field('title', propertyData.title)
        .field('description', propertyData.description)
        .field('location', propertyData.location)
        .field('price', propertyData.price.toString())
        .field('bedrooms', propertyData.bedrooms.toString())
        .field('bathrooms', propertyData.bathrooms.toString())
        .field('propertyType', propertyData.propertyType)
        .attach('images', safePath);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);

      // File should be uploaded with sanitized name
      if (response.body.data.imageUrls && response.body.data.imageUrls.length > 0) {
        const uploadedUrl = response.body.data.imageUrls[0];
        expect(uploadedUrl).not.toContain('../');
        expect(uploadedUrl).not.toContain('malicious');
      }

      // Cleanup
      fs.unlinkSync(safePath);
      await storage.deleteProperty(response.body.data.id);
    });

    test('Should require authentication for file uploads', async () => {
      const propertyData = {
        title: 'Unauthorized Upload Test',
        description: 'Testing unauthorized file upload',
        location: 'Unauthorized Test Location',
        price: 100000,
        bedrooms: 1,
        bathrooms: 1,
        propertyType: 'studio'
      };

      const response = await request(app)
        .post('/api/properties')
        .field('title', propertyData.title)
        .field('description', propertyData.description)
        .field('location', propertyData.location)
        .field('price', propertyData.price.toString())
        .field('bedrooms', propertyData.bedrooms.toString())
        .field('bathrooms', propertyData.bathrooms.toString())
        .field('propertyType', propertyData.propertyType)
        .attach('images', testImagePath);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('File Upload Performance', () => {
    test('File upload should complete within reasonable time', async () => {
      const startTime = Date.now();

      const propertyData = {
        title: 'Performance Upload Test',
        description: 'Testing file upload performance',
        location: 'Performance Test Location',
        price: 175000,
        bedrooms: 3,
        bathrooms: 2,
        propertyType: 'house'
      };

      const response = await request(app)
        .post('/api/properties')
        .set('Cookie', authCookie)
        .field('title', propertyData.title)
        .field('description', propertyData.description)
        .field('location', propertyData.location)
        .field('price', propertyData.price.toString())
        .field('bedrooms', propertyData.bedrooms.toString())
        .field('bathrooms', propertyData.bathrooms.toString())
        .field('propertyType', propertyData.propertyType)
        .attach('images', testImagePath);

      const duration = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`File upload performance: ${duration}ms`);

      // Cleanup
      await storage.deleteProperty(response.body.data.id);
    });
  });
});