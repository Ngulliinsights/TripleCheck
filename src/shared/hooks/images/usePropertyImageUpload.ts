/**
 * Custom React hook for Property Image Upload Management
 * Context-sensitive version aligned with property verification domain
 * Integrates with existing project patterns and API structure
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { generateUniqueId } from '../../utils/images/formatters';
import { PropertyImageUploadCoordinator } from '../../services/images/PropertyImageUploadCoordinator';
import { PropertyImageWorkflowManager } from '../../services/images/PropertyImageWorkflowManager';

const UNKNOWN_ERROR = 'Unknown error';

import type {
  UploadSession,
  UploadProgress,
  PropertyImage,
  DocumentType,
} from '../../types/images';
import { ImageProcessingError } from '../../types/images';

export interface UsePropertyImageUploadOptions {
  onUploadComplete?: (imageId: string, documentType?: DocumentType) => void;
  onUploadError?: (error: ImageProcessingError) => void;
  onProgressUpdate?: (sessionId: string, progress: UploadProgress) => void;
  onWorkflowUpdate?: (imageId: string, status: any) => void;
  maxConcurrentUploads?: number;
  landVerificationId?: string; // For linking to land verification process
  defaultDocumentType?: DocumentType;
  enableAuditLogging?: boolean;
}

export interface UsePropertyImageUploadReturn {
  images: PropertyImage[];
  uploadFile: (file: File, documentType?: DocumentType) => Promise<string>;
  uploadFiles: (files: File[], documentType?: DocumentType) => Promise<string[]>;
  pauseUpload: (sessionId: string) => void;
  resumeUpload: (sessionId: string) => void;
  cancelUpload: (sessionId: string) => void;
  retryUpload: (imageId: string) => Promise<void>;
  getUploadProgress: (sessionId: string) => UploadProgress | null;
  isUploading: boolean;
  uploadStats: {
    totalFiles: number;
    completedFiles: number;
    failedFiles: number;
    activeUploads: number;
    processingFiles: number;
  };
  workflowStats: {
    totalWorkflows: number;
    completedWorkflows: number;
    failedWorkflows: number;
    activeWorkflows: number;
  };
}

export function usePropertyImageUpload(
  uploadCoordinator: PropertyImageUploadCoordinator,
  workflowManager: PropertyImageWorkflowManager,
  options: UsePropertyImageUploadOptions = {}
): UsePropertyImageUploadReturn {
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const activeSessionsRef = useRef<Map<string, UploadSession>>(new Map());
  const imageSessionMapRef = useRef<Map<string, string>>(new Map()); // imageId -> sessionId
  const workflowStatusRef = useRef<Map<string, any>>(new Map()); // imageId -> workflow status

  const {
    onUploadComplete,
    onUploadError,
    onProgressUpdate,
    onWorkflowUpdate,
    maxConcurrentUploads = 3,
    landVerificationId,
    defaultDocumentType = 'property_photo',
    enableAuditLogging = true,
  } = options;

  // Update image status in the state
  const updateImageStatus = useCallback((imageId: string, updates: Partial<PropertyImage>) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, ...updates } : img
    ));
  }, []);

  // Add new image to state
  const addImage = useCallback((image: PropertyImage) => {
    setImages(prev => [...prev, image]);
  }, []);

  // Remove image from state
  const removeImage = useCallback((imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
    imageSessionMapRef.current.delete(imageId);
    workflowStatusRef.current.delete(imageId);
  }, []);

  // Upload a single file
  const uploadFile = useCallback(async (file: File, documentType?: DocumentType): Promise<string> => {
    const imageId = generateUniqueId();
    const docType = documentType || defaultDocumentType;
    
    try {
      // Create initial image object with property-specific fields
      const initialImage: PropertyImage = {
        id: imageId,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
        uploadSpeed: 0,
        chunks: [],
        retryCount: 0,
        tags: [],
        aiTags: [],
        metadata: {
          fileSize: file.size,
          technicalMetadata: {
            format: file.type.split('/')[1] || 'unknown',
            colorSpace: 'sRGB',
            bitDepth: 24,
            compression: 'JPEG',
            orientation: 1,
          },
          createdAt: Date.now(),
          lastModified: file.lastModified,
        },
        approvalStatus: 'pending',
        version: 1,
        storageClass: 'hot',
        complianceFlags: [],
        auditTrail: [],
        assignedTo: [],
        collections: [],
        usageStats: {
          views: 0,
          downloads: 0,
          shares: 0,
        },
        startTime: Date.now(),
        documentType: docType,
        landVerificationId,
      };

      addImage(initialImage);
      setIsUploading(true);

      // Initiate upload session with document type and land verification ID
      const session = await uploadCoordinator.initiateUpload(file, docType, landVerificationId);
      activeSessionsRef.current.set(session.id, session);
      imageSessionMapRef.current.set(imageId, session.id);

      // Set up progress tracking
      uploadCoordinator.onProgressUpdate(session.id, (progress) => {
        updateImageStatus(imageId, {
          progress: progress.progress,
          uploadSpeed: progress.uploadSpeed,
          status: progress.status === 'completed' ? 'uploaded' : 'uploading',
        });
        
        onProgressUpdate?.(session.id, progress);

        // Start workflow processing when upload is complete
        if (progress.status === 'completed') {
          activeSessionsRef.current.delete(session.id);
          
          // Update status to processing
          updateImageStatus(imageId, { status: 'processing' });

          // Start processing workflow with document type and land verification ID
          workflowManager.startProcessingWorkflow(
            imageId, 
            `storage://${imageId}`, 
            docType, 
            landVerificationId
          )
            .then(() => {
              updateImageStatus(imageId, { status: 'uploaded' });
              onUploadComplete?.(imageId, docType);
            })
            .catch((error) => {
              updateImageStatus(imageId, { status: 'error' });
              onUploadError?.(error);
            });

          // Set up workflow status tracking
          workflowManager.onStatusUpdate(imageId, (status) => {
            workflowStatusRef.current.set(imageId, status);
            updateImageStatus(imageId, {
              status: mapWorkflowStatusToImageStatus(status.status),
              progress: status.progress || 0,
            });
            onWorkflowUpdate?.(imageId, status);
          });
        }
      });

      // Start uploading chunks
      const chunkPromises = session.chunks.map(chunk => 
        uploadCoordinator.uploadChunk(session.id, chunk)
      );

      await Promise.all(chunkPromises);
      
      return imageId;

    } catch (error) {
      updateImageStatus(imageId, { status: 'error' });
      const processingError = error instanceof ImageProcessingError 
        ? error 
        : new ImageProcessingError(
            error instanceof Error ? error.message : 'Upload failed',
            'UPLOAD_FAILED',
            imageId
          );
      
      onUploadError?.(processingError);
      throw processingError;
    } finally {
      // Check if any uploads are still active
      const hasActiveUploads = Array.from(activeSessionsRef.current.values())
        .some(session => session.status === 'uploading' || session.status === 'pending');
      
      if (!hasActiveUploads) {
        setIsUploading(false);
      }
    }
  }, [
    uploadCoordinator, 
    workflowManager, 
    addImage, 
    updateImageStatus, 
    onUploadComplete, 
    onUploadError, 
    onProgressUpdate,
    onWorkflowUpdate,
    defaultDocumentType,
    landVerificationId
  ]);

  // Upload multiple files with concurrency control and document type support
  const uploadFiles = useCallback(async (files: File[], documentType?: DocumentType): Promise<string[]> => {
    const imageIds: string[] = [];
    const docType = documentType || defaultDocumentType;
    
    for (let i = 0; i < files.length; i += maxConcurrentUploads) {
      const batch = files.slice(i, i + maxConcurrentUploads);
      const batchPromises = batch.map(file => uploadFile(file, docType));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          imageIds.push(result.value);
        }
      });
    }
    
    return imageIds;
  }, [uploadFile, maxConcurrentUploads, defaultDocumentType]);

  // Pause upload
  const pauseUpload = useCallback((sessionId: string) => {
    uploadCoordinator.pauseUpload(sessionId);
  }, [uploadCoordinator]);

  // Resume upload
  const resumeUpload = useCallback((sessionId: string) => {
    uploadCoordinator.resumeUpload(sessionId);
  }, [uploadCoordinator]);

  // Cancel upload
  const cancelUpload = useCallback((sessionId: string) => {
    const session = activeSessionsRef.current.get(sessionId);
    if (session) {
      // Find and remove the associated image
      const imageId = Array.from(imageSessionMapRef.current.entries())
        .find(([, sId]) => sId === sessionId)?.[0];
      
      if (imageId) {
        // Cancel workflow if active
        workflowManager.cancelWorkflow(imageId);
        removeImage(imageId);
      }
    }
    
    uploadCoordinator.cancelUpload(sessionId);
    activeSessionsRef.current.delete(sessionId);
  }, [uploadCoordinator, workflowManager, removeImage]);

  // Retry failed upload
  const retryUpload = useCallback(async (imageId: string): Promise<void> => {
    const image = images.find(img => img.id === imageId);
    if (!image) {
      throw new ImageProcessingError('Image not found', 'IMAGE_NOT_FOUND', imageId);
    }

    // Reset image status
    updateImageStatus(imageId, {
      status: 'pending',
      progress: 0,
      retryCount: (image.retryCount || 0) + 1,
    });

    // Start upload again
    await uploadFile(image.file, image.documentType);
  }, [images, updateImageStatus, uploadFile]);

  // Get upload progress
  const getUploadProgress = useCallback((sessionId: string): UploadProgress | null => {
    return uploadCoordinator.getUploadProgress(sessionId);
  }, [uploadCoordinator]);

  // Calculate upload statistics
  const uploadStats = {
    totalFiles: images.length,
    completedFiles: images.filter(img => img.status === 'uploaded').length,
    failedFiles: images.filter(img => img.status === 'error').length,
    activeUploads: activeSessionsRef.current.size,
    processingFiles: images.filter(img => img.status === 'processing').length,
  };

  // Calculate workflow statistics
  const workflowStats = {
    totalWorkflows: workflowStatusRef.current.size,
    completedWorkflows: Array.from(workflowStatusRef.current.values())
      .filter(status => status.status === 'completed').length,
    failedWorkflows: Array.from(workflowStatusRef.current.values())
      .filter(status => status.status === 'failed').length,
    activeWorkflows: Array.from(workflowStatusRef.current.values())
      .filter(status => status.status === 'running').length,
  };

  // Helper function to map workflow status to image status
  const mapWorkflowStatusToImageStatus = useCallback((workflowStatus: string): PropertyImage['status'] => {
    switch (workflowStatus) {
      case 'running':
        return 'processing';
      case 'completed':
        return 'uploaded';
      case 'failed':
        return 'error';
      case 'paused':
        return 'paused';
      default:
        return 'processing';
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cancel all active uploads
      activeSessionsRef.current.forEach((session) => {
        uploadCoordinator.cancelUpload(session.id);
      });

      // Cancel all active workflows
      workflowStatusRef.current.forEach((_, imageId) => {
        workflowManager.cancelWorkflow(imageId);
      });
      
      // Revoke object URLs to prevent memory leaks
      images.forEach(image => {
        if (image.preview.startsWith('blob:')) {
          URL.revokeObjectURL(image.preview);
        }
      });
    };
  }, [uploadCoordinator, workflowManager, images]);

  return {
    images,
    uploadFile,
    uploadFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    getUploadProgress,
    isUploading,
    uploadStats,
    workflowStats,
  };
}

