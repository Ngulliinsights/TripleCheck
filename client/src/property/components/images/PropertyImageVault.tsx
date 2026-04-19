/**
 * PropertyImageVault.tsx
 * Optimized main UI component for property image handling, integrating upload, validation, and workflow management.
 * Designed to be context-sensitive for the property verification domain with improved performance and type safety.
 */

import React, { useState, useCallback, useMemo, memo } from "react"

import { usePropertyImageUpload } from "../../hooks/usePropertyImageUpload"
import { getImageServiceOrchestrator } from "../../services/images/ImageServiceOrchestrator"
import type {
  PropertyImage,
  UploadProgress,
  DocumentType,
  WorkflowStatus,
  ImageStatus,
  ApprovalStatus,
} from "../../../local/types/images"
import { ImageProcessingError } from "../../../local/types/images"
import { ImageUtils } from "../../../local/utils/images/unified-utils"

// Define missing types to resolve TypeScript errors

// Enhanced type definitions for better type safety
interface ExtendedPropertyImage extends PropertyImage {
  sessionId?: string;
  eta?: number;
  error?: { message: string };
  regulatoryFlags?: string[];
}

// Secure random number generator for demo purposes - kept as utility for potential future enhancements
const _secureRandom = (): number => {
  // In production, you would use crypto.getRandomValues() for true randomness
  const timestamp = Date.now();
  return (timestamp % 1000) / 1000;
};

// Type guards for better type safety
const hasSessionId = (image: PropertyImage): image is ExtendedPropertyImage => {
  return (
    "sessionId" in image &&
    typeof (image as ExtendedPropertyImage).sessionId === "string"
  );
};

const hasError = (image: PropertyImage): image is ExtendedPropertyImage => {
  return (
    "error" in image &&
    typeof (image as ExtendedPropertyImage).error === "object"
  );
};

const hasDocumentAuthResult = (
  image: PropertyImage
): image is ExtendedPropertyImage => {
  return (
    "documentAuthResult" in image &&
    typeof (image as ExtendedPropertyImage).documentAuthResult === "object"
  );
};



// Mock services for demonstration - kept as reference for future expansion
// Get the orchestrator instance - it handles all service coordination
const orchestrator = getImageServiceOrchestrator();

interface PropertyImageVaultProps {
  landVerificationId?: string;
  defaultDocumentType?: DocumentType;
  onUploadComplete?: (imageId: string, documentType?: DocumentType) => void;
  onUploadError?: (error: ImageProcessingError) => void;
  onProgressUpdate?: (sessionId: string, progress: UploadProgress) => void;
  onWorkflowUpdate?: (imageId: string, status: WorkflowStatus) => void;
  maxConcurrentUploads?: number;
  enableAuditLogging?: boolean;
  showWorkflowProgress?: boolean;
  allowedDocumentTypes?: DocumentType[];
  // Additional props that components are trying to pass
  maxFileSize?: number;
  acceptedFormats?: string[];
  maxFiles?: number;
  allowAnnotation?: boolean;
  allowPrimaryFlag?: boolean;
  onChange?: (images: PropertyImage[]) => void;
  onError?: (error: string) => void;
}

// Optimized StatCard component for better reusability
const StatCard = memo<{
  title: string;
  value: number;
  colorScheme:
    | "blue"
    | "green"
    | "red"
    | "yellow"
    | "purple"
    | "teal"
    | "orange";
}>(({ title, value, colorScheme }) => (
  <div className={`bg-${colorScheme}-50 p-4 rounded-lg shadow-sm`}>
    <h4 className={`text-sm font-medium text-${colorScheme}-800`}>{title}</h4>
    <p className={`text-2xl font-bold text-${colorScheme}-900`}>{value}</p>
  </div>
));

StatCard.displayName = "StatCard";

// Optimized IconComponent for better performance
const DocumentIcon = memo<{ documentType?: string }>(({ documentType }) => (
  <div className="w-3 h-3 bg-gray-400 rounded-sm flex items-center justify-center text-xs text-white">
    {documentType?.charAt(0).toUpperCase() || "F"}
  </div>
));

