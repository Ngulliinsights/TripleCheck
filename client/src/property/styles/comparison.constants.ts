/**
 * Property Component Styling Constants
 * Centralized Tailwind CSS class mappings for property comparison and display
 */

/**
 * Status-based Tailwind CSS classes for consistent styling
 * Used in PropertyCompare and related components
 */
export const PROPERTY_STATUS_STYLES = {
  verified: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  unverified: 'bg-gray-100 text-gray-800',
} as const;

/**
 * Verification score color mapping
 * Reflects the verification completion percentage
 */
export const VERIFICATION_SCORE_COLORS = {
  excellent: 'text-green-600',    // 90-100%
  good: 'text-blue-600',          // 70-89%
  fair: 'text-yellow-600',        // 50-69%
  poor: 'text-red-600',           // <50%
} as const;

/**
 * Highlight badge styles for property features
 */
export const HIGHLIGHT_BADGE_STYLES = {
  'best-value': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'newest': 'bg-blue-100 text-blue-800 border-blue-300',
  'featured': 'bg-purple-100 text-purple-800 border-purple-300',
  'verified': 'bg-green-100 text-green-800 border-green-300',
} as const;

/**
 * CSS Grid layout configuration for comparison view
 * Dynamically sets --grid-columns custom property based on property count
 */
export const COMPARE_GRID_LAYOUT = {
  label: '200px',      // Fixed width for row labels
  propertyBase: '1fr',  // Base unit for property columns
  minPropertyWidth: '200px', // Minimum width per property column
} as const;

/**
 * Comparison metric colors for visual differentiation
 */
export const COMPARISON_METRIC_COLORS = {
  winner: 'text-emerald-600 font-semibold',
  average: 'text-gray-600',
  lower: 'text-orange-600',
  lowest: 'text-red-600',
} as const;

/**
 * Gets appropriate status style class based on status string
 * Used to handle dynamic status values safely
 */
export function getStatusStyle(status: string): string {
  const validStatuses = ['verified', 'pending', 'unverified'] as const;
  const safeStatus =
    validStatuses.includes(status as (typeof validStatuses)[number]) ?
      (status as keyof typeof PROPERTY_STATUS_STYLES)
      : 'unverified';
  return PROPERTY_STATUS_STYLES[safeStatus];
}

/**
 * Generates grid columns CSS custom property value
 * @param propertyCount - Number of properties in comparison
 * @returns CSS value for --grid-columns
 */
export function generateGridColumnsStyle(propertyCount: number): string {
  if (propertyCount >= 2) {
    return `${COMPARE_GRID_LAYOUT.label} repeat(${propertyCount}, 1fr)`;
  }
  return `${COMPARE_GRID_LAYOUT.label} 1fr`;
}
