/**
 * Data Generation Framework
 * 
 * Comprehensive data generation system for development, testing, and performance scenarios.
 * Supports configurable data volumes, realistic data patterns, and schema validation.
 */

import { faker } from '@faker-js/faker';
import postgres from '../../../../../scripts/cleanup-redundancies';
import { z } from 'zod';

// Data generation configuration
export interface DataGenerationConfig {
  scenario: 'development' | 'testing' | 'performance' | 'minimal';
  volumes: {
    users: number;
    properties: number;
    reviews: number;
    transactions: number;
    verifications: number;
  };
  options: {
    useRealisticData: boolean;
    includeTestData: boolean;
    generateImages: boolean;
    seedRandomness: string | null;
    batchSize: number;
    validateConstraints: boolean;
  };
  locale: string;
  region: 'kenya' | 'global';
}

// Predefined scenarios
export const DATA_SCENARIOS: Record<string, DataGenerationConfig> = {
  development: {
    scenario: 'development',
    volumes: {
      users: 50,
      properties: 200,
      reviews: 500,
      transactions: 100,
      verifications: 150
    },
    options: {
      useRealisticData: true,
      includeTestData: true,
      generateImages: false,
      seedRandomness: 'dev-seed-2024',
      batchSize: 50,
      validateConstraints: true
    },
    locale: 'en_KE',
    region: 'kenya'
  },
  testing: {
    scenario: 'testing',
    volumes: {
      users: 20,
      properties: 50,
      reviews: 100,
      transactions: 30,
      verifications: 40
    },
    options: {
      useRealisticData: false,
      includeTestData: true,
      generateImages: false,
      seedRandomness: 'test-seed-stable',
      batchSize: 20,
      validateConstraints: true
    },
    locale: 'en_KE',
    region: 'kenya'
  },
  performance: {
    scenario: 'performance',
    volumes: {
      users: 10000,
      properties: 50000,
      reviews: 100000,
      transactions: 25000,
      verifications: 30000
    },
    options: {
      useRealisticData: true,
      includeTestData: false,
      generateImages: false,
      seedRandomness: 'perf-seed-2024',
      batchSize: 1000,
      validateConstraints: false // Skip for performance
    },
    locale: 'en_KE',
    region: 'kenya'
  },
  minimal: {
    scenario: 'minimal',
    volumes: {
      users: 5,
      properties: 10,
      reviews: 20,
      transactions: 5,
      verifications: 8
    },
    options: {
      useRealisticData: true,
      includeTestData: true,
      generateImages: false,
      seedRandomness: 'minimal-seed',
      batchSize: 10,
      validateConstraints: true
    },
    locale: 'en_KE',
    region: 'kenya'
  }
};

// Data validation schemas
export const DataValidationSchemas = {
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
    phone: z.string().optional(),
    created_at: z.date(),
    updated_at: z.date()
  }),
  
  property: z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(10).max(2000),
    price: z.number().positive(),
    location: z.string().min(1).max(100),
    property_type: z.enum(['residential', 'commercial', 'land']),
    status: z.enum(['active', 'sold', 'pending', 'inactive']),
    user_id: z.string().uuid(),
    created_at: z.date(),
    updated_at: z.date()
  }),
  
  review: z.object({
    id: z.string().uuid(),
    rating: z.number().min(1).max(5),
    comment: z.string().min(10).max(1000),
    property_id: z.string().uuid(),
    user_id: z.string().uuid(),
    created_at: z.date()
  })
};

// Generation result interface
export interface GenerationResult {
  success: boolean;
  recordsGenerated: {
    users: number;
    properties: number;
    reviews: number;
    transactions: number;
    verifications: number;
  };
  duration: number;
  errors: string[];
  warnings: string[];
  validationResults?: ValidationResult;
}

export interface ValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  constraintViolations: string[];
  foreignKeyViolations: string[];
}

/**
 * Main data generation class
 */
export class DataGenerator {
  private config: DataGenerationConfig;
  private sql: postgres.Sql;
  private generatedIds: Map<string, string[]> = new Map();

  constructor(sql: postgres.Sql, config: DataGenerationConfig) {
    this.sql = sql;
    this.config = config;
    
    // Set faker locale and seed
    faker.setLocale(config.locale);
    if (config.options.seedRandomness) {
      faker.seed(this.hashSeed(config.options.seedRandomness));
    }
  }

