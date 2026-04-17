/**
 * Generic Formatting Utilities
 * 
 * Centralized formatting functions used across the application
 * for documents, users, and other non-image-specific contexts.
 */

/**
 * Format file size in bytes to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Status color mapping for documents
 */
export const DOCUMENT_STATUS_COLORS: Record<string, string> = {
  verified: 'bg-green-100 text-green-800 border-green-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  expired: 'bg-orange-100 text-orange-800 border-orange-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
};

/**
 * Status color mapping for users
 */
export const USER_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 border-green-200',
  suspended: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  inactive: 'bg-gray-100 text-gray-800 border-gray-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
};

/**
 * Verification status color mapping
 */
export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
  verified: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * Get status color for documents
 * @param status - Document status
 * @returns Tailwind CSS class string for status color
 */
export function getDocumentStatusColor(status: string): string {
  return DOCUMENT_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get status color for users
 * @param status - User status
 * @returns Tailwind CSS class string for status color
 */
export function getUserStatusColor(status: string): string {
  return USER_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Get status color for verification
 * @param status - Verification status
 * @returns Tailwind CSS class string for status color
 */
export function getVerificationStatusColor(status: string): string {
  return VERIFICATION_STATUS_COLORS[status] || 'bg-gray-100 text-gray-800 border-gray-200';
}

/**
 * Generic status color getter that accepts status type and context
 * @param status - Status value
 * @param context - Type of status (document, user, verification)
 * @returns Tailwind CSS class string for status color
 */
export function getStatusColor(status: string, context: 'document' | 'user' | 'verification' = 'document'): string {
  switch (context) {
    case 'user':
      return getUserStatusColor(status);
    case 'verification':
      return getVerificationStatusColor(status);
    case 'document':
    default:
      return getDocumentStatusColor(status);
  }
}
