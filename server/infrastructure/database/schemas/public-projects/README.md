# Public Projects Monitoring Schema

## Overview

This schema provides infrastructure for tracking public infrastructure projects and detecting information asymmetry risks in property transactions. It specifically addresses the harm of rural landholders selling land at steep discounts to buyers with advance knowledge of approved public projects that will raise the land's value.

## Design Principles

### 1. No Per-Household Tracking
- **Aggregate/geographic reasoning only** - The system tracks areas and projects, not individual households
- **Property-based monitoring** - Alerts are triggered when properties in affected areas are listed, not by tracking individual residents
- **Statistical approach** - Market impact data uses aggregate statistics, never individual transaction data

### 2. Area-Based Monitoring
- **Geographic matching** - Properties are matched to projects using geographic overlap (circle, polygon, buffer zones)
- **Regional focus** - Monitoring is organized by county, sub-county, and ward rather than individual parcels
- **Impact zones** - Projects define affected areas that can encompass multiple properties without individual tracking

### 3. Temporal Project Lifecycle
- **Project status tracking** - From proposed → planning → approved → under_construction → completed
- **Timeline awareness** - System knows when projects were announced, approved, and started
- **Pre-transaction intervention** - Alerts fire before sales complete, not after

### 4. Information Disclosure Tracking
- **"Who knew what when" audit trail** - `disclosure_events` table tracks all information disclosures
- **Source credibility** - Projects are weighted by source reliability (official gazette > unverified rumors)
- **Acknowledgment tracking** - System records when sellers acknowledge receiving information

### 5. Pre-Transaction Intervention
- **Real-time alerts** - `information_asymmetry_alerts` triggers when properties in affected areas are listed
- **Intervention workflow** - pending → notified → acknowledged → proceeding/blocked/escalated
- **Seller notification** - System actively notifies sellers before transactions complete

## Schema Structure

### Core Tables

#### `public_projects`
Tracks announced/approved public infrastructure projects.

**Key Features:**
- Geographic area definition (GeoJSON-like structures)
- Project lifecycle status (proposed → completed)
- Source credibility weighting
- Expected value impact estimates
- Monitoring activation controls

**Critical Fields:**
- `affected_area`: Geographic boundary of project impact
- `information_asymmetry_risk`: Risk level (none/low/medium/high/critical)
- `monitoring_active`: Master switch for project monitoring
- `primary_source_credibility`: Weight for source reliability

#### `property_project_overlaps`
Geographic matching between properties and projects.

**Key Features:**
- Automatic geographic matching (no manual assignment)
- Overlap type classification (direct/adjacent/nearby)
- Distance and affected percentage calculations
- Risk assessment per overlap

**Critical Fields:**
- `overlap_type`: Nature of geographic relationship
- `information_asymmetry_level`: Risk level for this specific property-project pair
- `alert_active`: Whether alerts should fire for this overlap

#### `information_asymmetry_alerts`
Real-time alerts when risk conditions are detected.

**Key Features:**
- Trigger event tracking (property_created, price_changed, offer_received)
- Risk scoring (0-100) with confidence levels
- Intervention workflow management
- Seller notification tracking

**Critical Fields:**
- `intervention_status`: Current state in intervention workflow
- `intervention_required`: Whether human intervention is needed
- `seller_notified`: Whether seller has been alerted

#### `disclosure_events`
Audit trail of information disclosures.

**Key Features:**
- "Who disclosed what to whom" tracking
- Disclosure method and channel recording
- Acknowledgment and impact assessment
- Transaction outcome tracking

**Critical Fields:**
- `disclosed_to`: Target of disclosure (seller/buyer/public)
- `acknowledged`: Whether recipient acknowledged receipt
- `transaction_impact`: Outcome (prevented/modified/proceeded)

#### `project_market_impact`
Aggregate market data for project impact analysis.

**Key Features:**
- Time-period based analysis
- Aggregate statistics only (no individual transactions)
- Project phase correlation
- Data quality assessment