DocumentIcon.displayName = "DocumentIcon";

// Optimized ProgressBar component - completely removed inline styles
const ProgressBar = memo<{
  progress: number;
  colorScheme: "blue" | "green";
  label?: string;
  secondaryLabel?: string;
}>(({ progress, colorScheme, label, secondaryLabel }) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  // Use CSS classes for different progress levels to avoid inline styles
  const getProgressClass = (progress: number) => {
    if (progress >= 100) return "w-full";
    if (progress >= 90) return "w-11/12";
    if (progress >= 80) return "w-4/5";
    if (progress >= 75) return "w-3/4";
    if (progress >= 66) return "w-2/3";
    if (progress >= 60) return "w-3/5";
    if (progress >= 50) return "w-1/2";
    if (progress >= 40) return "w-2/5";
    if (progress >= 33) return "w-1/3";
    if (progress >= 25) return "w-1/4";
    if (progress >= 20) return "w-1/5";
    if (progress >= 10) return "w-1/12";
    if (progress > 0) return "w-1";
    return "w-0";
  };

  const progressBarClass = `bg-${colorScheme}-600 h-2.5 rounded-full transition-all duration-300 ${getProgressClass(clampedProgress)}`;

  return (
    <div className="mt-3">
      {(label || secondaryLabel) && (
        <div className="flex justify-between items-center text-sm text-gray-700">
          {label && <span>{label}</span>}
          {secondaryLabel && <span>{secondaryLabel}</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
        <div className={progressBarClass} />
      </div>
    </div>
  );
});

ProgressBar.displayName = "ProgressBar";

const PropertyImageVault: React.FC<PropertyImageVaultProps> = ({
  landVerificationId,
  defaultDocumentType = "property_photo",
  onUploadComplete,
  onUploadError,
  onProgressUpdate,
  onWorkflowUpdate,
  maxConcurrentUploads = 3,
  enableAuditLogging = true,
  showWorkflowProgress = true,
  allowedDocumentTypes,
  maxFileSize,
  acceptedFormats,
  maxFiles,
  allowAnnotation = false,
  allowPrimaryFlag = false,
  onChange,
  onError,
}) => {
  // Enhanced hook configuration with proper null checking and fixed landVerificationId issue
  const hookOptions = useMemo(() => {
    const baseOptions = {
      defaultDocumentType: defaultDocumentType as DocumentType,
      maxConcurrentUploads,
      enableAuditLogging,
      // Only spread defined callback props to avoid undefined issues
      ...(onUploadComplete && { onUploadComplete }),
      ...(onUploadError && { onUploadError }),
      ...(onProgressUpdate && { onProgressUpdate }),
      ...(onWorkflowUpdate && { onWorkflowUpdate }),
    };

    // Add landVerificationId if it's defined
    if (landVerificationId) {
      return {
        ...baseOptions,
        landVerificationId,
      };
    }

    return baseOptions;
  }, [
    landVerificationId,
    defaultDocumentType,
    maxConcurrentUploads,
    enableAuditLogging,
    onUploadComplete,
    onUploadError,
    onProgressUpdate,
    onWorkflowUpdate,
  ]);

  const {
    images,
    uploadFile,
    uploadFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    isUploading,
    uploadStats,
    workflowStats,
  } = usePropertyImageUpload(orchestrator, undefined, hookOptions);

  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentType>(
    defaultDocumentType as DocumentType
  );
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);

  // Effect: Call onChange callback when images change
  React.useEffect(() => {
    if (onChange) {
      onChange(images);
    }
  }, [images, onChange]);



  // Handle setting primary image
  const handleSetPrimary = useCallback((imageId: string) => {
    if (allowPrimaryFlag) {
      setPrimaryImageId(imageId);
    }
  }, [allowPrimaryFlag]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files) {
        setSelectedFiles(event.target.files);
        setValidationErrors({});
      }
    },
    []
  );

  // Validate files before upload
  const validateFiles = useCallback((files: FileList): boolean => {
    const errors: Record<string, string> = {};

    // Check max files
    if (maxFiles && files.length > maxFiles) {
      const errorMsg = `Maximum ${maxFiles} files allowed. You selected ${files.length}.`;
      errors.maxFiles = errorMsg;
      onError?.(errorMsg);
    }

    // Validate each file
    Array.from(files).forEach((file, index) => {
      const fileKey = `file-${index}`;

      // Check file size
      if (maxFileSize && file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(2);
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        const errorMsg = `${file.name} is ${fileSizeMB}MB but max is ${maxSizeMB}MB`;
        errors[fileKey] = errorMsg;
        onError?.(errorMsg);
      }

      // Check accepted formats
      if (acceptedFormats && !acceptedFormats.includes(file.type)) {
        const errorMsg = `${file.name} format is not accepted. Accepted: ${acceptedFormats.join(", ")}`;
        errors[fileKey] = errorMsg;
        onError?.(errorMsg);
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [maxFiles, maxFileSize, acceptedFormats, onError]);

  const handleUploadClick = useCallback(async () => {
    if (selectedFiles && selectedFiles.length > 0) {
      // Validate files first
      if (!validateFiles(selectedFiles)) {
        return;
      }

      try {
        // Use array destructuring as suggested by ESLint
        const [firstFile] = Array.from(selectedFiles);
        if (firstFile && selectedFiles.length === 1) {
          await uploadFile(firstFile, currentDocumentType);
        } else {
          await uploadFiles(Array.from(selectedFiles), currentDocumentType);
        }
        setSelectedFiles(null); // Clear selected files after upload initiation
        setValidationErrors({});
      } catch (error) {
        // Improved error logging with structured data - using warn instead of log for console
        const errorMessage =
          error instanceof Error ? error.message : "Unknown upload error";
        // eslint-disable-next-line no-console
        console.warn("Upload failed:", {
          error: errorMessage,
          fileCount: selectedFiles.length,
        });
        onError?.(errorMessage);
        // Error handling is managed by the hook's onUploadError callback
      }
    }
  }, [selectedFiles, uploadFile, uploadFiles, currentDocumentType, validateFiles, onError]);

  // Optimized document type options with memoization
  const documentTypeOptions = useMemo(() => {
    if (allowedDocumentTypes) {
      return allowedDocumentTypes.map((type) => (
        <option key={type} value={type}>
          {ImageUtils.formatDocumentType(
            type as Parameters<typeof ImageUtils.formatDocumentType>[0]
          )}
        </option>
      ));
    }

    return [
      <option key="property_photo" value="property_photo">
        Property Photo
      </option>,
      <option key="title_deed" value="title_deed">
        Title Deed
      </option>,
      <option key="survey_plan" value="survey_plan">
        Survey Plan
      </option>,
      <option key="valuation_report" value="valuation_report">
        Valuation Report
      </option>,
      <option key="identification_document" value="identification_document">
        Identification Document
      </option>,
      <option key="other_document" value="other_document">
        Other Document
      </option>,
    ];
  }, [allowedDocumentTypes]);

  const renderImageCard = useCallback(
    (image: PropertyImage) => {
      const extendedImage = image as ExtendedPropertyImage;
      const workflowStatus =
        workflowStats.activeWorkflows > 0 ?
          orchestrator.getWorkflowStatus(image.id)
        : null;
      const currentStep = workflowStatus?.currentStep || "N/A";
      const progress = workflowStatus?.progress || image.progress || 0;
      const statusColorClass =
        ImageUtils.getStatusColor(image.status as ImageStatus) ||
        "bg-gray-200 text-gray-800";
      const approvalColorClass =
        ImageUtils.getApprovalStatusColor(
          image.approvalStatus as ApprovalStatus
        ) || "bg-gray-200 text-gray-800";
      const fraudRisk =
        image.fraudDetectionScore ?
          ImageUtils.formatRiskScore(image.fraudDetectionScore)
        : null;

      return (
        <div
          key={image.id}
          className="border rounded-lg shadow-sm p-4 mb-4 bg-white flex flex-col md:flex-row items-start space-x-4"
        >
          <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
            {image.preview ?
              <img
                src={image.preview}
                alt={image.file.name}
                className="w-full h-full object-cover"
              />
            : <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                No Preview
              </div>
            }
          </div>
          <div className="grow">
            <h3
              className="text-lg font-semibold text-gray-900 truncate"
              title={image.file.name}
            >
              {image.file.name}
            </h3>
            <p className="text-sm text-gray-600">
              {ImageUtils.formatFileSize(image.file.size)}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColorClass}`}
              >
                {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColorClass}`}
              >
                Approval:{" "}
                {ImageUtils.formatApprovalStatus(
                  image.approvalStatus as ApprovalStatus
                )}
              </span>
              {image.documentType && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 flex items-center">
                  <DocumentIcon documentType={image.documentType} />
                  {ImageUtils.formatDocumentType(
                    image.documentType as Parameters<
                      typeof ImageUtils.formatDocumentType
                    >[0]
                  )}
                </span>
              )}
              {image.landVerificationId && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Land ID: {image.landVerificationId.substring(0, 8)}...
                </span>
              )}
            </div>

            {/* Optimized workflow progress rendering */}
            {showWorkflowProgress &&
              image.status === "processing" &&
              workflowStatus && (
                <ProgressBar
                  progress={progress}
                  colorScheme="blue"
                  label={`Processing: ${ImageUtils.formatProcessingStep(currentStep)}`}
                  secondaryLabel={`${progress.toFixed(1)}%`}
                />
              )}

            {/* Optimized upload progress rendering */}
            {image.status === "uploading" &&
              typeof image.progress === "number" && (
                <ProgressBar
                  progress={image.progress}
                  colorScheme="green"
                  label={`Uploading: ${image.progress.toFixed(1)}%`}
                  secondaryLabel={ImageUtils.formatSpeed(
                    image.uploadSpeed || 0
                  )}
                />
              )}

            {/* Enhanced ETA display with proper type checking */}
            {image.status === "uploading" &&
              typeof extendedImage.eta === "number" &&
              extendedImage.eta !== Infinity && (
                <p className="text-xs text-gray-500 mt-1">
                  ETA: {ImageUtils.formatETA(extendedImage.eta)}
                </p>
              )}

            {/* Enhanced error handling with type safety */}
            {image.status === "error" && hasError(image) && (
              <p className="text-sm text-red-600 mt-2">
                Error: {image.error?.message || "Unknown error"}
              </p>
            )}

            {/* Failed steps display for workflow issues */}
            {showWorkflowProgress &&
              workflowStatus &&
              workflowStatus.failedSteps.length > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  Failed steps:{" "}
                  {workflowStatus.failedSteps
                    .map((s: string) => ImageUtils.formatProcessingStep(s))
                    .join(", ")}
                </p>
              )}

            {/* Enhanced metadata display section */}
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              {image.metadata?.dimensions && (
                <p>
                  Dimensions:{" "}
                  {ImageUtils.formatDimensions(
                    image.metadata.dimensions.width,
                    image.metadata.dimensions.height
                  )}
                  (
                  {ImageUtils.formatAspectRatio(
                    image.metadata.dimensions.width,
                    image.metadata.dimensions.height
                  )}
                  )
                </p>
              )}
              {image.metadata?.geoLocation && (
                <p>
                  Location:{" "}
                  {ImageUtils.formatCoordinates(
                    image.metadata.geoLocation.latitude,
                    image.metadata.geoLocation.longitude
                  )}
                  (
                  {ImageUtils.formatPropertyLocation(
                    image.metadata.geoLocation.latitude,
                    image.metadata.geoLocation.longitude
                  )}
                  )
                </p>
              )}
              {image.metadata?.technicalMetadata?.format && (
                <p>
                  Format:{" "}
                  {image.metadata.technicalMetadata.format.toUpperCase()}
                </p>
              )}
              {image.metadata?.createdAt && (
                <p>
                  Uploaded:{" "}
                  {ImageUtils.formatTimestamp(
                    image.metadata.createdAt,
                    "short"
                  )}
                </p>
              )}

              {/* Validation result display */}
              {image.validationResult && (
                <div className="mt-2">
                  <p className="font-medium">Validation Summary:</p>
                  {image.validationResult.isValid ?
                    <span className="text-green-600">Passed</span>
                  : <span className="text-red-600">
                      Failed: {image.validationResult.errors.join(", ")}
                    </span>
                  }
                  {image.validationResult.warnings.length > 0 && (
                    <p className="text-orange-600">
                      Warnings: {image.validationResult.warnings.join(", ")}
                    </p>
                  )}
                </div>
              )}

              {/* Enhanced document auth result with type safety */}
              {hasDocumentAuthResult(image) && (
                <div className="mt-2">
                  <p className="font-medium">Document Authentication:</p>
                  {image.documentAuthResult?.isAuthentic ?
                    <span className="text-green-600">
                      Authentic (
                      {ImageUtils.formatConfidence(
                        image.documentAuthResult.confidence
                      )}
                      )
                    </span>
                  : <span className="text-red-600">
                      Not Authentic:{" "}
                      {image.documentAuthResult?.anomalies?.join(", ") ||
                        "Unknown issues"}
                    </span>
                  }
                </div>
              )}

              {/* Fraud risk display */}
              {fraudRisk && (
                <div className="mt-2">
                  <p className="font-medium">Fraud Risk:</p>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ImageUtils.getRiskLevelColor(fraudRisk.level)}`}
                  >
                    {fraudRisk.text} (
                    {fraudRisk.level.charAt(0).toUpperCase() +
                      fraudRisk.level.slice(1)}
                    )
                  </span>
                </div>
              )}

              {/* Compliance flags display */}
              {image.complianceFlags && image.complianceFlags.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium text-red-600">Compliance Flags:</p>
                  <ul className="list-disc list-inside text-red-600">
                    {image.complianceFlags.map((flag: string, i: number) => (
                      <li key={i}>{flag.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enhanced regulatory flags with type safety */}
              {extendedImage.regulatoryFlags &&
                extendedImage.regulatoryFlags.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-orange-600">
                      Regulatory Flags:
                    </p>
                    <ul className="list-disc list-inside text-orange-600">
                      {extendedImage.regulatoryFlags.map(
                        (flag: string, i: number) => (
                          <li key={i}>{flag.replace(/_/g, " ")}</li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </div>

            {/* Optimized action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              {image.status === "uploading" && hasSessionId(image) && (
                <button
                  type="button"
                  onClick={() => pauseUpload(image.sessionId || "")}
                  className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
                >
                  Pause
                </button>
              )}
              {image.status === "paused" && hasSessionId(image) && (
                <button
                  type="button"
                  onClick={() => resumeUpload(image.sessionId || "")}
                  className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Resume
                </button>
              )}
              {(image.status === "uploading" ||
                image.status === "paused" ||
                image.status === "error") &&
                hasSessionId(image) && (
                  <button
                    type="button"
                    onClick={() => cancelUpload(image.sessionId || "")}
                    className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              {image.status === "error" && (
                <button
                  type="button"
                  onClick={() => retryUpload(image.id)}
                  className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
                >
                  Retry
                </button>
              )}
              {allowPrimaryFlag && image.status === "uploaded" && (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(image.id)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    primaryImageId === image.id
                      ? "bg-green-200 text-green-800 hover:bg-green-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {primaryImageId === image.id ? "★ Primary" : "☆ Set as Primary"}
                </button>
              )}
              {allowAnnotation && image.status === "uploaded" && (
                <button
                  type="button"
                  className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
                >
                  📝 Annotate
                </button>
              )}
            </div>
          </div>
        </div>
      );
    },
    [
      pauseUpload,
      resumeUpload,
      cancelUpload,
      retryUpload,
      showWorkflowProgress,
      workflowStats,
      handleSetPrimary,
      allowPrimaryFlag,
      allowAnnotation,
      primaryImageId,
    ]
  );

  // Optimized stats rendering with memoized components
  const renderUploadStats = useMemo(
    () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Files"
          value={uploadStats.totalFiles}
          colorScheme="blue"
        />
        <StatCard
          title="Completed Uploads"
          value={uploadStats.completedFiles}
          colorScheme="green"
        />
        <StatCard
          title="Failed Uploads"
          value={uploadStats.failedFiles}
          colorScheme="red"
        />
        <StatCard
          title="Active Uploads"
          value={uploadStats.activeUploads}
          colorScheme="yellow"
        />
      </div>
    ),
    [uploadStats]
  );

  const renderWorkflowStats = useMemo(
    () =>
      showWorkflowProgress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard
            title="Total Workflows"
            value={workflowStats.totalWorkflows}
            colorScheme="purple"
          />
          <StatCard
            title="Completed Workflows"
            value={workflowStats.completedWorkflows}
            colorScheme="teal"
          />
          <StatCard
            title="Failed Workflows"
            value={workflowStats.failedWorkflows}
            colorScheme="orange"
          />
        </div>
      ),
    [workflowStats, showWorkflowProgress]
  );

  return (
    <div className="font-sans antialiased bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Property Image Vault
      </h1>

      {renderUploadStats}
      {renderWorkflowStats}

      {/* Validation Errors Display */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800 mb-2">
            ⚠️ Validation Errors
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(validationErrors).map(([key, error]) => (
              <li key={key}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Upload New Images
        </h2>
        <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            aria-label="Select image files to upload"
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
          />
          <select
            id="document-type-selector"
            name="documentType"
            value={currentDocumentType}
            onChange={(e) =>
              setCurrentDocumentType(e.target.value as DocumentType)
            }
            aria-label="Select document type for uploaded files"
            title="Choose the type of document you are uploading"
            className="block w-full md:w-auto px-3 py-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {documentTypeOptions}
          </select>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={
              !selectedFiles || selectedFiles.length === 0 || isUploading
            }
            className="w-full md:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isUploading ? "Uploading..." : "Upload Selected"}
          </button>
        </div>
        {selectedFiles && selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-sm text-gray-600">
              Selected {selectedFiles.length} file(s) for upload as{" "}
              {ImageUtils.formatDocumentType(
                currentDocumentType as Parameters<
                  typeof ImageUtils.formatDocumentType
              >[0]
              )}
              .
            </p>
            {/* Display file constraints */}
            {(maxFileSize || maxFiles || acceptedFormats) && (
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                {maxFileSize && (
                  <p>📏 Max file size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB</p>
                )}
                {maxFiles && (
                  <p>📂 Maximum files: {maxFiles}</p>
                )}
                {acceptedFormats && (
                  <p>📄 Accepted formats: {acceptedFormats.join(", ")}</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Display constraints hint when no files selected */}
        {(!selectedFiles || selectedFiles.length === 0) && (maxFileSize || maxFiles || acceptedFormats) && (
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 p-2 rounded">
            <p className="font-semibold text-gray-600 mb-1">Upload Requirements:</p>
            {maxFileSize && (
              <p>📏 Max file size: {(maxFileSize / (1024 * 1024)).toFixed(1)}MB</p>
            )}
            {maxFiles && (
              <p>📂 Maximum files: {maxFiles}</p>
            )}
            {acceptedFormats && (
              <p>📄 Accepted formats: {acceptedFormats.join(", ")}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Current Images ({images.length})
        </h2>
        {images.length > 0 && (
          <div className="text-sm text-gray-600">
            {uploadStats.activeUploads > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {uploadStats.activeUploads} uploading
              </span>
            )}
            {workflowStats.activeWorkflows > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {workflowStats.activeWorkflows} processing
              </span>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {images.length === 0 ?
          <div className="text-center p-8 bg-white rounded-lg shadow-md text-gray-500">
            <div className="mx-auto mb-4 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center opacity-75">
              <span className="text-4xl">📁</span>
            </div>
            <p className="text-lg">No images uploaded yet.</p>
            <p className="text-sm mt-2">
              Start by selecting files above to begin the upload process!
            </p>
          </div>
        : images.map(renderImageCard)}
      </div>
    </div>
  );
};

export default PropertyImageVault;