/**
 * Kenyan-Specific Data Generator
 * 
 * Generates realistic Kenyan property data with authentic names, locations,
 * pricing, and cultural context for comprehensive application testing.
 */

import postgres from 'postgres';

export interface KenyanLocation {
  name: string;
  county: string;
  coordinates: { lat: number; lng: number };
  averagePrice: number;
  propertyTypes: string[];
  description: string;
}

export interface KenyanName {
  firstName: string;
  lastName: string;
  tribe: string;
  gender: 'male' | 'female';
}

export interface DataGenerationScenario {
  name: string;
  userCount: number;
  propertyCount: number;
  reviewCount: number;
  professionalCount: number;
  verificationSessionCount: number;
  description: string;
}

/**
 * Comprehensive Kenyan data generator with authentic cultural context
 */
export class KenyanDataGenerator {
  private locations: KenyanLocation[] = [];
  private names: KenyanName[] = [];
  private occupations: string[] = [];
  private propertyDescriptions: string[] = [];
  
  constructor() {
    this.initializeKenyanData();
  }
  
  /**
   * Initialize authentic Kenyan data sets
   */
  private initializeKenyanData(): void {
    this.loadKenyanLocations();
    this.loadKenyanNames();
    this.loadKenyanOccupations();
    this.loadPropertyDescriptions();
  }
  
  /**
   * Load authentic Kenyan locations with realistic pricing
   */
  private loadKenyanLocations(): void {
    this.locations = [
      // Nairobi County
      {
        name: 'Westlands',
        county: 'Nairobi',
        coordinates: { lat: -1.2676, lng: 36.8108 },
        averagePrice: 15000000,
        propertyTypes: ['apartment', 'commercial', 'land'],
        description: 'Prime business district with modern amenities'
      },
      {
        name: 'Karen',
        county: 'Nairobi',
        coordinates: { lat: -1.3197, lng: 36.6859 },
        averagePrice: 25000000,
        propertyTypes: ['house', 'land'],
        description: 'Upscale residential area with large plots'
      },
      {
        name: 'Kilimani',
        county: 'Nairobi',
        coordinates: { lat: -1.2921, lng: 36.7809 },
        averagePrice: 12000000,
        propertyTypes: ['apartment', 'commercial'],
        description: 'Modern residential and commercial hub'
      }
    ];
  }

  /**
   * Load authentic Kenyan names
   */
  private loadKenyanNames(): void {
    this.names = [
      { firstName: 'Wanjiku', lastName: 'Kenyatta', tribe: 'Kikuyu', gender: 'female' },
      { firstName: 'Kamau', lastName: 'Mwangi', tribe: 'Kikuyu', gender: 'male' },
      { firstName: 'Otieno', lastName: 'Ochieng', tribe: 'Luo', gender: 'male' },
      { firstName: 'Achieng', lastName: 'Adhiambo', tribe: 'Luo', gender: 'female' },
      { firstName: 'Kipchoge', lastName: 'Ruto', tribe: 'Kalenjin', gender: 'male' },
      { firstName: 'Chebet', lastName: 'Koech', tribe: 'Kalenjin', gender: 'female' }
    ];
  }

  /**
   * Load Kenyan occupations
   */
  private loadKenyanOccupations(): void {
    this.occupations = [
      'Teacher', 'Farmer', 'Business Owner', 'Civil Servant', 'Doctor',
      'Engineer', 'Lawyer', 'Accountant', 'Nurse', 'Driver'
    ];
  }

  /**
   * Load property descriptions
   */
  private loadPropertyDescriptions(): void {
    this.propertyDescriptions = [
      'Beautiful property with modern amenities',
      'Prime location with excellent access to transport',
      'Spacious family home with garden',
      'Commercial property in busy area',
      'Affordable housing with good security'
    ];
  }

  /**
   * Generate random Kenyan name
   */
  generateKenyanName(): KenyanName {
    return this.names[Math.floor(Math.random() * this.names.length)];
  }

  /**
   * Generate random Kenyan location
   */
  generateKenyanLocation(): KenyanLocation {
    return this.locations[Math.floor(Math.random() * this.locations.length)];
  }

  /**
   * Generate random occupation
   */
  generateOccupation(): string {
    return this.occupations[Math.floor(Math.random() * this.occupations.length)];
  }

  /**
   * Generate random property description
   */
  generatePropertyDescription(): string {
    return this.propertyDescriptions[Math.floor(Math.random() * this.propertyDescriptions.length)];
  }

  /**
   * Generate Kenyan phone number
   */
  generateKenyanPhoneNumber(): string {
    const prefixes = ['0701', '0702', '0703', '0704', '0705', '0706', '0707', '0708', '0709', '0710'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `+254${prefix.substring(1)}${suffix}`;
  }

  /**
   * Generate realistic property price for location
   */
  generatePropertyPrice(location: KenyanLocation, propertyType: string): number {
    const basePrice = location.averagePrice;
    const variation = 0.3; // 30% variation
    const randomFactor = 1 + (Math.random() - 0.5) * variation;
    
    // Adjust for property type
    const typeMultipliers = {
      'house': 1.2,
      'apartment': 0.8,
      'commercial': 1.5,
      'land': 0.6
    };
    
    const multiplier = typeMultipliers[propertyType as keyof typeof typeMultipliers] || 1;
    return Math.round(basePrice * randomFactor * multiplier);
  }
}