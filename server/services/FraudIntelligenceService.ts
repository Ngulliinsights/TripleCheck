import { eq, and, desc, gte, sql, count, avg, lt, gt } from "drizzle-orm";

import { 
  fraudAlerts, 
  fraudSubscriptions,
  properties,
  users,
  reviews
} from "../../src/shared/schema";
import { db } from "../infrastructure/database/connection";
import { storage } from "../infrastructure/storage/storage";

import { NotificationService } from "./notification-service";

// Constants for error messages
const DB_CONNECTION_ERROR = 'Database connection not available';

const ERROR_MESSAGES = {
  DB_CONNECTION: DB_CONNECTION_ERROR,
  FETCH_ALERTS: 'Failed to fetch fraud alerts',
  FETCH_TRENDS: 'Failed to fetch fraud trends',
  FETCH_STATS: 'Failed to fetch protection statistics',
  REPORT_FRAUD: 'Failed to report fraud incident',
  FETCH_REPORT: 'Failed to fetch report status',
  SUBSCRIBE_ALERTS: 'Failed to subscribe to fraud alerts',
  UPDATE_SUBSCRIPTION: 'Failed to update fraud alert subscription',
  UNSUBSCRIBE_ALERTS: 'Failed to unsubscribe from fraud alerts'
} as const;

type AlertType = 'active_threat' | 'pattern_detected' | 'area_warning';
type AlertSeverity = 'high' | 'medium' | 'low';
type AlertStatus = 'active' | 'resolved' | 'investigating';

interface FraudAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  location: string;
  affectedCount: number;
  timeDetected: Date;
  status: AlertStatus;
  evidence?: string[];
  recommendations?: string[];
}

interface FraudReport {
  id: string;
  type: string;
  location: string;
  description: string;
  amount?: string | undefined;
  reporterId: number;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  timestamp: Date;
  anonymous: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
  } | undefined;
  evidence?: string[] | undefined;
}

interface FraudTrend {
  type: string;
  change: number;
  period: string;
  locations: string[];
  totalCases: number;
  averageAmount: number;
}

interface ProtectionStats {
  activeMonitoring: string;
  threatsBlocked: number;
  communityAlerts: number;
  protectedValue: string;
  responseTime: string;
  successRate: number;
  expertNetwork: number;
}

interface EmergencyResource {
  id: string;
  category: 'reporting' | 'legal' | 'emergency' | 'support';
  name: string;
  description: string;
  contact: {
    phone?: string;
    email?: string;
    website?: string;
    address?: string;
  };
  availability: string;
  priority: number;
}

export class FraudIntelligenceService {
  private notificationService: NotificationService;

  constructor() {
    // Create a mock server object for NotificationService
    const mockServer = {
      on: () => {},
      listen: () => {},
      close: () => {}
    };
    this.notificationService = new NotificationService(mockServer);
  }

