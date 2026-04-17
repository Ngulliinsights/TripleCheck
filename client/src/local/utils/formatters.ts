/**
 * Utility functions for formatting data
 */

// Import date formatting from the dedicated date-utils module
// This consolidates all date formatting in one place
export { formatDate, formatBlogDate, formatKenyaDate, formatPressDate, formatMediaDate } from './date-utils';

/**
 * Format price in Kenyan Shillings
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  }).format(price);
};

/**
 * Format number with commas
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};