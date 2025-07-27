import { Logger } from '../utils/Logger';
import { DatabaseService } from './DatabaseService';
import { ExternalAPIService } from './ExternalAPIService';

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  status: 'active' | 'inactive' | 'error';
  lastSync: Date;
  recordCount: number;
  errorCount: number;
}

export interface PropertyRecord {
  id: string;
  address: {
    street: string;
    city: string;
    state: string;
    county: string;
    zipCode: string;
    coordinates?: { lat: number; lng: number };
  };
  ownership: {
    current: OwnershipInfo;
    history: OwnershipInfo[];
  };
  valuation: {
    assessed: number;
    market: number;
    history: ValuationHistory[];
  };
  transactions: TransactionRecord[];
  liens: LienRecord[];
  permits: PermitRecord[];
  zoning: ZoningInfo;
  lastUpdated: Date;
}

export interface OwnershipInfo {
  ownerId: string;
  name: string;
  type: 'individual' | 'entity' | 'trust' | 'government';
  acquisitionDate: Date;
  acquisitionPrice?: number;
  ownershipPercentage: number;
  verified: boolean;
}

export interface TransactionRecord {
  id: string;
  date: Date;
  type: 'sale' | 'refinance' | 'transfer' | 'foreclosure';
  amount: number;
  buyer: PartyInfo;
  seller: PartyInfo;
  lender?: PartyInfo;
  agent?: PartyInfo;
  appraiser?: PartyInfo;
  titleCompany?: PartyInfo;
  attorney?: PartyInfo;
  documents: DocumentInfo[];
  flags: string[];
}

export interface PartyInfo {
  id: string;
  name: string;
  type: 'individual' | 'entity';
  address?: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  verified: boolean;
  riskScore?: number;
}

export interface ValuationHistory {
  date: Date;
  value: number;
  source: 'assessment' | 'appraisal' | 'sale' | 'estimate';
  appraiser?: string;
}

export interface LienRecord {
  id: string;
  type: 'mortgage' | 'tax' | 'mechanic' | 'judgment';
  amount: number;
  holder: string;
  recordedDate: Date;
  status: 'active' | 'satisfied' | 'partial';
}

export interface PermitRecord {
  id: string;
  type: string;
  description: string;
  issuedDate: Date;
  contractor?: string;
  value: number;
  status: 'issued' | 'completed' | 'expired' | 'revoked';
}

export interface ZoningInfo {
  designation: string;
  description: string;
  restrictions: string[];
  variances: VarianceRecord[];
}

export interface VarianceRecord {
  id: string;
  type: string;
  approvedDate: Date;
  description: string;
  conditions: string[];
}

export interface DocumentInfo {
  id: string;
  type: string;
  hash: string;
  size: number;
  uploadDate: Date;
  verified: boolean;
  metadata: Record<string, any>;
}

export class DataIntegrationService {
  private logger: Logger;
  private database: DatabaseService;
  private externalAPI: ExternalAPIService;
  private dataSources: Map<string, DataSource> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.logger = new Logger('DataIntegrationService');
    this.database = new DatabaseService();
    this.externalAPI = new ExternalAPIService();
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing Data Integration Service...');
    
    await this.database.initialize();
    await this.externalAPI.initialize();
    
    // Initialize data sources
    await this.initializeDataSources();
    
    // Start sync processes
    this.startSyncProcesses();
    
