/**
 * Utility Formatters for Property Image Handling
 * Context-sensitive utilities aligned with project conventions
 * 
 * Integrates with image service configuration and asset management
 */

// Import configuration for consistent formatting
import type { ImageServiceConfig } from '../../types/images';
import { images } from '../../config/images';

// Generate unique IDs using timestamp and random components
export function generateUniqueId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `img_${timestamp}_${randomPart}`;
}

// Format file sizes in human-readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format upload/download speeds
export function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s';

  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));

  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Format estimated time remaining
export function formatETA(seconds: number): string {
  if (!seconds || seconds === Infinity) return 'Unknown';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Get file extension from filename
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1) return '';
  return filename.substring(lastDotIndex + 1);
}

// Format timestamps for display
export function formatTimestamp(timestamp: number, format: 'short' | 'long' | 'relative' = 'short'): string {
  const date = new Date(timestamp);
  const now = new Date();

  switch (format) {
    case 'short':
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    
    case 'long':
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    
    case 'relative':
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSeconds < 60) {
        return 'Just now';
      } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    
    default:
      return date.toLocaleDateString();
  }
}

// Format coordinates for display (Kenya-specific)
export function formatCoordinates(latitude: number, longitude: number): string {
  const latDirection = latitude >= 0 ? 'N' : 'S';
  const lonDirection = longitude >= 0 ? 'E' : 'W';
  
  return `${Math.abs(latitude).toFixed(6)}°${latDirection}, ${Math.abs(longitude).toFixed(6)}°${lonDirection}`;
}

// Format property location (Kenya-specific regions)
export function formatPropertyLocation(latitude: number, longitude: number): string {
  // Simplified region detection for Kenya
  if (latitude >= -1.5 && latitude <= -1.0 && longitude >= 36.5 && longitude <= 37.0) {
    return 'Nairobi County';
  } else if (latitude >= -4.5 && latitude <= -3.5 && longitude >= 39.0 && longitude <= 40.0) {
    return 'Mombasa County';
  } else if (latitude >= -0.5 && latitude <= 0.5 && longitude >= 34.5 && longitude <= 35.5) {
    return 'Kisumu County';
  } else if (latitude >= -1.0 && latitude <= 0.0 && longitude >= 37.0 && longitude <= 38.0) {
    return 'Nyeri County';
  } else {
    return 'Kenya';
  }
}

