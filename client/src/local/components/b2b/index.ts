/**
 * B2B Feature Components
 * 
 * ⚠️ PENDING: B2B feature awaiting product activation
 * 
 * These components comprise a complete B2B subsystem that is architecturally complete
 * but not currently wired to routes or active pages. To activate this feature:
 * 
 * 1. Set B2B_FEATURE_ENABLED = true in feature flags
 * 2. Wire B2BEntryPointManager to appropriate pages/routes
 * 3. Add B2B routes to router configuration
 * 4. Ensure B2B users have appropriate role-based access (RBAC)
 * 
 * When ready to launch, uncomment exports below and connect to routing.
 * Do NOT delete these components without explicit product cancellation.
 */

export { B2BNotificationBanner } from './B2BNotificationBanner'
export { B2BLeadCapture } from './B2BLeadCapture'
export { B2BContextualPrompt } from './B2BContextualPrompt'
export { B2BFraudReportPrompt } from './B2BFraudReportPrompt'
export { B2BCommunityInsightsPrompt } from './B2BCommunityInsightsPrompt'
export { B2BEntryPointManager } from './B2BEntryPointManager'
export { B2BFraudReportBanner } from './B2BFraudReportBanner'
export { B2BCommunityInsightsBanner } from './B2BCommunityInsightsBanner'