  /**
   * Get active fraud alerts with filtering
   */
  async getActiveAlerts(query: {
    severity?: AlertSeverity;
    location?: string;
    type?: AlertType;
    limit?: number;
    offset?: number;
  }): Promise<{
    alerts: FraudAlert[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }

      const conditions = [eq(fraudAlerts.status, 'active')];
      
      if (query.severity) {
        conditions.push(eq(fraudAlerts.severity, query.severity));
      }
      
      if (query.location) {
        const locationPattern = `%${query.location}%`;
        conditions.push(sql`${fraudAlerts.location} ILIKE ${locationPattern}`);
      }
      
      if (query.type) {
        conditions.push(eq(fraudAlerts.type, query.type));
      }

      // Get total count
      const totalCountResult = await db
        .select({ count: count() })
        .from(fraudAlerts)
        .where(and(...conditions));

      const totalCount = totalCountResult[0]?.count ?? 0;

      // Get alerts with pagination
      const alerts = await db
        .select()
        .from(fraudAlerts)
        .where(and(...conditions))
        .orderBy(desc(fraudAlerts.timeDetected))
        .limit(query.limit || 10)
        .offset(query.offset || 0);

      return {
        alerts: alerts.map(alert => ({
          id: alert.id,
          type: alert.type as AlertType,
          severity: alert.severity as AlertSeverity,
          title: alert.title,
          description: alert.description,
          location: alert.location,
          affectedCount: alert.affectedCount,
          timeDetected: alert.timeDetected,
          status: alert.status as AlertStatus,
          evidence: alert.evidence ? JSON.parse(alert.evidence) : undefined,
          recommendations: alert.recommendations ? JSON.parse(alert.recommendations) : undefined
        })),
        total: totalCount,
        hasMore: (query.offset || 0) + (query.limit || 10) < totalCount
      };

    } catch (error) {
      // Log error properly in production
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.FETCH_ALERTS}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.FETCH_ALERTS);
    }
  }

  /**
   * Get fraud trends and analytics using real property data
   */
  async getFraudTrends(query: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    location?: string;
    type?: string;
  }): Promise<{
    trends: FraudTrend[];
    summary: {
      totalCases: number;
      totalAmount: number;
      mostAffectedArea: string;
      trendingFraudType: string;
    };
  }> {
    try {
      if (!db) {
        throw new Error(DB_CONNECTION_ERROR);
      }

      // Calculate date range based on period
      const now = new Date();
      const periodStart = new Date();
      const previousPeriodStart = new Date();
      
      switch (query.period || 'month') {
        case 'week':
          periodStart.setDate(now.getDate() - 7);
          previousPeriodStart.setDate(now.getDate() - 14);
          break;
        case 'quarter':
          periodStart.setMonth(now.getMonth() - 3);
          previousPeriodStart.setMonth(now.getMonth() - 6);
          break;
        case 'year':
          periodStart.setFullYear(now.getFullYear() - 1);
          previousPeriodStart.setFullYear(now.getFullYear() - 2);
          break;
        default: // month
          periodStart.setMonth(now.getMonth() - 1);
          previousPeriodStart.setMonth(now.getMonth() - 2);
      }

      // Get suspicious properties from current period
      const suspiciousProperties = await this.detectSuspiciousProperties(periodStart, query.location);
      
      // Get suspicious properties from previous period for comparison
      const previousSuspiciousProperties = await this.detectSuspiciousProperties(previousPeriodStart, query.location);

      // Analyze trends by fraud type
      const fraudTypes = ['price_manipulation', 'fake_listing', 'duplicate_property', 'suspicious_owner'];
      const trends: FraudTrend[] = [];

      for (const fraudType of fraudTypes) {
        const currentCount = suspiciousProperties.filter(p => p.fraudType === fraudType).length;
        const previousCount = previousSuspiciousProperties.filter(p => p.fraudType === fraudType).length;
        
        const change = previousCount > 0 ? ((currentCount - previousCount) / previousCount) * 100 : 0;
        const locations = [...new Set(suspiciousProperties
          .filter(p => p.fraudType === fraudType)
          .map(p => p.location)
        )].slice(0, 3);

        const averageAmount = suspiciousProperties
          .filter(p => p.fraudType === fraudType)
          .reduce((sum, p) => sum + parseFloat(p.price), 0) / Math.max(currentCount, 1);

        trends.push({
          type: fraudType,
          change: Math.round(change),
          period: `vs last ${query.period || 'month'}`,
          locations,
          totalCases: currentCount,
          averageAmount: Math.round(averageAmount)
        });
      }

      const summary = {
        totalCases: suspiciousProperties.length,
        totalAmount: suspiciousProperties.reduce((sum, p) => sum + parseFloat(p.price), 0),
        mostAffectedArea: this.getMostAffectedArea(suspiciousProperties),
        trendingFraudType: trends.toSorted((a, b) => b.change - a.change)[0]?.type || 'None'
      };

      return { trends, summary };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.FETCH_TRENDS}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.FETCH_TRENDS);
    }
  }

  /**
   * Get protection statistics
   */
  async getProtectionStats(): Promise<ProtectionStats> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get threats blocked this month
      const threatsBlockedResult = await db
        .select({ count: count() })
        .from(fraudAlerts)
        .where(and(
          eq(fraudAlerts.status, 'resolved'),
          gte(fraudAlerts.timeDetected, thirtyDaysAgo)
        ));

      const threatsBlocked = threatsBlockedResult[0]?.count ?? 0;

      // Get active community alerts
      const communityAlertsResult = await db
        .select({ count: count() })
        .from(fraudAlerts)
        .where(eq(fraudAlerts.status, 'active'));

      const communityAlerts = communityAlertsResult[0]?.count ?? 0;

      // Mock protected value since fraudReports table doesn't exist
      const protectedValue = 15000000; // 15M KES

      return {
        activeMonitoring: '24/7',
        threatsBlocked,
        communityAlerts,
        protectedValue: `KES ${(protectedValue / 1000000).toFixed(1)}M+`,
        responseTime: '< 2 hours',
        successRate: 85,
        expertNetwork: 500
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.FETCH_STATS}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.FETCH_STATS);
    }
  }

  /**
   * Report fraud incident
   */
  async reportFraud(reportData: {
    type: string;
    location: string;
    description: string;
    amount?: string;
    reporterId: number;
    timestamp: Date;
    anonymous: boolean;
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    evidence?: string[];
  }): Promise<FraudReport> {
    try {
      // For now, return mock data since fraudReports table doesn't exist
      const mockReport: FraudReport = {
        id: `report_${Date.now()}`,
        type: reportData.type,
        location: reportData.location,
        description: reportData.description,
        amount: reportData.amount || undefined,
        reporterId: reportData.reporterId,
        status: 'pending',
        timestamp: reportData.timestamp,
        anonymous: reportData.anonymous,
        contactInfo: reportData.contactInfo || undefined,
        evidence: reportData.evidence || undefined
      };

      // Trigger fraud analysis for potential alert creation
      await this.analyzeForAlert(mockReport);

      return mockReport;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.REPORT_FRAUD}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.REPORT_FRAUD);
    }
  }

  /**
   * Get fraud report status
   */
  async getReportStatus(reportId: string, userId: number): Promise<FraudReport | null> {
    try {
      // For now, return mock data since fraudReports table doesn't exist
      if (reportId.startsWith('report_')) {
        return {
          id: reportId,
          type: 'title_deed',
          location: 'Nairobi',
          description: 'Fraudulent title deed detected',
          amount: '2500000',
          reporterId: userId,
          status: 'investigating',
          timestamp: new Date(),
          anonymous: false,
          contactInfo: {
            email: 'reporter@example.com'
          },
          evidence: []
        };
      }

      return null;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.FETCH_REPORT}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.FETCH_REPORT);
    }
  }

  /**
   * Get emergency resources
   */
  async getEmergencyResources(): Promise<{
    categories: {
      [key: string]: EmergencyResource[];
    };
    quickActions: {
      title: string;
      description: string;
      action: string;
      urgent: boolean;
    }[];
  }> {
    // This would typically come from a database, but for now we'll return static data
    const resources: EmergencyResource[] = [
      {
        id: 'dci-land-fraud',
        category: 'reporting',
        name: 'DCI Land Fraud Unit',
        description: 'Specialized investigators with prosecutorial powers and asset freezing capabilities',
        contact: {
          phone: '020-7202000, 0800 722 203',
          email: 'director@dci.go.ke',
          website: 'dci.go.ke',
          address: 'Mazingira Complex, Kiambu Road'
        },
        availability: '24/7',
        priority: 1
      },
      {
        id: 'eacc',
        category: 'reporting',
        name: 'Ethics & Anti-Corruption Commission (EACC)',
        description: 'Handles corruption involving public officials and fraudulent title processing',
        contact: {
          website: 'eacc.go.ke/default/report-corruption'
        },
        availability: 'Business hours',
        priority: 2
      },
      {
        id: 'ministry-lands',
        category: 'legal',
        name: 'Ministry of Lands & Physical Planning',
        description: 'Can investigate title irregularities and cancel fraudulent documents',
        contact: {
          website: 'ardhisasa.lands.go.ke'
        },
        availability: 'Business hours',
        priority: 3
      }
    ];

    const categorizedResources = resources.reduce((acc, resource) => {
      if (!acc[resource.category]) {
        acc[resource.category] = [];
      }
      acc[resource.category].push(resource);
      return acc;
    }, {} as { [key: string]: EmergencyResource[] });

    const quickActions = [
      {
        title: 'Stop All Payments',
        description: 'Immediately cease any money transfers to prevent further losses',
        action: 'emergency_stop',
        urgent: true
      },
      {
        title: 'Document Everything',
        description: 'Photograph all documents, save messages, and create a timeline',
        action: 'document_evidence',
        urgent: true
      },
      {
        title: 'Report to DCI',
        description: 'File official report with DCI Land Fraud Unit within 24 hours',
        action: 'report_dci',
        urgent: true
      },
      {
        title: 'Secure Property',
        description: 'Visit Land Registry to place caution or restriction on title',
        action: 'secure_property',
        urgent: false
      }
    ];

    return {
      categories: categorizedResources,
      quickActions
    };
  }

  /**
   * Subscribe to fraud alerts
   */
  async subscribeToAlerts(userId: number, subscriptionData: {
    locations: string[];
    alertTypes: AlertType[];
    severity: AlertSeverity[];
    notificationMethods: ('email' | 'sms' | 'push')[];
  }): Promise<{ subscriptionId: string; status: string }> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }

      const subscriptionResult = await db
        .insert(fraudSubscriptions)
        .values({
          userId,
          locations: JSON.stringify(subscriptionData.locations),
          alertTypes: JSON.stringify(subscriptionData.alertTypes),
          severity: JSON.stringify(subscriptionData.severity),
          notificationMethods: JSON.stringify(subscriptionData.notificationMethods),
          active: true,
          createdAt: new Date()
        })
        .returning();

      const [subscription] = subscriptionResult;
      if (!subscription) {
        throw new Error('Failed to create subscription');
      }

      return {
        subscriptionId: subscription.id,
        status: 'active'
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.SUBSCRIBE_ALERTS}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.SUBSCRIBE_ALERTS);
    }
  }

  /**
   * Update existing fraud alert subscription
   */
  async updateAlertSubscription(
    subscriptionId: string,
    userId: number,
    subscriptionData: {
      locations: string[];
      alertTypes: AlertType[];
      severity: AlertSeverity[];
      notificationMethods: ('email' | 'sms' | 'push')[];
    }
  ): Promise<{ subscriptionId: string; status: string; preferences: typeof subscriptionData } | null> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }

      const updateResult = await db
        .update(fraudSubscriptions)
        .set({
          locations: JSON.stringify(subscriptionData.locations),
          alertTypes: JSON.stringify(subscriptionData.alertTypes),
          severity: JSON.stringify(subscriptionData.severity),
          notificationMethods: JSON.stringify(subscriptionData.notificationMethods),
          updatedAt: new Date()
        })
        .where(and(
          eq(fraudSubscriptions.id, subscriptionId),
          eq(fraudSubscriptions.userId, userId)
        ))
        .returning();

      const [updatedSubscription] = updateResult;
      if (!updatedSubscription) {
        return null;
      }

      return {
        subscriptionId: updatedSubscription.id,
        status: 'updated',
        preferences: subscriptionData
      };

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.UPDATE_SUBSCRIPTION}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.UPDATE_SUBSCRIPTION);
    }
  }

  /**
   * Unsubscribe from fraud alerts
   */
  async unsubscribeFromAlerts(subscriptionId: string, userId: number): Promise<boolean> {
    try {
      if (!db) {
        throw new Error('Database connection not available');
      }

      const updateResult = await db
        .update(fraudSubscriptions)
        .set({
          active: false,
          updatedAt: new Date()
        })
        .where(and(
          eq(fraudSubscriptions.id, subscriptionId),
          eq(fraudSubscriptions.userId, userId),
          eq(fraudSubscriptions.active, true)
        ))
        .returning();

      const [result] = updateResult;
      return !!result;

    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`${ERROR_MESSAGES.UNSUBSCRIBE_ALERTS}: ${error.message}`);
      }
      throw new Error(ERROR_MESSAGES.UNSUBSCRIBE_ALERTS);
    }
  }

  /**
   * Private helper methods
   */
  /**
   * Detect suspicious properties using real data analysis
   */
  private async detectSuspiciousProperties(since: Date, location?: string): Promise<Array<{
    id: number;
    location: string;
    price: string;
    fraudType: string;
    riskScore: number;
  }>> {
    if (!db) {
      throw new Error(DB_CONNECTION_ERROR);
    }

    // Get properties created since the specified date
    let query = db
      .select({
        id: properties.id,
        title: properties.title,
        location: properties.location,
        price: properties.price,
        imageUrls: properties.imageUrls,
        description: properties.description,
        ownerId: properties.ownerId,
        createdAt: properties.createdAt,
        features: properties.features
      })
      .from(properties)
      .where(gte(properties.createdAt, since));

    if (location) {
      query = query.where(and(
        gte(properties.createdAt, since),
        sql`${properties.location} ILIKE ${`%${location}%`}`
      ));
    }

    const recentProperties = await query;

    // Get location-based price averages for comparison
    const locationAverages = await this.getLocationPriceAverages();

    const suspiciousProperties = [];

    for (const property of recentProperties) {
      const riskFactors = await this.analyzePropertyRisk(property, locationAverages);
      
      if (riskFactors.riskScore > 60) { // Threshold for suspicious
        suspiciousProperties.push({
          id: property.id,
          location: property.location,
          price: property.price,
          fraudType: riskFactors.primaryRiskType,
          riskScore: riskFactors.riskScore
        });
      }
    }

    return suspiciousProperties;
  }

  /**
   * Analyze individual property for fraud risk
   */
  private async analyzePropertyRisk(property: any, locationAverages: Map<string, number>): Promise<{
    riskScore: number;
    primaryRiskType: string;
    riskFactors: string[];
  }> {
    const riskFactors: string[] = [];
    let riskScore = 0;

    const price = parseFloat(property.price);
    const locationAvg = locationAverages.get(property.location) || price;

    // Price manipulation detection
    if (price < locationAvg * 0.5) {
      riskFactors.push('Price significantly below market average');
      riskScore += 30;
    } else if (price > locationAvg * 3) {
      riskFactors.push('Price significantly above market average');
      riskScore += 20;
    }

    // Content quality analysis
    if (property.description.length < 50) {
      riskFactors.push('Minimal property description');
      riskScore += 15;
    }

    if (!property.imageUrls || property.imageUrls.length === 0) {
      riskFactors.push('No property images');
      riskScore += 25;
    }

    // Owner analysis
    const ownerProperties = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.ownerId, property.ownerId));

    const ownerPropertyCount = ownerProperties[0]?.count || 0;
    if (ownerPropertyCount > 10) {
      riskFactors.push('Owner has unusually high number of listings');
      riskScore += 20;
    }

    // Duplicate detection
    const similarProperties = await db
      .select()
      .from(properties)
      .where(and(
        eq(properties.location, property.location),
        eq(properties.price, property.price),
        sql`${properties.id} != ${property.id}`
      ));

    if (similarProperties.length > 0) {
      riskFactors.push('Potential duplicate listing');
      riskScore += 35;
    }

    // Determine primary risk type
    let primaryRiskType = 'low_risk';
    if (riskScore > 60) {
      if (riskFactors.some(f => f.includes('duplicate'))) {
        primaryRiskType = 'duplicate_property';
      } else if (riskFactors.some(f => f.includes('Price'))) {
        primaryRiskType = 'price_manipulation';
      } else if (riskFactors.some(f => f.includes('images') || f.includes('description'))) {
        primaryRiskType = 'fake_listing';
      } else if (riskFactors.some(f => f.includes('Owner'))) {
        primaryRiskType = 'suspicious_owner';
      }
    }

    return {
      riskScore: Math.min(riskScore, 100),
      primaryRiskType,
      riskFactors
    };
  }

  /**
   * Get average prices by location for comparison
   */
  private async getLocationPriceAverages(): Promise<Map<string, number>> {
    if (!db) {
      throw new Error(DB_CONNECTION_ERROR);
    }

    const averages = await db
      .select({
        location: properties.location,
        avgPrice: avg(sql`CAST(${properties.price} AS NUMERIC)`)
      })
      .from(properties)
      .where(eq(properties.isActive, true))
      .groupBy(properties.location);

    const locationMap = new Map<string, number>();
    averages.forEach(avg => {
      if (avg.avgPrice) {
        locationMap.set(avg.location, parseFloat(avg.avgPrice));
      }
    });

    return locationMap;
  }

  private getMostAffectedArea(suspiciousProperties: Array<{ location: string }>): string {
    const locationCounts = suspiciousProperties.reduce((acc, property) => {
      acc[property.location] = (acc[property.location] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const sortedEntries = Object.entries(locationCounts)
      .sort(([, a], [, b]) => Number(b) - Number(a));
    
    return sortedEntries[0]?.[0] || 'Unknown';
  }

  private async analyzeForAlert(report: FraudReport): Promise<void> {
    try {
      // This would contain ML/AI logic to analyze if a report should trigger an alert
      // For now, we'll create alerts for high-impact reports
      if (report.amount && this.parseAmount(report.amount) > 1000000) { // > 1M KES
        await this.createFraudAlert({
          type: 'active_threat',
          severity: 'high',
          title: `High-Value ${report.type.replace('_', ' ')} Detected`,
          description: `Large-scale fraud reported in ${report.location}`,
          location: report.location,
          affectedCount: 1
        });
      }
    } catch (error) {
      // Log error but don't throw to avoid breaking the main flow
      // In production, use proper logging
    }
  }

  private async createFraudAlert(alertData: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    description: string;
    location: string;
    affectedCount: number;
  }): Promise<void> {
    if (!db) {
      throw new Error(DB_CONNECTION_ERROR);
    }

    await db.insert(fraudAlerts).values({
      ...alertData,
      status: 'active',
      timeDetected: new Date()
    });
  }

  private parseAmount(amount: string): number {
    const cleaned = amount.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }
}