// Calculate hash for file chunks (simplified)
export async function calculateHash(data: Blob): Promise<string> {
  const arrayBuffer = await data.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Format document type for display
export function formatDocumentType(documentType: string): string {
  const typeMap: Record<string, string> = {
    'title_deed': 'Title Deed',
    'survey_plan': 'Survey Plan',
    'valuation_report': 'Valuation Report',
    'property_photo': 'Property Photo',
    'identification_document': 'ID Document',
    'other_document': 'Other Document',
  };

  return typeMap[documentType] || documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format approval status for display
export function formatApprovalStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Pending Review',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'requires_review': 'Requires Review',
    'compliance_hold': 'Compliance Hold',
  };

  return statusMap[status] || status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format processing step for display
export function formatProcessingStep(step: string): string {
  const stepMap: Record<string, string> = {
    'validation': 'File Validation',
    'virus_scan': 'Virus Scanning',
    'metadata_extraction': 'Metadata Extraction',
    'compliance_check': 'Compliance Check',
    'document_auth': 'Document Authentication',
    'fraud_detection': 'Fraud Detection',
    'image_optimization': 'Image Optimization',
    'thumbnail_generation': 'Thumbnail Generation',
  };

  return stepMap[step] || step.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Format confidence scores as percentages
export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

// Format risk scores with color coding
export function formatRiskScore(score: number): { text: string; level: 'low' | 'medium' | 'high' | 'critical' } {
  const percentage = Math.round(score * 100);
  
  if (score < 0.3) {
    return { text: `${percentage}%`, level: 'low' };
  } else if (score < 0.6) {
    return { text: `${percentage}%`, level: 'medium' };
  } else if (score < 0.8) {
    return { text: `${percentage}%`, level: 'high' };
  } else {
    return { text: `${percentage}%`, level: 'critical' };
  }
}

// Format image dimensions
export function formatDimensions(width: number, height: number): string {
  return `${width} × ${height}`;
}

// Format aspect ratio
export function formatAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const ratioWidth = width / divisor;
  const ratioHeight = height / divisor;
  
  // Common aspect ratios
  if (ratioWidth === 16 && ratioHeight === 9) return '16:9';
  if (ratioWidth === 4 && ratioHeight === 3) return '4:3';
  if (ratioWidth === 3 && ratioHeight === 2) return '3:2';
  if (ratioWidth === 1 && ratioHeight === 1) return '1:1';
  
  return `${ratioWidth}:${ratioHeight}`;
}

// Format storage class for display
export function formatStorageClass(storageClass: string): string {
  const classMap: Record<string, string> = {
    'hot': 'Hot Storage',
    'warm': 'Warm Storage',
    'cold': 'Cold Storage',
    'archive': 'Archive Storage',
  };

  return classMap[storageClass] || storageClass.replace(/\b\w/g, l => l.toUpperCase());
}

// Format audit trail events
export function formatAuditEvent(action: string): string {
  const actionMap: Record<string, string> = {
    'upload_initiated': 'Upload Started',
    'upload_completed': 'Upload Completed',
    'validation_passed': 'Validation Passed',
    'validation_failed': 'Validation Failed',
    'virus_scan_clean': 'Virus Scan Clean',
    'virus_scan_threat': 'Virus Threat Detected',
    'document_authenticated': 'Document Authenticated',
    'document_auth_failed': 'Document Authentication Failed',
    'fraud_check_passed': 'Fraud Check Passed',
    'fraud_risk_detected': 'Fraud Risk Detected',
    'compliance_approved': 'Compliance Approved',
    'compliance_flagged': 'Compliance Flagged',
    'image_approved': 'Image Approved',
    'image_rejected': 'Image Rejected',
    'metadata_updated': 'Metadata Updated',
    'access_granted': 'Access Granted',
    'access_denied': 'Access Denied',
  };

  return actionMap[action] || action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// Format currency (Kenya Shillings)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format phone numbers (Kenya format)
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Kenya phone numbers
  if (cleaned.startsWith('254')) {
    // International format
    return `+${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  } else if (cleaned.startsWith('0')) {
    // Local format
    return `${cleaned.substring(0, 4)} ${cleaned.substring(4)}`;
  }
  
  return phone; // Return original if format not recognized
}

// Sanitize filename for storage
export function sanitizeFilename(filename: string): string {
  // Remove or replace invalid characters
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase();
}

// Generate thumbnail filename
export function generateThumbnailFilename(originalFilename: string, size: number): string {
  const extension = getFileExtension(originalFilename);
  const baseName = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
  return `${sanitizeFilename(baseName)}_thumb_${size}.${extension}`;
}

// Integration with asset management system
export function getAssetPath(assetKey: string, category: 'properties' | 'customers' | 'blog' = 'properties'): string {
  const assetCategory = images[category] as any;
  return assetCategory?.[assetKey]?.jpg || assetCategory?.[assetKey]?.png || assetCategory?.[assetKey]?.webp || '';
}

// Configuration-aware formatting
export function formatWithConfig(value: number, config: ImageServiceConfig, type: 'fileSize' | 'quality'): string {
  switch (type) {
    case 'fileSize':
      const maxSize = config.validation.maxFileSize;
      const percentage = (value / maxSize) * 100;
      return `${formatFileSize(value)} (${percentage.toFixed(1)}% of limit)`;
    case 'quality':
      return `${value}% (${value >= config.processing.optimizationQuality ? 'High' : 'Standard'} Quality)`;
    default:
      return value.toString();
  }
}

