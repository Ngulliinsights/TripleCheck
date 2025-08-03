#!/usr/bin/env tsx
/**
 * Unified Data Generator for TripleCheck
 * 
 * Combines functionality from:
 * - data-generator.js (core generation logic)
 * - run-data-generation.js (CLI interface)
 * - Python generators integration
 */

import 'dotenv/config';
import { spawn } from 'child_process';
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core data type definitions for better TypeScript safety
interface User {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  userType: 'buyer' | 'seller' | 'agent' | 'investor';
  trustScore: number;
  isSuspicious: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PropertyFeatures {
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  parkingSpaces: number;
  yearBuilt: number;
  amenities: string[];
  petFriendly: boolean;
  furnished: boolean;
  propertyType: string;
}

interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  propertyType: 'apartment' | 'house' | 'commercial' | 'land';
  features: PropertyFeatures;
  imageUrls: string[];
  isSuspicious: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Review {
  id: string;
  userId: string;
  propertyId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

interface GenerationOptions {
  users: number;
  properties: number;
  reviews: number;
  outputDir?: string;
  usePython?: boolean;
  fraudRate?: number;
  validateOutput?: boolean;
}

interface GenerationReport {
  timestamp: string;
  options: GenerationOptions;
  results: {
    usersGenerated: number;
    propertiesGenerated: number;
    reviewsGenerated: number;
    fraudulentUsers: number;
    fraudulentProperties: number;
    processingTime: number;
  };
  files: {
    userFile: string;
    propertyFile: string;
    reviewFile?: string;
    reportFile: string;
  };
  errors: string[];
}

// Utility type for better randomization
type RandomSelector<T> = {
  readonly values: ReadonlyArray<T>;
  select(): T;
}

// Helper function to create a random selector
function createRandomSelector<T>(values: ReadonlyArray<T>): RandomSelector<T> {
  return {
    values,
    select(): T {
      return values[Math.floor(Math.random() * values.length)];
    }
  };
}

class UnifiedDataGenerator {
  private readonly outputDir: string;
  private readonly startTime: number;
  
  // Pre-defined data selectors for better performance and maintainability
  private readonly kenyanFirstNames = createRandomSelector([
    'John', 'Mary', 'Peter', 'Grace', 'David', 'Sarah', 'James', 'Ruth', 'Daniel', 'Esther',
    'Michael', 'Ann', 'Joseph', 'Jane', 'Francis', 'Lucy', 'Paul', 'Margaret', 'Samuel', 'Catherine'
  ]);
  
  private readonly kenyanLastNames = createRandomSelector([
    'Kamau', 'Wanjiku', 'Makau', 'Njeri', 'Kiprotich', 'Achieng', 'Maina', 'Wambui', 
    'Ochieng', 'Nyong', 'Kimani', 'Wanjiru', 'Mutua', 'Mwende', 'Kiplagat', 'Chebet'
  ]);
  
  private readonly locations = createRandomSelector([
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'
  ]);
  
  private readonly propertyTypes = createRandomSelector([
    'apartment', 'house', 'commercial', 'land'
  ] as const);
  
  private readonly userTypes = createRandomSelector([
    'buyer', 'seller', 'agent', 'investor'
  ] as const);
  
  private readonly emailDomains = createRandomSelector([
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'
  ]);
  
  private readonly reviewTemplates = createRandomSelector([
    "Excellent property with great amenities and professional service.",
    "Good location and well-maintained facilities throughout.",
    "Average property with decent value for the price point.",
    "Outstanding service from owner and responsive communication.",
    "Beautiful property in prime location with modern features.",
    "Clean and spacious with all necessary amenities included.",
    "Great investment opportunity in a developing area.",
    "Professional management and well-kept common areas."
  ]);

  constructor(outputDir?: string) {
    this.outputDir = outputDir || path.join(__dirname, 'data-generation');
    this.startTime = Date.now();
  }

  /**
   * Generate comprehensive test data with improved error handling and validation
   */
  async generateData(options: GenerationOptions): Promise<GenerationReport> {
    console.log('🎲 Unified Data Generator Starting');
    console.log('==================================');
    console.log(`Target: ${options.users} users, ${options.properties} properties, ${options.reviews} reviews`);
    console.log(`Output: ${this.outputDir}`);
    console.log(`Method: ${options.usePython ? 'Python generators' : 'JavaScript generators'}`);
    console.log(`Fraud Rate: ${((options.fraudRate || 0.02) * 100).toFixed(1)}%`);
    console.log('');

    const report: GenerationReport = {
      timestamp: new Date().toISOString(),
      options,
      results: {
        usersGenerated: 0,
        propertiesGenerated: 0,
        reviewsGenerated: 0,
        fraudulentUsers: 0,
        fraudulentProperties: 0,
        processingTime: 0
      },
      files: {
        userFile: path.join(this.outputDir, 'fraudulent_user_dataset.json'),
        propertyFile: path.join(this.outputDir, 'fraudulent_property_dataset.json'),
        reviewFile: path.join(this.outputDir, 'review_dataset.json'),
        reportFile: path.join(this.outputDir, 'generation_report.json')
      },
      errors: []
    };

    try {
      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      if (options.usePython) {
        await this.generateWithPython(options, report);
      } else {
        await this.generateWithJavaScript(options, report);
      }

      // Validate output if requested
      if (options.validateOutput !== false) {
        await this.validateGeneratedData(report);
      }

      // Calculate processing time
      report.results.processingTime = Math.round((Date.now() - this.startTime) / 1000);

      // Save generation report
      await fs.writeFile(report.files.reportFile, JSON.stringify(report, null, 2));

      this.logCompletionSummary(report);

      return report;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('\n❌ Data generation failed:', errorMessage);
      report.errors.push(errorMessage);
      throw error;
    }
  }

  /**
   * Generate data using Python scripts with improved error handling
   */
  private async generateWithPython(options: GenerationOptions, report: GenerationReport): Promise<void> {
    console.log('🐍 Using Python Generators...\n');

    try {
      // Generate users
      console.log('👥 Generating users...');
      await this.runPythonScript('user-generator.py', [
        '--count', options.users.toString(),
        '--fraud-rate', (options.fraudRate || 0.02).toString(),
        '--output', report.files.userFile
      ]);

      // Verify and process user data
      const userData = await this.processGeneratedFile<User>(report.files.userFile, 'users');
      report.results.usersGenerated = userData.length;
      report.results.fraudulentUsers = userData.filter(u => u.isSuspicious).length;

      // Generate properties
      console.log('🏠 Generating properties...');
      await this.runPythonScript('property-generator.py', [
        '--count', options.properties.toString(),
        '--fraud-rate', (options.fraudRate || 0.02).toString(),
        '--output', report.files.propertyFile
      ]);

      // Verify and process property data
      const propertyData = await this.processGeneratedFile<Property>(report.files.propertyFile, 'properties');
      report.results.propertiesGenerated = propertyData.length;
      report.results.fraudulentProperties = propertyData.filter(p => p.isSuspicious).length;

      // Generate reviews if requested
      if (options.reviews > 0) {
        console.log('⭐ Generating reviews...');
        await this.generateReviewsJS(options.reviews, userData, propertyData, report);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Python generation error';
      throw new Error(`Python generation failed: ${errorMessage}`);
    }
  }

  /**
   * Generate data using JavaScript with improved type safety
   */
  private async generateWithJavaScript(options: GenerationOptions, report: GenerationReport): Promise<void> {
    console.log('🟨 Using JavaScript Generators...\n');

    try {
      // Generate users with proper typing
      console.log('👥 Generating users...');
      const userData = await this.generateUsersJS(options.users, options.fraudRate || 0.02);
      await fs.writeFile(report.files.userFile, JSON.stringify(userData, null, 2));
      
      report.results.usersGenerated = userData.length;
      report.results.fraudulentUsers = userData.filter(u => u.isSuspicious).length;
      console.log(`   ✅ Generated ${report.results.usersGenerated} users`);

      // Generate properties with proper typing
      console.log('🏠 Generating properties...');
      const propertyData = await this.generatePropertiesJS(options.properties, options.fraudRate || 0.02);
      await fs.writeFile(report.files.propertyFile, JSON.stringify(propertyData, null, 2));
      
      report.results.propertiesGenerated = propertyData.length;
      report.results.fraudulentProperties = propertyData.filter(p => p.isSuspicious).length;
      console.log(`   ✅ Generated ${report.results.propertiesGenerated} properties`);

      // Generate reviews if requested
      if (options.reviews > 0) {
        console.log('⭐ Generating reviews...');
        await this.generateReviewsJS(options.reviews, userData, propertyData, report);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown JavaScript generation error';
      throw new Error(`JavaScript generation failed: ${errorMessage}`);
    }
  }

  /**
   * Process generated file with type safety and validation
   */
  private async processGeneratedFile<T>(filePath: string, entityType: string): Promise<T[]> {
    try {
      const fileStats = await fs.stat(filePath);
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent) as T[];
      
      console.log(`   ✅ Generated ${data.length} ${entityType} (${Math.round(fileStats.size / 1024)}KB)`);
      return data;
    } catch (error) {
      throw new Error(`Failed to process ${entityType} file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run Python script with improved error handling and timeout
   */
  private async runPythonScript(scriptName: string, args: string[]): Promise<void> {
    const scriptPath = path.join(this.outputDir, scriptName);
    const timeoutMs = 300000; // 5 minutes timeout
    
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [scriptPath, ...args], {
        cwd: this.outputDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';
      let isTimedOut = false;

      // Set up timeout
      const timeout = setTimeout(() => {
        isTimedOut = true;
        pythonProcess.kill('SIGTERM');
        reject(new Error(`Python script timed out after ${timeoutMs / 1000} seconds`));
      }, timeoutMs);

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        clearTimeout(timeout);
        if (isTimedOut) return; // Already handled by timeout
        
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr || stdout}`));
        }
      });

      pythonProcess.on('error', (error) => {
        clearTimeout(timeout);
        if (isTimedOut) return; // Already handled by timeout
        reject(new Error(`Failed to run Python script: ${error.message}`));
      });
    });
  }

  /**
   * Generate users using JavaScript with proper typing
   */
  private async generateUsersJS(count: number, fraudRate: number): Promise<User[]> {
    // Properly typed array initialization
    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = this.kenyanFirstNames.select();
      const lastName = this.kenyanLastNames.select();
      const isSuspicious = Math.random() < fraudRate;
      const userType = this.userTypes.select();
      const emailDomain = this.emailDomains.select();

      // Create user object with proper typing
      const user: User = {
        id: `USER_${this.generateId()}`,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${emailDomain}`,
        phone: `+254${Math.floor(Math.random() * 900000000 + 100000000)}`,
        userType,
        trustScore: Math.floor(Math.random() * 100),
        isSuspicious,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      users.push(user);
    }

    return users;
  }

  /**
   * Generate properties using JavaScript with proper typing
   */
  private async generatePropertiesJS(count: number, fraudRate: number): Promise<Property[]> {
    // Properly typed array initialization
    const properties: Property[] = [];

    for (let i = 0; i < count; i++) {
      const location = this.locations.select();
      const propertyType = this.propertyTypes.select();
      const isSuspicious = Math.random() < fraudRate;
      const bedrooms = Math.floor(Math.random() * 5) + 1;

      // Create property object with proper typing
      const property: Property = {
        id: `PROP_${this.generateId()}`,
        title: `${bedrooms}-Bedroom ${propertyType} in ${location}`,
        description: `Beautiful ${propertyType} located in ${location}. Features modern amenities and excellent location with easy access to major facilities.`,
        location: `${location}, Kenya`,
        price: Math.floor(Math.random() * 50000000 + 5000000), // 5M to 55M KES
        propertyType,
        features: {
          bedrooms,
          bathrooms: Math.floor(Math.random() * 3) + 1,
          squareFeet: Math.floor(Math.random() * 2000) + 500,
          parkingSpaces: Math.floor(Math.random() * 3),
          yearBuilt: Math.floor(Math.random() * 20) + 2005,
          amenities: this.generateRandomAmenities(),
          petFriendly: Math.random() > 0.5,
          furnished: Math.random() > 0.5,
          propertyType
        },
        imageUrls: this.generateImageUrls(),
        isSuspicious,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      properties.push(property);
    }

    return properties;
  }

  /**
   * Generate reviews using JavaScript with proper typing
   */
  private async generateReviewsJS(count: number, userData: User[], propertyData: Property[], report: GenerationReport): Promise<void> {
    // Properly typed array initialization
    const reviews: Review[] = [];

    for (let i = 0; i < count; i++) {
      const user = userData[Math.floor(Math.random() * userData.length)];
      const property = propertyData[Math.floor(Math.random() * propertyData.length)];

      // Create review object with proper typing
      const review: Review = {
        id: `REV_${this.generateId()}`,
        userId: user.id,
        propertyId: property.id,
        rating: Math.floor(Math.random() * 5) + 1,
        comment: this.reviewTemplates.select(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      reviews.push(review);
    }

    if (report.files.reviewFile) {
      await fs.writeFile(report.files.reviewFile, JSON.stringify(reviews, null, 2));
      report.results.reviewsGenerated = reviews.length;
      console.log(`   ✅ Generated ${reviews.length} reviews`);
    }
  }

  /**
   * Generate random amenities for properties
   */
  private generateRandomAmenities(): string[] {
    const allAmenities = ['Security', 'Water', 'Electricity', 'Internet', 'Parking', 'Garden', 'Pool', 'Gym'];
    const count = Math.floor(Math.random() * 5) + 3; // 3-7 amenities
    const shuffled = allAmenities.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  /**
   * Generate image URLs for properties
   */
  private generateImageUrls(): string[] {
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 images
    const urls: string[] = [];
    
    for (let i = 0; i < count; i++) {
      urls.push(`https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000000)}`);
    }
    
    return urls;
  }

  /**
   * Generate unique ID with better randomness
   */
  private generateId(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }

  /**
   * Validate generated data with improved error handling
   */
  private async validateGeneratedData(report: GenerationReport): Promise<void> {
    console.log('\n✅ Validating Generated Data...');

    try {
      // Validate user data
      const userData = JSON.parse(await fs.readFile(report.files.userFile, 'utf-8')) as User[];
      const validUsers = userData.filter(user => 
        user.id && 
        user.firstName && 
        user.lastName && 
        user.email?.includes('@') &&
        user.phone?.startsWith('+254')
      ).length;

      const userValidationRate = (validUsers / userData.length) * 100;
      console.log(`   Users: ${validUsers}/${userData.length} valid (${userValidationRate.toFixed(1)}%)`);

      // Validate property data
      const propertyData = JSON.parse(await fs.readFile(report.files.propertyFile, 'utf-8')) as Property[];
      const validProperties = propertyData.filter(property => 
        property.id && 
        property.title && 
        property.description && 
        property.location && 
        property.price > 0 &&
        property.features?.bedrooms > 0
      ).length;

      const propertyValidationRate = (validProperties / propertyData.length) * 100;
      console.log(`   Properties: ${validProperties}/${propertyData.length} valid (${propertyValidationRate.toFixed(1)}%)`);

      // Validate review data if exists
      if (report.files.reviewFile) {
        try {
          const reviewData = JSON.parse(await fs.readFile(report.files.reviewFile, 'utf-8')) as Review[];
          const validReviews = reviewData.filter(review => 
            review.id && 
            review.userId && 
            review.propertyId && 
            review.rating >= 1 && 
            review.rating <= 5 &&
            review.comment
          ).length;

          const reviewValidationRate = (validReviews / reviewData.length) * 100;
          console.log(`   Reviews: ${validReviews}/${reviewData.length} valid (${reviewValidationRate.toFixed(1)}%)`);
        } catch {
          console.log('   Reviews: No review file found or invalid format');
        }
      }

      // Check validation thresholds
      const validationThreshold = 95;
      if (userValidationRate < validationThreshold || propertyValidationRate < validationThreshold) {
        report.errors.push('Data validation failed - data quality below threshold');
        console.log('   ⚠️  Validation failed - data quality below threshold');
      } else {
        console.log('   ✅ Data validation passed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      report.errors.push(`Validation error: ${errorMessage}`);
      console.log(`   ❌ Validation failed: ${errorMessage}`);
    }
  }

  /**
   * Log completion summary with improved formatting
   */
  private logCompletionSummary(report: GenerationReport): void {
    console.log('\n🎉 Data Generation Completed!');
    console.log('=============================');
    console.log(`📊 Results:`);
    console.log(`   Users: ${report.results.usersGenerated} (${report.results.fraudulentUsers} fraudulent)`);
    console.log(`   Properties: ${report.results.propertiesGenerated} (${report.results.fraudulentProperties} fraudulent)`);
    console.log(`   Reviews: ${report.results.reviewsGenerated}`);
    console.log(`   Processing time: ${report.results.processingTime}s`);
    console.log(`   Output directory: ${this.outputDir}`);

    if (report.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${report.errors.length}`);
      report.errors.forEach(error => console.log(`   • ${error}`));
    }
  }
}

