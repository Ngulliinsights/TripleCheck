/**
 * Centralized date formatting utilities to eliminate redundancy across the app
 */

export interface DateFormatOptions {
  year?: 'numeric' | '2-digit';
  month?: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow';
  day?: 'numeric' | '2-digit';
  locale?: string;
}

/**
 * Format date string with error handling and fallback
 */
export function formatDate(
  dateString: string | null | undefined, 
  options: DateFormatOptions = {}
): string {
  if (!dateString) return 'Date not available';
  
  const {
    year = 'numeric',
    month = 'long',
    day = 'numeric',
    locale = 'en-US'
  } = options;
  
  try {
    return new Date(dateString).toLocaleDateString(locale, {
      year,
      month,
      day,
    });
  } catch (error) {
    // Invalid date format - fallback to original string
    console.warn('Invalid date format:', dateString, error);
    return dateString;
  }
}

/**
 * Format date for blog posts (short format)
 */
export function formatBlogDate(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format date for Kenya locale
 */
export function formatKenyaDate(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    locale: 'en-KE',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for press releases
 */
export function formatPressDate(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    locale: 'en-KE',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Format date for media features (short format)
 */
export function formatMediaDate(dateString: string | null | undefined): string {
  return formatDate(dateString, {
    locale: 'en-KE',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Check if a date is within the last N days
 */
export function isWithinDays(dateString: string, days: number): boolean {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= days;
  } catch {
    return false;
  }
}

/**
 * Get relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch {
    return 'Unknown';
  }
}