  /**
   * Generate all data according to configuration
   */
  async generateAll(): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      success: true,
      recordsGenerated: {
        users: 0,
        properties: 0,
        reviews: 0,
        transactions: 0,
        verifications: 0
      },
      duration: 0,
      errors: [],
      warnings: []
    };

    try {
      console.log(`🎲 Starting data generation for ${this.config.scenario} scenario...`);
      
      // Clear existing data if needed
      if (this.config.scenario === 'testing') {
        await this.clearTestData();
      }

      // Generate data in dependency order
      result.recordsGenerated.users = await this.generateUsers();
      result.recordsGenerated.properties = await this.generateProperties();
      result.recordsGenerated.reviews = await this.generateReviews();
      result.recordsGenerated.transactions = await this.generateTransactions();
      result.recordsGenerated.verifications = await this.generateVerifications();

      // Validate generated data if enabled
      if (this.config.options.validateConstraints) {
        result.validationResults = await this.validateGeneratedData();
      }

      result.duration = Date.now() - startTime;
      
      const totalRecords = Object.values(result.recordsGenerated).reduce((sum, count) => sum + count, 0);
      console.log(`✅ Generated ${totalRecords} records in ${result.duration}ms`);
      
      return result;
    } catch (error) {
      result.success = false;
      result.duration = Date.now() - startTime;
      result.errors.push(error instanceof Error ? error.message : String(error));
      
      console.error('❌ Data generation failed:', error);
      return result;
    }
  }

  /**
   * Generate users with realistic Kenyan data
   */
  private async generateUsers(): Promise<number> {
    const users = [];
    const {batchSize} = this.config.options;
    let generated = 0;

    console.log(`👥 Generating ${this.config.volumes.users} users...`);

    for (let i = 0; i < this.config.volumes.users; i += batchSize) {
      const batch = [];
      const batchEnd = Math.min(i + batchSize, this.config.volumes.users);

      for (let j = i; j < batchEnd; j++) {
        const user = this.generateUser();
        batch.push(user);
      }

      // Insert batch
      if (batch.length > 0) {
        await this.sql`
          INSERT INTO users ${this.sql(batch)}
        `;
        
        // Store generated IDs
        const userIds = batch.map(u => u.id);
        this.generatedIds.set('users', (this.generatedIds.get('users') || []).concat(userIds));
        
        generated += batch.length;
      }
    }

    return generated;
  }

  /**
   * Generate properties with Kenyan locations and realistic data
   */
  private async generateProperties(): Promise<number> {
    const properties = [];
    const {batchSize} = this.config.options;
    let generated = 0;
    
    const userIds = this.generatedIds.get('users') || [];
    if (userIds.length === 0) {
      throw new Error('No users available for property generation');
    }

    console.log(`🏠 Generating ${this.config.volumes.properties} properties...`);

    for (let i = 0; i < this.config.volumes.properties; i += batchSize) {
      const batch = [];
      const batchEnd = Math.min(i + batchSize, this.config.volumes.properties);

      for (let j = i; j < batchEnd; j++) {
        const property = this.generateProperty(userIds);
        batch.push(property);
      }

      // Insert batch
      if (batch.length > 0) {
        await this.sql`
          INSERT INTO properties ${this.sql(batch)}
        `;
        
        // Store generated IDs
        const propertyIds = batch.map(p => p.id);
        this.generatedIds.set('properties', (this.generatedIds.get('properties') || []).concat(propertyIds));
        
        generated += batch.length;
      }
    }

    return generated;
  }

  /**
   * Generate reviews for properties
   */
  private async generateReviews(): Promise<number> {
    const reviews = [];
    const {batchSize} = this.config.options;
    let generated = 0;
    
    const userIds = this.generatedIds.get('users') || [];
    const propertyIds = this.generatedIds.get('properties') || [];
    
    if (userIds.length === 0 || propertyIds.length === 0) {
      console.warn('⚠️ Skipping review generation - missing users or properties');
      return 0;
    }

    console.log(`⭐ Generating ${this.config.volumes.reviews} reviews...`);

    for (let i = 0; i < this.config.volumes.reviews; i += batchSize) {
      const batch = [];
      const batchEnd = Math.min(i + batchSize, this.config.volumes.reviews);

      for (let j = i; j < batchEnd; j++) {
        const review = this.generateReview(userIds, propertyIds);
        batch.push(review);
      }

      // Insert batch
      if (batch.length > 0) {
        await this.sql`
          INSERT INTO reviews ${this.sql(batch)}
        `;
        
        generated += batch.length;
      }
    }

    return generated;
  }

  /**
   * Generate transactions
   */
  private async generateTransactions(): Promise<number> {
    const transactions = [];
    const {batchSize} = this.config.options;
    let generated = 0;
    
    const userIds = this.generatedIds.get('users') || [];
    const propertyIds = this.generatedIds.get('properties') || [];
    
    if (userIds.length === 0 || propertyIds.length === 0) {
      console.warn('⚠️ Skipping transaction generation - missing users or properties');
      return 0;
    }

    console.log(`💰 Generating ${this.config.volumes.transactions} transactions...`);

    for (let i = 0; i < this.config.volumes.transactions; i += batchSize) {
      const batch = [];
      const batchEnd = Math.min(i + batchSize, this.config.volumes.transactions);

      for (let j = i; j < batchEnd; j++) {
        const transaction = this.generateTransaction(userIds, propertyIds);
        batch.push(transaction);
      }

      // Insert batch
      if (batch.length > 0) {
        await this.sql`
          INSERT INTO transactions ${this.sql(batch)}
        `;
        
        generated += batch.length;
      }
    }

    return generated;
  }

  /**
   * Generate verifications
   */
  private async generateVerifications(): Promise<number> {
    const verifications = [];
    const {batchSize} = this.config.options;
    let generated = 0;
    
    const propertyIds = this.generatedIds.get('properties') || [];
    
    if (propertyIds.length === 0) {
      console.warn('⚠️ Skipping verification generation - missing properties');
      return 0;
    }

    console.log(`🔍 Generating ${this.config.volumes.verifications} verifications...`);

    for (let i = 0; i < this.config.volumes.verifications; i += batchSize) {
      const batch = [];
      const batchEnd = Math.min(i + batchSize, this.config.volumes.verifications);

      for (let j = i; j < batchEnd; j++) {
        const verification = this.generateVerification(propertyIds);
        batch.push(verification);
      }

      // Insert batch
      if (batch.length > 0) {
        await this.sql`
          INSERT INTO land_verifications ${this.sql(batch)}
        `;
        
        generated += batch.length;
      }
    }

    return generated;
  }

  /**
   * Generate a single user with Kenyan characteristics
   */
  private generateUser() {
    const kenyaNames = [
      'Wanjiku', 'Kamau', 'Otieno', 'Achieng', 'Mwangi', 'Njeri', 'Ochieng', 'Wanjiru',
      'Kiprotich', 'Chebet', 'Mutua', 'Wambui', 'Omondi', 'Nyong\'o', 'Kipchoge'
    ];
    
    const kenyaSurnames = [
      'Kenyatta', 'Odinga', 'Ruto', 'Uhuru', 'Raila', 'Kibaki', 'Moi', 'Koinange',
      'Macharia', 'Wanjiku', 'Kariuki', 'Njoroge', 'Kamau', 'Muthoni', 'Wangari'
    ];

    const firstName = this.config.options.useRealisticData 
      ? faker.helpers.arrayElement(kenyaNames)
      : faker.person.firstName();
    
    const lastName = this.config.options.useRealisticData
      ? faker.helpers.arrayElement(kenyaSurnames)
      : faker.person.lastName();

    return {
      id: faker.string.uuid(),
      email: faker.internet.email(firstName, lastName).toLowerCase(),
      name: `${firstName} ${lastName}`,
      phone: this.config.region === 'kenya' ? this.generateKenyaPhone() : faker.phone.number(),
      created_at: faker.date.past({ years: 2 }),
      updated_at: faker.date.recent({ days: 30 })
    };
  }

  /**
   * Generate a single property with Kenyan locations
   */
  private generateProperty(userIds: string[]) {
    const kenyaLocations = [
      'Nairobi CBD', 'Westlands', 'Karen', 'Kilimani', 'Lavington', 'Runda', 'Muthaiga',
      'Kileleshwa', 'Parklands', 'South B', 'South C', 'Embakasi', 'Kasarani', 'Roysambu',
      'Mombasa Island', 'Nyali', 'Bamburi', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika',
      'Machakos', 'Kitengela', 'Ongata Rongai', 'Ngong', 'Limuru', 'Kikuyu'
    ];

    const propertyTypes = ['residential', 'commercial', 'land'] as const;
    const statuses = ['active', 'sold', 'pending', 'inactive'] as const;

    const propertyType = faker.helpers.arrayElement(propertyTypes);
    const location = this.config.options.useRealisticData
      ? faker.helpers.arrayElement(kenyaLocations)
      : faker.location.city();

    // Generate realistic prices based on location and type
    let basePrice = 5000000; // 5M KES base
    if (location.includes('Karen') || location.includes('Runda') || location.includes('Muthaiga')) {
      basePrice *= 3; // Premium locations
    }
    if (propertyType === 'commercial') {
      basePrice *= 2;
    }
    if (propertyType === 'land') {
      basePrice *= 0.6;
    }

    const price = faker.number.int({ 
      min: Math.floor(basePrice * 0.5), 
      max: Math.floor(basePrice * 2) 
    });

    return {
      id: faker.string.uuid(),
      title: this.generatePropertyTitle(propertyType, location),
      description: this.generatePropertyDescription(propertyType, location),
      price,
      location,
      property_type: propertyType,
      status: faker.helpers.arrayElement(statuses),
      user_id: faker.helpers.arrayElement(userIds),
      created_at: faker.date.past({ years: 1 }),
      updated_at: faker.date.recent({ days: 60 })
    };
  }

  /**
   * Generate a single review
   */
  private generateReview(userIds: string[], propertyIds: string[]) {
    const rating = faker.number.int({ min: 1, max: 5 });
    
    return {
      id: faker.string.uuid(),
      rating,
      comment: this.generateReviewComment(rating),
      property_id: faker.helpers.arrayElement(propertyIds),
      user_id: faker.helpers.arrayElement(userIds),
      created_at: faker.date.recent({ days: 90 })
    };
  }

  /**
   * Generate a single transaction
   */
  private generateTransaction(userIds: string[], propertyIds: string[]) {
    const transactionTypes = ['purchase', 'rental', 'lease', 'inquiry'] as const;
    const statuses = ['pending', 'completed', 'cancelled', 'failed'] as const;

    return {
      id: faker.string.uuid(),
      type: faker.helpers.arrayElement(transactionTypes),
      amount: faker.number.int({ min: 50000, max: 20000000 }),
      status: faker.helpers.arrayElement(statuses),
      property_id: faker.helpers.arrayElement(propertyIds),
      user_id: faker.helpers.arrayElement(userIds),
      created_at: faker.date.recent({ days: 180 }),
      updated_at: faker.date.recent({ days: 30 })
    };
  }

  /**
   * Generate a single verification
   */
  private generateVerification(propertyIds: string[]) {
    const statuses = ['pending', 'in_progress', 'completed', 'failed', 'requires_review'] as const;
    const verificationTypes = ['document', 'physical', 'legal', 'financial'] as const;

    return {
      id: faker.string.uuid(),
      property_id: faker.helpers.arrayElement(propertyIds),
      verification_type: faker.helpers.arrayElement(verificationTypes),
      status: faker.helpers.arrayElement(statuses),
      confidence_score: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
      risk_factors: JSON.stringify(this.generateRiskFactors()),
      created_at: faker.date.recent({ days: 120 }),
      updated_at: faker.date.recent({ days: 15 })
    };
  }

  /**
   * Generate Kenya phone number
   */
  private generateKenyaPhone(): string {
    const prefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', '0710'];
    const prefix = faker.helpers.arrayElement(prefixes);
    const suffix = faker.string.numeric(6);
    return `${prefix}${suffix}`;
  }

  /**
   * Generate property title based on type and location
   */
  private generatePropertyTitle(type: string, location: string): string {
    const templates = {
      residential: [
        `Modern ${faker.number.int({ min: 2, max: 5 })} Bedroom House in ${location}`,
        `Luxury Apartment in ${location}`,
        `Family Home with Garden in ${location}`,
        `Spacious Villa in ${location}`
      ],
      commercial: [
        `Commercial Building in ${location}`,
        `Office Space in ${location}`,
        `Retail Shop in ${location}`,
        `Warehouse in ${location}`
      ],
      land: [
        `Prime Land for Sale in ${location}`,
        `Residential Plot in ${location}`,
        `Commercial Land in ${location}`,
        `Agricultural Land in ${location}`
      ]
    };

    return faker.helpers.arrayElement(templates[type as keyof typeof templates]);
  }

  /**
   * Generate property description
   */
  private generatePropertyDescription(type: string, location: string): string {
    const features = [
      'modern kitchen', 'spacious living room', 'master bedroom with ensuite',
      'parking space', 'security', 'water supply', 'electricity connection',
      'good road access', 'near schools', 'near shopping centers'
    ];

    const selectedFeatures = faker.helpers.arrayElements(features, { min: 3, max: 6 });
    
    return `Beautiful ${type} located in ${location}. Features include: ${selectedFeatures.join(', ')}. ${faker.lorem.sentences(2)}`;
  }

  /**
   * Generate review comment based on rating
   */
  private generateReviewComment(rating: number): string {
    const positiveComments = [
      'Excellent property with great amenities.',
      'Very satisfied with the location and quality.',
      'Highly recommend this property.',
      'Great value for money.',
      'Professional service and beautiful property.'
    ];

    const neutralComments = [
      'Decent property, meets basic requirements.',
      'Average property with standard features.',
      'Okay for the price range.',
      'Could be better but acceptable.'
    ];

    const negativeComments = [
      'Property needs improvement.',
      'Not as described, disappointed.',
      'Issues with maintenance and service.',
      'Overpriced for what you get.',
      'Would not recommend.'
    ];

    if (rating >= 4) {
      return faker.helpers.arrayElement(positiveComments);
    } else if (rating >= 3) {
      return faker.helpers.arrayElement(neutralComments);
    } else {
      return faker.helpers.arrayElement(negativeComments);
    }
  }

  /**
   * Generate risk factors for verification
   */
  private generateRiskFactors(): string[] {
    const allRiskFactors = [
      'document_inconsistency',
      'ownership_dispute',
      'boundary_issues',
      'legal_complications',
      'financial_irregularities',
      'incomplete_documentation',
      'suspicious_transaction_history'
    ];

    return faker.helpers.arrayElements(allRiskFactors, { min: 0, max: 3 });
  }

  /**
   * Clear test data
   */
  private async clearTestData(): Promise<void> {
    console.log('🧹 Clearing existing test data...');
    
    // Clear in reverse dependency order
    await this.sql`DELETE FROM reviews WHERE created_at > NOW() - INTERVAL '1 day'`;
    await this.sql`DELETE FROM transactions WHERE created_at > NOW() - INTERVAL '1 day'`;
    await this.sql`DELETE FROM land_verifications WHERE created_at > NOW() - INTERVAL '1 day'`;
    await this.sql`DELETE FROM properties WHERE created_at > NOW() - INTERVAL '1 day'`;
    await this.sql`DELETE FROM users WHERE created_at > NOW() - INTERVAL '1 day'`;
  }

  /**
   * Validate generated data against schemas and constraints
   */
  private async validateGeneratedData(): Promise<ValidationResult> {
    console.log('🔍 Validating generated data...');
    
    const result: ValidationResult = {
      totalRecords: 0,
      validRecords: 0,
      invalidRecords: 0,
      constraintViolations: [],
      foreignKeyViolations: []
    };

    try {
      // Validate users
      const users = await this.sql`SELECT * FROM users ORDER BY created_at DESC LIMIT ${this.config.volumes.users}`;
      for (const user of users) {
        result.totalRecords++;
        try {
          DataValidationSchemas.user.parse({
            ...user,
            created_at: new Date(user.created_at),
            updated_at: new Date(user.updated_at)
          });
          result.validRecords++;
        } catch (error) {
          result.invalidRecords++;
          result.constraintViolations.push(`User ${user.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Validate properties
      const properties = await this.sql`SELECT * FROM properties ORDER BY created_at DESC LIMIT ${this.config.volumes.properties}`;
      for (const property of properties) {
        result.totalRecords++;
        try {
          DataValidationSchemas.property.parse({
            ...property,
            created_at: new Date(property.created_at),
            updated_at: new Date(property.updated_at)
          });
          result.validRecords++;
        } catch (error) {
          result.invalidRecords++;
          result.constraintViolations.push(`Property ${property.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Check foreign key constraints
      const orphanedProperties = await this.sql`
        SELECT p.id FROM properties p 
        LEFT JOIN users u ON p.user_id = u.id 
        WHERE u.id IS NULL
        ORDER BY p.created_at DESC 
        LIMIT 100
      `;
      
      for (const orphan of orphanedProperties) {
        result.foreignKeyViolations.push(`Property ${orphan.id} has invalid user_id reference`);
      }

      console.log(`✅ Validation complete: ${result.validRecords}/${result.totalRecords} valid records`);
      
      return result;
    } catch (error) {
      console.error('❌ Validation failed:', error);
      result.constraintViolations.push(`Validation error: ${error instanceof Error ? error.message : String(error)}`);
      return result;
    }
  }

  /**
   * Hash seed string to number for faker
   */
  private hashSeed(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Convenience function to generate data with predefined scenario
 */
export async function generateDataForScenario(
  sql: postgres.Sql, 
  scenarioName: keyof typeof DATA_SCENARIOS
): Promise<GenerationResult> {
  const config = DATA_SCENARIOS[scenarioName];
  if (!config) {
    throw new Error(`Unknown scenario: ${scenarioName}`);
  }

  const generator = new DataGenerator(sql, config);
  return await generator.generateAll();
}

/**
 * Convenience function to generate data with custom configuration
 */
export async function generateDataWithConfig(
  sql: postgres.Sql, 
  config: DataGenerationConfig
): Promise<GenerationResult> {
  const generator = new DataGenerator(sql, config);
  return await generator.generateAll();
}

export default DataGenerator;