import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { ProfessionalService } from '../ProfessionalService';
import { db } from '../../infrastructure/database/connection';
import { professionals, users } from '../../../src/shared/schema';

describe('ProfessionalService Integration Tests', () => {
  let professionalService: ProfessionalService;
  let testUserId: number;

  beforeAll(async () => {
    professionalService = new ProfessionalService();
    
    // Create a test user
    const [testUser] = await db
      .insert(users)
      .values({
        username: 'testprofessional',
        email: 'test@professional.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'Professional',
      })
      .returning();
    
    testUserId = testUser.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(professionals).where(eq(professionals.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it('should create and retrieve a professional profile', async () => {
    const professionalData = {
      userId: testUserId,
      businessName: 'Test Surveying Co.',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@testsurvey.com',
      phone: '+254700123456',
      businessAddress: '123 Test Street, Nairobi',
      serviceAreas: ['Nairobi', 'Kiambu'],
      primarySpecialization: 'land_surveying' as const,
      yearsOfExperience: 5,
      hourlyRate: 5000,
      currency: 'KES',
    };

    // Create professional
    const created = await professionalService.createProfessionalProfile(professionalData);
    expect(created).toBeDefined();
    expect(created.businessName).toBe(professionalData.businessName);
    expect(created.email).toBe(professionalData.email);

    // Retrieve professional
    const retrieved = await professionalService.getProfessionalById(created.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.businessName).toBe(professionalData.businessName);
    expect(retrieved?.primarySpecialization).toBe(professionalData.primarySpecialization);
  });

  it('should search professionals by specialization', async () => {
    const results = await professionalService.searchProfessionals({
      specialization: 'land_surveying',
      page: 1,
      limit: 10,
    });

    expect(results).toBeDefined();
    expect(results.professionals).toBeInstanceOf(Array);
    expect(results.totalCount).toBeGreaterThanOrEqual(0);
    expect(results.page).toBe(1);
    expect(results.limit).toBe(10);
  });

  it('should get professionals by category', async () => {
    const results = await professionalService.getProfessionalsByCategory(
      'land_surveying',
      'Nairobi',
      5
    );

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should get available professionals', async () => {
    const results = await professionalService.getAvailableProfessionals(
      'land_surveying',
      'Nairobi'
    );

    expect(results).toBeInstanceOf(Array);
    // All returned professionals should be available
    results.forEach(professional => {
      expect(professional.isAvailable).toBe(true);
    });
  });
});