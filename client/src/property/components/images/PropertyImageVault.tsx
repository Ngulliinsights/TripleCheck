/**
 * PropertyImageVault.tsx
 * Upload, validation, and workflow management UI for property images.
 */

import React, { useState, useCallback, useMemo, useRef, memo } from "react"

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

// ---------------------------------------------------------------------------
// Extended types
// ---------------------------------------------------------------------------

interface ExtendedPropertyImage extends PropertyImage {
  sessionId?: string
  eta?: number
  error?: { message: string }
  regulatoryFlags?: string[]
}

// Narrowed type guards
const hasSessionId = (img: PropertyImage): img is ExtendedPropertyImage =>
  "sessionId" in img && typeof (img as ExtendedPropertyImage).sessionId === "string"

const hasError = (img: PropertyImage): img is ExtendedPropertyImage =>
  "error" in img && typeof (img as ExtendedPropertyImage).error === "object"

const hasDocumentAuthResult = (img: PropertyImage): img is ExtendedPropertyImage =>
  "documentAuthResult" in img &&
  typeof (img as ExtendedPropertyImage).documentAuthResult === "object"

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface PropertyImageVaultProps {
  landVerificationId?: string
  defaultDocumentType?: DocumentType
  onUploadComplete?: (imageId: string, documentType?: DocumentType) => void
  onUploadError?: (error: ImageProcessingError) => void
  onProgressUpdate?: (sessionId: string, progress: UploadProgress) => void
  onWorkflowUpdate?: (imageId: string, status: WorkflowStatus) => void
  maxConcurrentUploads?: number
  enableAuditLogging?: boolean
  showWorkflowProgress?: boolean
  allowedDocumentTypes?: DocumentType[]
  maxFileSize?: number
  acceptedFormats?: string[]
  maxFiles?: number
  allowAnnotation?: boolean
  allowReorder?: boolean
  allowPrimaryFlag?: boolean
  onChange?: (images: PropertyImage[]) => void
  onError?: (error: string) => void
}

// ---------------------------------------------------------------------------
// Static constants
// ---------------------------------------------------------------------------

const DEFAULT_DOCUMENT_TYPE_OPTIONS: { value: DocumentType; label: string }[] = [
  { value: "property_photo",          label: "Property Photo" },
  { value: "title_deed",              label: "Title Deed" },
  { value: "survey_plan",             label: "Survey Plan" },
  { value: "valuation_report",        label: "Valuation Report" },
  { value: "identification_document", label: "Identification Document" },
  { value: "other_document",          label: "Other Document" },
]

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const StatCard = memo<{
  title: string
  value: number
  colorScheme: "blue" | "green" | "red" | "yellow" | "purple" | "teal" | "orange"
}>(({ title, value, colorScheme }) => (
  <div className={`bg-${colorScheme}-50 p-4 rounded-lg shadow-sm`}>
    <h4 className={`text-sm font-medium text-${colorScheme}-800`}>{title}</h4>
    <p className={`text-2xl font-bold text-${colorScheme}-900`}>{value}</p>
  </div>
))
StatCard.displayName = "StatCard"

