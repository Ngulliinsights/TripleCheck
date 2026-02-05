/**
 * SECURE FILE UPLOAD SERVICE - CRITICAL SECURITY FIX
 * ==================================================
 * 
 * Addresses the critical security vulnerability where all uploads
 * were writing to the same /tmp/uploads directory without isolation.
 * 
 * This implementation provides:
 * - Isolated upload directories per request
 * - Proper file validation and sanitization
 * - Secure temporary file handling
 * - Race condition prevention
 */

import fs from '..\..\..\scripts\cleanup-redundancies';
import path from '..\..\..\scripts\cleanup-redundancies';
import crypto from '..\..\..\scripts\cleanup-redundancies';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';

interface UploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  virusScanEnabled: boolean;
}

interface UploadResult {
  uploadId: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
}

export class SecureFileUploadService {
  private readonly baseUploadDir: string;
  private readonly config: UploadConfig;

  constructor(config: Partial<UploadConfig> = {}) {
    this.baseUploadDir = process.env.SECURE_UPLOAD_DIR || '/tmp/triplecheck-uploads';
    this.config = {
      maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB default
      allowedMimeTypes: config.allowedMimeTypes || [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      allowedExtensions: config.allowedExtensions || [
        '.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'
      ],
      virusScanEnabled: config.virusScanEnabled || false
    };
  }

  /**
   * Create isolated upload directory with secure permissions
   */
  private async createIsolatedUploadDir(): Promise<string> {
    const uploadId = crypto.randomUUID();
    const uploadDir = path.join(this.baseUploadDir, uploadId);
    
    try {
      // Create directory with restrictive permissions (owner read/write only)
      await fs.mkdir(uploadDir, { recursive: true, mode: 0o700 });
      
      // Verify directory was created with correct permissions
      const stats = await fs.stat(uploadDir);
      if ((stats.mode & 0o777) !== 0o700) {
        throw new Error('Failed to set secure directory permissions');
      }
      
      return uploadDir;
    } catch (error) {
      throw new Error(`Failed to create secure upload directory: ${error.message}`);
    }
  }

  /**
   * Validate file against security policies
   */
  private async validateFile(filePath: string, originalName: string): Promise<void> {
    const stats = await fs.stat(filePath);
    
    // Check file size
    if (stats.size > this.config.maxFileSize) {
      throw new Error(`File size ${stats.size} exceeds maximum allowed size ${this.config.maxFileSize}`);
    }

    // Check file extension
    const ext = path.extname(originalName).toLowerCase();
    if (!this.config.allowedExtensions.includes(ext)) {
      throw new Error(`File extension ${ext} is not allowed`);
    }

    // Read file header to verify MIME type
    const buffer = Buffer.alloc(512);
    const fileHandle = await fs.open(filePath, 'r');
    try {
      await fileHandle.read(buffer, 0, 512, 0);
    } finally {
      await fileHandle.close();
    }

    // Basic MIME type validation based on file signature
    const mimeType = this.detectMimeType(buffer);
    if (!this.config.allowedMimeTypes.includes(mimeType)) {
      throw new Error(`MIME type ${mimeType} is not allowed`);
    }
  }

  /**
   * Detect MIME type from file signature (magic bytes)
   */
  private detectMimeType(buffer: Buffer): string {
    // PDF signature
    if (buffer.subarray(0, 4).toString() === '%PDF') {
      return 'application/pdf';
    }
    
    // JPEG signature
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'image/jpeg';
    }
    
    // PNG signature
    if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]))) {
      return 'image/png';
    }
    
    // WebP signature
    if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
      return 'image/webp';
    }
    
    // Default to octet-stream for unknown types
    return 'application/octet-stream';
  }

  /**
   * Calculate file checksum for integrity verification
   */
  private async calculateChecksum(filePath: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    const stream = createReadStream(filePath);
    
    for await (const chunk of stream) {
      hash.update(chunk);
    }
    
    return hash.digest('hex');
  }

  /**
   * Securely upload and process file
   */
  async uploadFile(fileStream: NodeJS.ReadableStream, originalName: string): Promise<UploadResult> {
    const uploadDir = await this.createIsolatedUploadDir();
    const uploadId = path.basename(uploadDir);
    
    // Sanitize filename to prevent directory traversal
    const sanitizedName = path.basename(originalName).replace(/[^a-zA-Z0-9.-]/g, '_');
    const tempFileName = `${crypto.randomUUID()}_${sanitizedName}`;
    const tempFilePath = path.join(uploadDir, tempFileName);
    
    try {
      // Stream file to temporary location
      const writeStream = createWriteStream(tempFilePath, { mode: 0o600 });
      await pipeline(fileStream, writeStream);
      
      // Validate uploaded file
      await this.validateFile(tempFilePath, originalName);
      
      // Calculate checksum for integrity
      const checksum = await this.calculateChecksum(tempFilePath);
      
      // Get file stats
      const stats = await fs.stat(tempFilePath);
      const mimeType = this.detectMimeType(await fs.readFile(tempFilePath, { encoding: null }));
      
      return {
        uploadId,
        filePath: tempFilePath,
        originalName: sanitizedName,
        mimeType,
        size: stats.size,
        checksum
      };
      
    } catch (error) {
      // Clean up on error
      await this.cleanupUpload(uploadId);
      throw error;
    }
  }

  /**
   * Clean up upload directory and all files
   */
  async cleanupUpload(uploadId: string): Promise<void> {
    const uploadDir = path.join(this.baseUploadDir, uploadId);
    
    try {
      await fs.rm(uploadDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup upload directory ${uploadDir}:`, error);
    }
  }

  /**
   * Move file to permanent storage location
   */
  async moveToStorage(uploadResult: UploadResult, destinationPath: string): Promise<void> {
    try {
      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destinationPath), { recursive: true, mode: 0o755 });
      
      // Move file to permanent location
      await fs.rename(uploadResult.filePath, destinationPath);
      
      // Clean up temporary upload directory
      await this.cleanupUpload(uploadResult.uploadId);
      
    } catch (error) {
      throw new Error(`Failed to move file to storage: ${error.message}`);
    }
  }

  /**
   * Initialize secure upload service
   */
  async initialize(): Promise<void> {
    try {
      // Ensure base upload directory exists with secure permissions
      await fs.mkdir(this.baseUploadDir, { recursive: true, mode: 0o700 });
      
      // Clean up any existing temporary uploads older than 1 hour
      await this.cleanupOldUploads();
      
    } catch (error) {
      throw new Error(`Failed to initialize secure upload service: ${error.message}`);
    }
  }

  /**
   * Clean up old temporary uploads
   */
  private async cleanupOldUploads(): Promise<void> {
    try {
      const entries = await fs.readdir(this.baseUploadDir, { withFileTypes: true });
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const dirPath = path.join(this.baseUploadDir, entry.name);
          const stats = await fs.stat(dirPath);
          
          if (stats.mtime.getTime() < oneHourAgo) {
            await fs.rm(dirPath, { recursive: true, force: true });
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old uploads:', error);
    }
  }
}