/**
 * CLI Interface with improved argument parsing
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Unified Data Generator for TripleCheck');
    console.log('=====================================');
    console.log('');
    console.log('Usage: npx tsx scripts/unified-data-generator.ts [users] [properties] [reviews] [options]');
    console.log('');
    console.log('Arguments:');
    console.log('  users        Number of users to generate (default: 1000)');
    console.log('  properties   Number of properties to generate (default: 500)');
    console.log('  reviews      Number of reviews to generate (default: 2000)');
    console.log('');
    console.log('Options:');
    console.log('  --python              Use Python generators instead of JavaScript');
    console.log('  --fraud-rate=0.02     Set fraud rate (default: 0.02 = 2%)');
    console.log('  --no-validate         Skip data validation');
    console.log('  --help, -h            Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/unified-data-generator.ts');
    console.log('  npx tsx scripts/unified-data-generator.ts 2000 1000 5000');
    console.log('  npx tsx scripts/unified-data-generator.ts 500 250 1000 --python');
    console.log('  npx tsx scripts/unified-data-generator.ts 1000 500 2000 --fraud-rate=0.05');
    return;
  }

  // Parse arguments with better error handling
  const users = Math.max(1, parseInt(args[0]) || 1000);
  const properties = Math.max(1, parseInt(args[1]) || 500);
  const reviews = Math.max(0, parseInt(args[2]) || 2000);
  
  const fraudRateArg = args.find(arg => arg.startsWith('--fraud-rate='));
  const fraudRate = fraudRateArg ? Math.max(0, Math.min(1, parseFloat(fraudRateArg.split('=')[1]))) : 0.02;
  
  const options: GenerationOptions = {
    users,
    properties,
    reviews,
    usePython: args.includes('--python'),
    fraudRate,
    validateOutput: !args.includes('--no-validate')
  };

  const generator = new UnifiedDataGenerator();
  
  try {
    const report = await generator.generateData(options);
    
    console.log('\n📋 Generation Summary:');
    console.log(`   Report saved to: ${report.files.reportFile}`);
    console.log(`   Data files created in: ${path.dirname(report.files.userFile)}`);
    
    if (report.errors.length === 0) {
      console.log('\n✅ Data generation completed successfully!');
      console.log('\nNext steps:');
      console.log('   1. Load data: npx tsx scripts/unified-data-pipeline.ts');
      console.log('   2. Verify database: npx tsx scripts/database-manager.ts verify');
      console.log('   3. Start application: npm run dev');
    } else {
      console.log('\n⚠️  Data generation completed with warnings');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Data generation failed');
    process.exit(1);
  }
}

// Execute main function if this script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { UnifiedDataGenerator, type User, type Property, type Review, type GenerationOptions, type GenerationReport };