    this.logger.info('Data Integration Service initialized');
  }

  private async initializeDataSources(): Promise<void> {
    const sources: DataSource[] = [
      {
        id: 'county_recorder',
        name: 'County Recorder Offices',
        type: 'api',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'mls_data',
        name: 'Multiple Listing Services',
        type: 'api',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'mortgage_databases',
        name: 'Mortgage Databases',
        type: 'database',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'court_records',
        name: 'Court Records',
        type: 'api',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'professional_licensing',
        name: 'Professional Licensing Boards',
        type: 'api',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'regulatory_enforcement',
        name: 'Regulatory Enforcement Databases',
        type: 'database',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'financial_institutions',
        name: 'Financial Institution Reports',
        type: 'stream',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'social_media',
        name: 'Social Media APIs',
        type: 'api',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      },
      {
        id: 'news_feeds',
        name: 'News and Media Feeds',
        type: 'stream',
        status: 'active',
        lastSync: new Date(),
        recordCount: 0,
        errorCount: 0
      }
    ];

    sources.forEach(source => {
      this.dataSources.set(source.id, source);
    });
  }

  private startSyncProcesses(): void {
    // County Recorder sync - every 15 minutes
    this.syncIntervals.set('county_recorder', setInterval(
      () => this.syncCountyRecords(),
      15 * 60 * 1000
    ));

    // MLS sync - every 5 minutes
    this.syncIntervals.set('mls_data', setInterval(
      () => this.syncMLSData(),
      5 * 60 * 1000
    ));

    // Mortgage database sync - every 30 minutes
    this.syncIntervals.set('mortgage_databases', setInterval(
      () => this.syncMortgageData(),
      30 * 60 * 1000
    ));

    // Court records sync - every hour
    this.syncIntervals.set('court_records', setInterval(
      () => this.syncCourtRecords(),
      60 * 60 * 1000
    ));

    // Professional licensing sync - every 4 hours
    this.syncIntervals.set('professional_licensing', setInterval(
      () => this.syncProfessionalLicensing(),
      4 * 60 * 60 * 1000
    ));

    // Real-time streams (handled separately)
    this.startRealTimeStreams();
  }

  private async syncCountyRecords(): Promise<void> {
    try {
      this.logger.info('Syncing county recorder data...');
      const source = this.dataSources.get('county_recorder')!;
      
      // Get recent property transfers, deed recordings, etc.
      const records = await this.externalAPI.getCountyRecords({
        since: source.lastSync,
        limit: 1000
      });

      let processedCount = 0;
      for (const record of records) {
        try {
          await this.processPropertyRecord(record);
          processedCount++;
        } catch (error) {
          this.logger.error('Error processing county record', error);
          source.errorCount++;
        }
      }

      source.lastSync = new Date();
      source.recordCount += processedCount;
      this.logger.info(`Synced ${processedCount} county records`);
      
    } catch (error) {
      this.logger.error('County records sync failed', error);
      const source = this.dataSources.get('county_recorder')!;
      source.status = 'error';
      source.errorCount++;
    }
  }

  private async syncMLSData(): Promise<void> {
    try {
      this.logger.info('Syncing MLS data...');
      const source = this.dataSources.get('mls_data')!;
      
      const listings = await this.externalAPI.getMLSListings({
        since: source.lastSync,
        limit: 500
      });

      let processedCount = 0;
      for (const listing of listings) {
        try {
          await this.processMLSListing(listing);
          processedCount++;
        } catch (error) {
          this.logger.error('Error processing MLS listing', error);
          source.errorCount++;
        }
      }

      source.lastSync = new Date();
      source.recordCount += processedCount;
      this.logger.info(`Synced ${processedCount} MLS listings`);
      
    } catch (error) {
      this.logger.error('MLS sync failed', error);
      const source = this.dataSources.get('mls_data')!;
      source.status = 'error';
      source.errorCount++;
    }
  }

  private async syncMortgageData(): Promise<void> {
    try {
      this.logger.info('Syncing mortgage data...');
      const source = this.dataSources.get('mortgage_databases')!;
      
      const mortgages = await this.externalAPI.getMortgageRecords({
        since: source.lastSync,
        limit: 1000
      });

      let processedCount = 0;
      for (const mortgage of mortgages) {
        try {
          await this.processMortgageRecord(mortgage);
          processedCount++;
        } catch (error) {
          this.logger.error('Error processing mortgage record', error);
          source.errorCount++;
        }
      }

      source.lastSync = new Date();
      source.recordCount += processedCount;
      this.logger.info(`Synced ${processedCount} mortgage records`);
      
    } catch (error) {
      this.logger.error('Mortgage sync failed', error);
      const source = this.dataSources.get('mortgage_databases')!;
      source.status = 'error';
      source.errorCount++;
    }
  }

  private async syncCourtRecords(): Promise<void> {
    try {
      this.logger.info('Syncing court records...');
      const source = this.dataSources.get('court_records')!;
      
      const records = await this.externalAPI.getCourtRecords({
        since: source.lastSync,
        types: ['foreclosure', 'bankruptcy', 'fraud', 'civil'],
        limit: 500
      });

      let processedCount = 0;
      for (const record of records) {
        try {
          await this.processCourtRecord(record);
          processedCount++;
        } catch (error) {
          this.logger.error('Error processing court record', error);
          source.errorCount++;
        }
      }

      source.lastSync = new Date();
      source.recordCount += processedCount;
      this.logger.info(`Synced ${processedCount} court records`);
      
    } catch (error) {
      this.logger.error('Court records sync failed', error);
      const source = this.dataSources.get('court_records')!;
      source.status = 'error';
      source.errorCount++;
    }
  }

  private async syncProfessionalLicensing(): Promise<void> {
    try {
      this.logger.info('Syncing professional licensing data...');
      const source = this.dataSources.get('professional_licensing')!;
      
      const licenses = await this.externalAPI.getProfessionalLicenses({
        since: source.lastSync,
        types: ['real_estate_agent', 'broker', 'appraiser', 'attorney', 'contractor'],
        limit: 1000
      });

      let processedCount = 0;
      for (const license of licenses) {
        try {
          await this.processProfessionalLicense(license);
          processedCount++;
        } catch (error) {
          this.logger.error('Error processing professional license', error);
          source.errorCount++;
        }
      }

      source.lastSync = new Date();
      source.recordCount += processedCount;
      this.logger.info(`Synced ${processedCount} professional licenses`);
      
    } catch (error) {
      this.logger.error('Professional licensing sync failed', error);
      const source = this.dataSources.get('professional_licensing')!;
      source.status = 'error';
      source.errorCount++;
    }
  }

  private startRealTimeStreams(): void {
    // Financial institution transaction reports
    this.externalAPI.subscribeToFinancialReports((report) => {
      this.processFinancialReport(report).catch(error => {
        this.logger.error('Error processing financial report', error);
      });
    });

    // News and media monitoring
    this.externalAPI.subscribeToNewsFeeds((article) => {
      this.processNewsArticle(article).catch(error => {
        this.logger.error('Error processing news article', error);
      });
    });

    // Social media monitoring
    this.externalAPI.subscribeToSocialMedia((post) => {
      this.processSocialMediaPost(post).catch(error => {
        this.logger.error('Error processing social media post', error);
      });
    });
  }

  private async processPropertyRecord(record: any): Promise<void> {
    // Validate and normalize property record
    const propertyRecord: PropertyRecord = {
      id: record.id,
      address: {
        street: record.address.street,
        city: record.address.city,
        state: record.address.state,
        county: record.address.county,
        zipCode: record.address.zipCode,
        coordinates: record.coordinates
      },
      ownership: {
        current: {
          ownerId: record.owner.id,
          name: record.owner.name,
          type: record.owner.type,
          acquisitionDate: new Date(record.acquisitionDate),
          acquisitionPrice: record.acquisitionPrice,
          ownershipPercentage: record.ownershipPercentage || 100,
          verified: false
        },
        history: record.ownershipHistory || []
      },
      valuation: {
        assessed: record.assessedValue,
        market: record.marketValue,
        history: record.valuationHistory || []
      },
      transactions: record.transactions || [],
      liens: record.liens || [],
      permits: record.permits || [],
      zoning: record.zoning || { designation: 'unknown', description: '', restrictions: [], variances: [] },
      lastUpdated: new Date()
    };

    // Store in database
    await this.database.upsertPropertyRecord(propertyRecord);

    // Cross-validate with other sources
    await this.crossValidateProperty(propertyRecord);
  }

  private async processMLSListing(listing: any): Promise<void> {
    // Process MLS listing data
    await this.database.upsertMLSListing({
      id: listing.id,
      propertyId: listing.propertyId,
      listingAgent: listing.agent,
      listingPrice: listing.price,
      listingDate: new Date(listing.listingDate),
      status: listing.status,
      daysOnMarket: listing.daysOnMarket,
      priceHistory: listing.priceHistory || [],
      photos: listing.photos || [],
      description: listing.description,
      features: listing.features || [],
      lastUpdated: new Date()
    });
  }

  private async processMortgageRecord(mortgage: any): Promise<void> {
    // Process mortgage record
    await this.database.upsertMortgageRecord({
      id: mortgage.id,
      propertyId: mortgage.propertyId,
      borrower: mortgage.borrower,
      lender: mortgage.lender,
      amount: mortgage.amount,
      interestRate: mortgage.interestRate,
      term: mortgage.term,
      originationDate: new Date(mortgage.originationDate),
      status: mortgage.status,
      paymentHistory: mortgage.paymentHistory || [],
      lastUpdated: new Date()
    });
  }

  private async processCourtRecord(record: any): Promise<void> {
    // Process court record
    await this.database.upsertCourtRecord({
      id: record.id,
      caseNumber: record.caseNumber,
      type: record.type,
      parties: record.parties,
      filingDate: new Date(record.filingDate),
      status: record.status,
      disposition: record.disposition,
      propertyIds: record.propertyIds || [],
      documents: record.documents || [],
      lastUpdated: new Date()
    });
  }

  private async processProfessionalLicense(license: any): Promise<void> {
    // Process professional license
    await this.database.upsertProfessionalLicense({
      id: license.id,
      licenseNumber: license.number,
      type: license.type,
      holderName: license.holderName,
      jurisdiction: license.jurisdiction,
      status: license.status,
      issueDate: new Date(license.issueDate),
      expirationDate: new Date(license.expirationDate),
      disciplinaryActions: license.disciplinaryActions || [],
      lastUpdated: new Date()
    });
  }

  private async processFinancialReport(report: any): Promise<void> {
    // Process real-time financial report
    await this.database.insertFinancialReport({
      id: report.id,
      type: report.type,
      amount: report.amount,
      parties: report.parties,
      timestamp: new Date(report.timestamp),
      flags: report.flags || [],
      metadata: report.metadata || {}
    });
  }

  private async processNewsArticle(article: any): Promise<void> {
    // Process news article for fraud-related content
    if (this.isRelevantToFraud(article)) {
      await this.database.insertNewsArticle({
        id: article.id,
        title: article.title,
        content: article.content,
        source: article.source,
        publishDate: new Date(article.publishDate),
        relevanceScore: article.relevanceScore,
        entities: article.entities || [],
        sentiment: article.sentiment
      });
    }
  }

  private async processSocialMediaPost(post: any): Promise<void> {
    // Process social media post for fraud indicators
    if (this.isRelevantToFraud(post)) {
      await this.database.insertSocialMediaPost({
        id: post.id,
        platform: post.platform,
        content: post.content,
        author: post.author,
        timestamp: new Date(post.timestamp),
        relevanceScore: post.relevanceScore,
        entities: post.entities || [],
        sentiment: post.sentiment
      });
    }
  }

  private async crossValidateProperty(property: PropertyRecord): Promise<void> {
    // Cross-validate property data across multiple sources
    const validationResults = await Promise.allSettled([
      this.validateOwnership(property),
      this.validateValuation(property),
      this.validateTransactionHistory(property),
      this.validateLegalStatus(property)
    ]);

    // Process validation results and flag discrepancies
    validationResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.warn(`Property validation failed for ${property.id}`, result.reason);
      }
    });
  }

  private async validateOwnership(property: PropertyRecord): Promise<boolean> {
    // Validate ownership information across multiple sources
    return true; // Placeholder
  }

  private async validateValuation(property: PropertyRecord): Promise<boolean> {
    // Validate property valuation against market data
    return true; // Placeholder
  }

  private async validateTransactionHistory(property: PropertyRecord): Promise<boolean> {
    // Validate transaction history for consistency
    return true; // Placeholder
  }

  private async validateLegalStatus(property: PropertyRecord): Promise<boolean> {
    // Validate legal status (liens, encumbrances, etc.)
    return true; // Placeholder
  }

  private isRelevantToFraud(content: any): boolean {
    const fraudKeywords = [
      'real estate fraud', 'property scam', 'mortgage fraud',
      'title fraud', 'foreclosure fraud', 'rental scam',
      'investment fraud', 'ponzi scheme', 'money laundering'
    ];

    const text = (content.title + ' ' + content.content).toLowerCase();
    return fraudKeywords.some(keyword => text.includes(keyword));
  }

  async getPropertyData(propertyId: string): Promise<PropertyRecord | null> {
    return await this.database.getPropertyRecord(propertyId);
  }

  async searchProperties(criteria: any): Promise<PropertyRecord[]> {
    return await this.database.searchProperties(criteria);
  }

  async getDataSourceStatus(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async getStatus(): Promise<any> {
    return {
      dataSources: this.getDataSourceStatus(),
      totalRecords: await this.database.getTotalRecordCount(),
      lastSync: new Date(),
      syncIntervals: this.syncIntervals.size
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Data Integration Service...');
    
    // Clear all sync intervals
    this.syncIntervals.forEach(interval => clearInterval(interval));
    this.syncIntervals.clear();
    
    // Shutdown external connections
    await this.externalAPI.shutdown();
    await this.database.shutdown();
    
    this.logger.info('Data Integration Service shutdown complete');
  }
}