/** Inline-styled progress bar — Tailwind cannot safely handle dynamic width classes. */
const ProgressBar = memo<{
  progress: number
  colorScheme: "blue" | "green"
  label?: string
  secondaryLabel?: string
}>(({ progress, colorScheme, label, secondaryLabel }) => {
  const clamped = Math.min(100, Math.max(0, progress))
  return (
    <div className="mt-3">
      {(label || secondaryLabel) && (
        <div className="flex justify-between items-center text-sm text-gray-700 mb-1">
          {label && <span>{label}</span>}
          {secondaryLabel && <span>{secondaryLabel}</span>}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`bg-${colorScheme}-600 h-2.5 rounded-full transition-all duration-300`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
})
ProgressBar.displayName = "ProgressBar"

const DocumentIcon = memo<{ documentType?: string }>(({ documentType }) => (
  <span className="w-3 h-3 bg-gray-400 rounded-sm inline-flex items-center justify-center text-xs text-white mr-1">
    {documentType?.charAt(0).toUpperCase() ?? "F"}
  </span>
))
DocumentIcon.displayName = "DocumentIcon"

/** Displays upload constraint hints (file size, count, format). */
const FileConstraints = memo<{
  maxFileSize?: number
  maxFiles?: number
  acceptedFormats?: string[]
}>(({ maxFileSize, maxFiles, acceptedFormats }) => {
  if (!maxFileSize && !maxFiles && !acceptedFormats) return null
  return (
    <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded space-y-0.5">
      {maxFileSize && (
        <p>Max file size: {(maxFileSize / (1024 * 1024)).toFixed(1)} MB</p>
      )}
      {maxFiles && <p>Maximum files: {maxFiles}</p>}
      {acceptedFormats && <p>Accepted formats: {acceptedFormats.join(", ")}</p>}
    </div>
  )
})
FileConstraints.displayName = "FileConstraints"

interface UploadStatsGridProps {
  uploadStats: {
    totalFiles: number
    completedFiles: number
    failedFiles: number
    activeUploads: number
  }
}

const UploadStatsGrid = memo<UploadStatsGridProps>(({ uploadStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <StatCard title="Total Files"        value={uploadStats.totalFiles}     colorScheme="blue" />
    <StatCard title="Completed Uploads"  value={uploadStats.completedFiles} colorScheme="green" />
    <StatCard title="Failed Uploads"     value={uploadStats.failedFiles}    colorScheme="red" />
    <StatCard title="Active Uploads"     value={uploadStats.activeUploads}  colorScheme="yellow" />
  </div>
))
UploadStatsGrid.displayName = "UploadStatsGrid"

interface WorkflowStatsGridProps {
  workflowStats: {
    totalWorkflows: number
    completedWorkflows: number
    failedWorkflows: number
  }
}

const WorkflowStatsGrid = memo<WorkflowStatsGridProps>(({ workflowStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <StatCard title="Total Workflows"     value={workflowStats.totalWorkflows}     colorScheme="purple" />
    <StatCard title="Completed Workflows" value={workflowStats.completedWorkflows} colorScheme="teal" />
    <StatCard title="Failed Workflows"    value={workflowStats.failedWorkflows}    colorScheme="orange" />
  </div>
))
WorkflowStatsGrid.displayName = "WorkflowStatsGrid"

// ---------------------------------------------------------------------------
// ImageCard sub-component
// ---------------------------------------------------------------------------

interface ImageCardProps {
  image: PropertyImage
  workflowStatus: ReturnType<ReturnType<typeof getImageServiceOrchestrator>["getWorkflowStatus"]> | null
  showWorkflowProgress: boolean
  primaryImageId: string | null
  allowPrimaryFlag: boolean
  allowAnnotation: boolean
  onPause: (sessionId: string) => void
  onResume: (sessionId: string) => void
  onCancel: (sessionId: string) => void
  onRetry: (imageId: string) => void
  onSetPrimary: (imageId: string) => void
}

const ImageCard = memo<ImageCardProps>(({
  image,
  workflowStatus,
  showWorkflowProgress,
  primaryImageId,
  allowPrimaryFlag,
  allowAnnotation,
  onPause,
  onResume,
  onCancel,
  onRetry,
  onSetPrimary,
}) => {
  const ext = image as ExtendedPropertyImage
  const progress    = workflowStatus?.progress ?? image.progress ?? 0
  const currentStep = workflowStatus?.currentStep ?? "N/A"

  const statusColor   = ImageUtils.getStatusColor(image.status as ImageStatus) ?? "bg-gray-200 text-gray-800"
  const approvalColor = ImageUtils.getApprovalStatusColor(image.approvalStatus as ApprovalStatus) ?? "bg-gray-200 text-gray-800"
  const fraudRisk     = image.fraudDetectionScore ? ImageUtils.formatRiskScore(image.fraudDetectionScore) : null

  const fileName = image.file?.name ?? image.id
  const fileSize = image.file?.size != null ? ImageUtils.formatFileSize(image.file.size) : null

  const isPrimary        = primaryImageId === image.id
  const isActionable     = image.status === "uploading" || image.status === "paused" || image.status === "error"
  const canPause         = image.status === "uploading" && hasSessionId(image)
  const canResume        = image.status === "paused" && hasSessionId(image)
  const canCancel        = isActionable && hasSessionId(image)

  return (
    <div className="border rounded-lg shadow-sm p-4 mb-4 bg-white flex flex-col md:flex-row items-start gap-4">
      {/* Thumbnail */}
      <div className="shrink-0 w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
        {image.preview ? (
          <img src={image.preview} alt={fileName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-xs">No Preview</span>
        )}
      </div>

      {/* Body */}
      <div className="grow min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 truncate" title={fileName}>
          {fileName}
        </h3>
        {fileSize && <p className="text-sm text-gray-600">{fileSize}</p>}

        {/* Status badges */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
            {image.status.charAt(0).toUpperCase() + image.status.slice(1)}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${approvalColor}`}>
            Approval: {ImageUtils.formatApprovalStatus(image.approvalStatus as ApprovalStatus)}
          </span>
          {image.documentType && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 inline-flex items-center">
              <DocumentIcon documentType={image.documentType} />
              {ImageUtils.formatDocumentType(image.documentType as Parameters<typeof ImageUtils.formatDocumentType>[0])}
            </span>
          )}
          {image.landVerificationId && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Land ID: {image.landVerificationId.substring(0, 8)}…
            </span>
          )}
        </div>

        {/* Workflow progress */}
        {showWorkflowProgress && image.status === "processing" && workflowStatus && (
          <ProgressBar
            progress={progress}
            colorScheme="blue"
            label={`Processing: ${ImageUtils.formatProcessingStep(currentStep)}`}
            secondaryLabel={`${progress.toFixed(1)}%`}
          />
        )}

        {/* Upload progress */}
        {image.status === "uploading" && typeof image.progress === "number" && (
          <ProgressBar
            progress={image.progress}
            colorScheme="green"
            label={`Uploading: ${image.progress.toFixed(1)}%`}
            secondaryLabel={ImageUtils.formatSpeed(image.uploadSpeed ?? 0)}
          />
        )}

        {/* ETA */}
        {image.status === "uploading" &&
          typeof ext.eta === "number" &&
          ext.eta !== Infinity && (
            <p className="text-xs text-gray-500 mt-1">
              ETA: {ImageUtils.formatETA(ext.eta)}
            </p>
          )}

        {/* Error */}
        {image.status === "error" && hasError(image) && (
          <p className="text-sm text-red-600 mt-2">
            Error: {ext.error?.message ?? "Unknown error"}
          </p>
        )}

        {/* Failed workflow steps */}
        {showWorkflowProgress && workflowStatus && workflowStatus.failedSteps.length > 0 && (
          <p className="text-xs text-red-600 mt-1">
            Failed steps: {workflowStatus.failedSteps.map((s: string) => ImageUtils.formatProcessingStep(s)).join(", ")}
          </p>
        )}

        {/* Metadata */}
        <div className="mt-3 text-sm text-gray-700 space-y-1">
          {image.metadata?.dimensions && (
            <p>
              Dimensions:{" "}
              {ImageUtils.formatDimensions(image.metadata.dimensions.width, image.metadata.dimensions.height)}{" "}
              ({ImageUtils.formatAspectRatio(image.metadata.dimensions.width, image.metadata.dimensions.height)})
            </p>
          )}
          {image.metadata?.geoLocation && (
            <p>
              Location:{" "}
              {ImageUtils.formatCoordinates(image.metadata.geoLocation.latitude, image.metadata.geoLocation.longitude)}{" "}
              ({ImageUtils.formatPropertyLocation(image.metadata.geoLocation.latitude, image.metadata.geoLocation.longitude)})
            </p>
          )}
          {image.metadata?.technicalMetadata?.format && (
            <p>Format: {image.metadata.technicalMetadata.format.toUpperCase()}</p>
          )}
          {image.metadata?.createdAt && (
            <p>Uploaded: {ImageUtils.formatTimestamp(image.metadata.createdAt, "short")}</p>
          )}

          {/* Validation */}
          {image.validationResult && (
            <div className="mt-2">
              <p className="font-medium">Validation Summary:</p>
              {image.validationResult.isValid ? (
                <span className="text-green-600">Passed</span>
              ) : (
                <span className="text-red-600">
                  Failed: {image.validationResult.errors.join(", ")}
                </span>
              )}
              {image.validationResult.warnings.length > 0 && (
                <p className="text-orange-600">
                  Warnings: {image.validationResult.warnings.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* Document authentication */}
          {hasDocumentAuthResult(image) && (
            <div className="mt-2">
              <p className="font-medium">Document Authentication:</p>
              {ext.documentAuthResult?.isAuthentic ? (
                <span className="text-green-600">
                  Authentic ({ImageUtils.formatConfidence(ext.documentAuthResult.confidence)})
                </span>
              ) : (
                <span className="text-red-600">
                  Not Authentic: {ext.documentAuthResult?.anomalies?.join(", ") ?? "Unknown issues"}
                </span>
              )}
            </div>
          )}

          {/* Fraud risk */}
          {fraudRisk && (
            <div className="mt-2">
              <p className="font-medium">Fraud Risk:</p>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ImageUtils.getRiskLevelColor(fraudRisk.level)}`}>
                {fraudRisk.text} ({fraudRisk.level.charAt(0).toUpperCase() + fraudRisk.level.slice(1)})
              </span>
            </div>
          )}

          {/* Compliance flags */}
          {image.complianceFlags && image.complianceFlags.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-red-600">Compliance Flags:</p>
              <ul className="list-disc list-inside text-red-600">
                {image.complianceFlags.map((flag: string) => (
                  <li key={flag}>{flag.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Regulatory flags */}
          {ext.regulatoryFlags && ext.regulatoryFlags.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-orange-600">Regulatory Flags:</p>
              <ul className="list-disc list-inside text-orange-600">
                {ext.regulatoryFlags.map((flag: string) => (
                  <li key={flag}>{flag.replace(/_/g, " ")}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap gap-2">
          {canPause && (
            <button
              type="button"
              onClick={() => onPause(ext.sessionId!)}
              className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Pause
            </button>
          )}
          {canResume && (
            <button
              type="button"
              onClick={() => onResume(ext.sessionId!)}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
            >
              Resume
            </button>
          )}
          {canCancel && (
            <button
              type="button"
              onClick={() => onCancel(ext.sessionId!)}
              className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
            >
              Cancel
            </button>
          )}
          {image.status === "error" && (
            <button
              type="button"
              onClick={() => onRetry(image.id)}
              className="px-3 py-1 text-sm font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
            >
              Retry
            </button>
          )}
          {allowPrimaryFlag && image.status === "uploaded" && (
            <button
              type="button"
              onClick={() => onSetPrimary(image.id)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                isPrimary
                  ? "bg-green-200 text-green-800 hover:bg-green-300"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {isPrimary ? "★ Primary" : "☆ Set as Primary"}
            </button>
          )}
          {allowAnnotation && image.status === "uploaded" && (
            <button
              type="button"
              className="px-3 py-1 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 transition-colors"
            >
              Annotate
            </button>
          )}
        </div>
      </div>
    </div>
  )
})
ImageCard.displayName = "ImageCard"

// ---------------------------------------------------------------------------
// PropertyImageVault
// ---------------------------------------------------------------------------

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
  // Stable orchestrator reference — avoids running a side effect at module scope
  const orchestratorRef = useRef(getImageServiceOrchestrator())

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
  } = usePropertyImageUpload(orchestratorRef.current, undefined, {
    defaultDocumentType: defaultDocumentType as DocumentType,
    maxConcurrentUploads,
    enableAuditLogging,
    ...(landVerificationId && { landVerificationId }),
    onUploadComplete,
    onUploadError,
    onProgressUpdate,
    onWorkflowUpdate,
  })

  const [selectedFiles, setSelectedFiles]       = useState<FileList | null>(null)
  const [currentDocumentType, setCurrentDocumentType] = useState<DocumentType>(defaultDocumentType as DocumentType)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [primaryImageId, setPrimaryImageId]     = useState<string | null>(null)

  // Propagate image changes to parent
  React.useEffect(() => {
    onChange?.(images)
  }, [images, onChange])

  const handleSetPrimary = useCallback((id: string) => {
    if (allowPrimaryFlag) setPrimaryImageId(id)
  }, [allowPrimaryFlag])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(e.target.files)
      setValidationErrors({})
    }
  }, [])

  const validateFiles = useCallback((files: FileList): boolean => {
    const errors: Record<string, string> = {}

    if (maxFiles && files.length > maxFiles) {
      errors.maxFiles = `Maximum ${maxFiles} files allowed. You selected ${files.length}.`
    }

    Array.from(files).forEach((file, index) => {
      const key = `file-${index}`
      if (maxFileSize && file.size > maxFileSize) {
        errors[key] = `${file.name} is ${(file.size / 1024 / 1024).toFixed(2)} MB (max ${(maxFileSize / 1024 / 1024).toFixed(2)} MB).`
      } else if (acceptedFormats && !acceptedFormats.includes(file.type)) {
        errors[key] = `${file.name}: unsupported format. Accepted: ${acceptedFormats.join(", ")}.`
      }
    })

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      Object.values(errors).forEach(msg => onError?.(msg))
      return false
    }

    setValidationErrors({})
    return true
  }, [maxFiles, maxFileSize, acceptedFormats, onError])

  const handleUploadClick = useCallback(async () => {
    if (!selectedFiles || selectedFiles.length === 0) return
    if (!validateFiles(selectedFiles)) return

    try {
      const filesArray = Array.from(selectedFiles)
      if (filesArray.length === 1) {
        await uploadFile(filesArray[0], currentDocumentType)
      } else {
        await uploadFiles(filesArray, currentDocumentType)
      }
      setSelectedFiles(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown upload error"
      onError?.(message)
    }
  }, [selectedFiles, uploadFile, uploadFiles, currentDocumentType, validateFiles, onError])

  // Build document type <option> elements
  const documentTypeOptions = useMemo(() => {
    const source = allowedDocumentTypes
      ? allowedDocumentTypes.map(type => ({
          value: type,
          label: ImageUtils.formatDocumentType(type as Parameters<typeof ImageUtils.formatDocumentType>[0]),
        }))
      : DEFAULT_DOCUMENT_TYPE_OPTIONS

    return source.map(({ value, label }) => (
      <option key={value} value={value}>{label}</option>
    ))
  }, [allowedDocumentTypes])

  return (
    <div className="font-sans antialiased bg-gray-50 min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Property Image Vault</h1>

      <UploadStatsGrid uploadStats={uploadStats} />
      {showWorkflowProgress && <WorkflowStatsGrid workflowStats={workflowStats} />}

      {/* Validation errors */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-semibold text-red-800 mb-2">Validation Errors</h3>
          <ul className="text-sm text-red-700 space-y-1">
            {Object.entries(validationErrors).map(([key, msg]) => (
              <li key={key}>• {msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload panel */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Upload New Images</h2>
        <div className="flex flex-col md:flex-row items-center gap-4">
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
            onChange={e => setCurrentDocumentType(e.target.value as DocumentType)}
            aria-label="Select document type"
            className="block w-full md:w-auto px-3 py-2 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {documentTypeOptions}
          </select>
          <button
            type="button"
            onClick={handleUploadClick}
            disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
            className="w-full md:w-auto px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isUploading ? "Uploading…" : "Upload Selected"}
          </button>
        </div>

        {/* Selection summary + constraints (single location) */}
        {selectedFiles && selectedFiles.length > 0 && (
          <p className="mt-3 text-sm text-gray-600">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected as{" "}
            {ImageUtils.formatDocumentType(currentDocumentType as Parameters<typeof ImageUtils.formatDocumentType>[0])}.
          </p>
        )}
        <FileConstraints
          maxFileSize={maxFileSize}
          maxFiles={maxFiles}
          acceptedFormats={acceptedFormats}
        />
      </div>

      {/* Image list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Current Images ({images.length})
        </h2>
        {images.length > 0 && (
          <div className="flex gap-2 text-sm text-gray-600">
            {uploadStats.activeUploads > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
        {images.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow-md text-gray-500">
            <div className="mx-auto mb-4 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center opacity-75 text-4xl">
              📁
            </div>
            <p className="text-lg">No images uploaded yet.</p>
            <p className="text-sm mt-2">Select files above to begin the upload process.</p>
          </div>
        ) : (
          images.map(image => (
            <ImageCard
              key={image.id}
              image={image}
              workflowStatus={
                workflowStats.activeWorkflows > 0
                  ? orchestratorRef.current.getWorkflowStatus(image.id)
                  : null
              }
              showWorkflowProgress={showWorkflowProgress}
              primaryImageId={primaryImageId}
              allowPrimaryFlag={allowPrimaryFlag}
              allowAnnotation={allowAnnotation}
              onPause={pauseUpload}
              onResume={resumeUpload}
              onCancel={cancelUpload}
              onRetry={retryUpload}
              onSetPrimary={handleSetPrimary}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default PropertyImageVault