**Critical Fields:**
- `average_price_before/after`: Aggregate price changes
- `transaction_count`: Total transactions in period (aggregate)
- `project_phase`: Project status at time of measurement

## Integration Points

### With Existing Systems

#### Verification System
- Extend `government_designations` table with `planned_infrastructure` type
- Share geographic area definitions
- Reuse risk assessment frameworks

#### Fraud Detection
- Add new fraud category `information_asymmetry` to existing fraud system
- Share alert routing and escalation workflows
- Reuse investigation case management

#### Notification System
- Use existing WebSocket and email infrastructure
- Leverage notification templates and preferences
- Share user contact information

#### Geographic Infrastructure
- Reuse property coordinates from existing properties table
- Share Kenyan regional data (county/sub-county/ward)
- Use existing location-based indexes

## Usage Examples

### Creating a New Public Project

```typescript
import { publicProjects } from '../schemas/public-projects';
import { db } from '../infrastructure/database/connection';

const newProject = await db.insert(publicProjects).values({
  projectId: 'KEN-ROAD-2024-001',
  title: 'Mombasa-Malindi Highway Expansion',
  description: 'Major highway expansion affecting coastal properties',
  projectType: 'road',
  status: 'approved',
  affectedArea: {
    type: 'buffer',
    coordinates: [[/* GeoJSON coordinates */]],
    radius: 500, // 500m buffer
    description: '500m buffer along proposed route'
  },
  county: 'Mombasa',
  subCounty: 'Jomvu',
  announcedDate: new Date('2024-01-15'),
  approvalDate: new Date('2024-03-01'),
  startDate: new Date('2024-06-01'),
  expectedImpact: {
    propertyValueImpact: 25, // 25% expected increase
    timeline: '12-18 months',
    confidence: 0.8,
    factors: ['improved_access', 'commercial_development']
  },
  valueIncreaseEstimate: 25,
  sources: [{
    type: 'official_gazette',
    url: 'https://government.go.ke/gazette/12345',
    credibility: 'official_gazette',
    publishedAt: '2024-01-15',
    verified: true
  }],
  primarySourceCredibility: 'official_gazette',
  informationAsymmetryRisk: 'high',
  monitoringActive: true,
  authority: 'Kenya National Highways Authority',
  budget: 2500000000, // 2.5B KES
}).returning();
```

### Triggering Information Asymmetry Alert

```typescript
import { informationAsymmetryAlerts } from '../schemas/public-projects';

const alert = await db.insert(informationAsymmetryAlerts).values({
  alertId: `ALERT-${Date.now()}`,
  propertyId: 12345,
  projectId: 1,
  overlapId: 678,
  severity: 'high',
  alertType: 'property_listed',
  title: 'Property listed in approved road project area',
  description: 'Property is within 200m of approved Mombasa-Malindi highway expansion. Expected 25% value increase. Seller may be unaware.',
  riskScore: 85,
  confidence: 0.9,
  factors: ['direct_overlap', 'high_value_impact', 'approved_project'],
  triggerEvent: 'property_created',
  triggerData: {
    listingPrice: 5000000,
    estimatedFutureValue: 6250000,
    discountPercentage: 20
  },
  interventionStatus: 'pending',
  interventionRequired: true,
}).returning();
```

### Recording Disclosure Event

```typescript
import { disclosureEvents } from '../schemas/public-projects';

const disclosure = await db.insert(disclosureEvents).values({
  alertId: 123,
  propertyId: 456,
  projectId: 1,
  disclosedBy: null, // System automatic disclosure
  disclosedTo: 'seller',
  disclosedToUserId: 789,
  informationType: 'project_existence',
  informationDetail: 'Your property is within the affected area of the approved Mombasa-Malindi highway expansion project. Expected 25% value increase within 12-18 months.',
  disclosureMethod: 'automatic_alert',
  disclosureChannel: 'email',
  acknowledged: false,
}).returning();
```

## Query Patterns

### Find High-Risk Properties in Active Projects

```typescript
const highRiskProperties = await db
  .select({
    property: properties,
    project: publicProjects,
    overlap: propertyProjectOverlaps,
  })
  .from(propertyProjectOverlaps)
  .innerJoin(properties, eq(propertyProjectOverlaps.propertyId, properties.id))
  .innerJoin(publicProjects, eq(propertyProjectOverlaps.projectId, publicProjects.id))
  .where(
    and(
      eq(propertyProjectOverlaps.informationAsymmetryLevel, 'high'),
      eq(propertyProjectOverlaps.alertActive, true),
      eq(publicProjects.monitoringActive, true),
      inArray(publicProjects.status, ['approved', 'under_construction'])
    )
  );
```

### Get Pending Interventions

```typescript
const pendingInterventions = await db
  .select()
  .from(informationAsymmetryAlerts)
  .where(
    and(
      eq(informationAsymmetryAlerts.interventionStatus, 'pending'),
      eq(informationAsymmetryAlerts.interventionRequired, true),
      eq(informationAsymmetryAlerts.falsePositive, false)
    )
  )
  .orderBy(desc(informationAsymmetryAlerts.createdAt));
```

### Audit Trail for Property

```typescript
const disclosureHistory = await db
  .select({
    disclosure: disclosureEvents,
    project: publicProjects,
  })
  .from(disclosureEvents)
  .innerJoin(publicProjects, eq(disclosureEvents.projectId, publicProjects.id))
  .where(eq(disclosureEvents.propertyId, propertyId))
  .orderBy(desc(disclosureEvents.disclosedAt));
```

## Data Privacy Considerations

### What We DON'T Track
- Individual household ownership records
- Personal financial information
- Individual transaction prices (aggregates only)
- Personal identification beyond system user IDs

### What We DO Track
- Geographic areas and project boundaries
- Property-level (not household) data
- Aggregate market statistics
- System user IDs for operational purposes
- Disclosure acknowledgment timestamps

### Compliance Notes
- All geographic data is aggregate-area based
- No individual household monitoring
- Market impact data uses statistical aggregates
- Disclosure tracking is for audit purposes only

## Migration Strategy

### Phase 1: Schema Deployment
1. Run migration `001_create_public_projects_tables.sql`
2. Verify all tables, indexes, and views are created
3. Test enum types and foreign key constraints

### Phase 2: Data Ingestion
1. Manual entry of high-priority public projects
2. Set up automated feeds from government sources
3. Implement geographic matching for existing properties

### Phase 3: Alert System
1. Implement trigger logic for property listings
2. Set up notification routing
3. Test intervention workflows

### Phase 4: Integration
1. Connect with existing fraud detection
2. Integrate with verification workflows
3. Build reporting dashboards

## Performance Considerations

### Indexing Strategy
- Composite indexes for common query patterns
- Geographic queries use spatial indexes via coordinates
- Temporal indexes for timeline-based queries
- Risk-based indexes for alert prioritization

### Query Optimization
- Views for common administrative queries
- Materialized views for heavy analytics
- Partitioning by county for large-scale deployments
- Connection pooling for high-volume alert processing

## Future Enhancements

### Planned Features
- Machine learning for risk prediction
- Automated government source monitoring
- Mobile app for seller notifications
- Integration with county planning systems
- Predictive market impact modeling

### Extension Points
- Additional project types as needed
- Enhanced geographic matching algorithms
- Multi-language support for disclosures
- Integration with land registry systems
- Blockchain-based disclosure verification

## Troubleshooting

### Common Issues

**Geographic matching not working**
- Verify property coordinates are in correct format
- Check affected_area GeoJSON structure
- Ensure coordinate reference systems match

**Alerts not firing**
- Check monitoring_active flag on projects
- Verify alert_active flag on overlaps
- Review trigger event configuration

**Performance issues**
- Review index usage with EXPLAIN ANALYZE
- Consider partitioning by county for large datasets
- Optimize geographic queries with spatial indexes

## Support

For issues or questions about this schema:
1. Check existing documentation in `/docs/`
2. Review migration files for structure details
3. Consult with database team for performance issues
4. Refer to this README for design rationale