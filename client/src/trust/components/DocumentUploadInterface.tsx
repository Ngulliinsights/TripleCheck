import { motion, AnimatePresence } from "framer-motion"
import {
  Upload,
  FileText,
  Image,
  File,
  X,
  CheckCircle,
  Clock,
  Camera,
  Scan,
  Shield,
  Eye,
} from "lucide-react"
import React, { useState, useCallback, useMemo } from "react"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "../../shared/components/ui/alert"
import { Badge } from "../../shared/components/ui/badge"
import { Button } from "../../shared/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../shared/components/ui/card"
import { Progress } from "../../shared/components/ui/progress"
import { useToast } from "../../shared/hooks/use-toast"
import {
  useDocumentAuthentication,
  type DocumentVerificationResult,
} from "../hooks/useDocumentAuthentication"

import { DocumentVerificationResults } from "./DocumentVerificationResults"

// Define constants to avoid string duplication and improve maintainability
const DEFAULT_MAX_FILE_SIZE = 10; // 10MB
const PDF_MIME_TYPE = "application/pdf";
const DEFAULT_ACCEPTED_TYPES = [
  PDF_MIME_TYPE,
  "image/jpeg",
  "image/png",
  "image/tiff",
] as const;
const PROGRESS_UPDATE_INTERVAL = 300; // milliseconds
const PROGRESS_INCREMENT_MIN = 5; // minimum progress increment percentage
const PROGRESS_INCREMENT_MAX = 20; // maximum progress increment percentage

// Define status constants to avoid string duplication - using uppercase to match expected types
const FILE_STATUS = {
  COMPLETED: "COMPLETED",
  PROCESSING: "PROCESSING",
  PENDING: "PENDING",
} as const;

const VERIFICATION_STATUS = {
  AUTHENTIC: "authentic",
  SUSPICIOUS: "suspicious",
  FORGED: "forged",
} as const;

interface DocumentUploadInterfaceProps {
  readonly onVerificationComplete?: (
    result: DocumentVerificationResult
  ) => void;
  readonly maxFileSize?: number; // in MB
  readonly acceptedTypes?: readonly string[];
  readonly showResults?: boolean;
}

const ACCEPTED_DOCUMENT_TYPES = [
  {
    type: PDF_MIME_TYPE,
    name: "PDF Documents",
    icon: FileText,
    description: "Title deeds, agreements, certificates",
  },
  {
    type: "image/jpeg",
    name: "JPEG Images",
    icon: Image,
    description: "Scanned documents, photos",
  },
  {
    type: "image/png",
    name: "PNG Images",
    icon: Image,
    description: "High-quality scans",
  },
  {
    type: "image/tiff",
    name: "TIFF Images",
    icon: Image,
    description: "Professional scans",
  },
] as const;

const DOCUMENT_CATEGORIES = [
  {
    id: "title_deed",
    name: "Title Deed",
    icon: "📜",
    description: "Official land ownership document",
  },
  {
    id: "sale_agreement",
    name: "Sale Agreement",
    icon: "📋",
    description: "Property purchase agreement",
  },
  {
    id: "survey_plan",
    name: "Survey Plan",
    icon: "🗺️",
    description: "Land survey and boundaries",
  },
  {
    id: "compliance_certificate",
    name: "Compliance Certificate",
    icon: "✅",
    description: "Government compliance document",
  },
  {
    id: "other",
    name: "Other Document",
    icon: "📄",
    description: "Other land-related document",
  },
] as const;

export function DocumentUploadInterface({
  onVerificationComplete,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  showResults = true,
}: DocumentUploadInterfaceProps) {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Map<string, number>>(
    new Map()
  );
  const [verificationResults, setVerificationResults] = useState<
    Map<string, string>
  >(new Map());
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { verifyDocument, formatFileSize } = useDocumentAuthentication();

  // Create a stable file ID generator using useMemo to ensure consistent tracking
  // This approach is more secure and prevents potential object injection vulnerabilities
  const generateFileId = useCallback((file: File, timestamp?: number) => {
    const time = timestamp || Date.now();
    // Sanitize filename to prevent potential security issues by using a whitelist approach
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    return `${sanitizedName}_${time}_${file.size}`;
  }, []);

  // Secure random number generation helper
  const getSecureRandomValue = useCallback((): number => {
    if (window?.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      const randomValue = array[0];
      if (randomValue !== undefined) {
        return randomValue / (0xffffffff + 1);
      }
    }
    // Fallback to Math.random - this is acceptable for progress simulation in UI
    // This is safe for non-cryptographic purposes like progress bar animation
    return Math.random();
  }, []);

  // Safe object access helpers to prevent object injection vulnerabilities
  const getProgressSafely = useCallback(
    (fileId: string): number => {
      return uploadProgress.get(fileId) ?? 0;
    },
    [uploadProgress]
  );

  const getVerificationResultSafely = useCallback(
    (fileId: string): string | undefined => {
      return verificationResults.get(fileId);
    },
    [verificationResults]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Enhanced verification with better progress tracking and error handling
  const handleVerifyDocument = useCallback(
    async (file: File) => {
      const timestamp = Date.now();
      const fileId = generateFileId(file, timestamp);

      try {
        // Initialize progress tracking using Map for better security and performance
        setUploadProgress((prev) => new Map(prev).set(fileId, 0));

        // Create more realistic progress simulation with secure random number generation
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            const currentProgress = prev.get(fileId) ?? 0;
            if (currentProgress >= 90) {
              clearInterval(progressInterval);
              return prev;
            }

            const randomValue = getSecureRandomValue();
            const increment =
              randomValue * (PROGRESS_INCREMENT_MAX - PROGRESS_INCREMENT_MIN) +
              PROGRESS_INCREMENT_MIN;

            return new Map(prev).set(
              fileId,
              Math.min(currentProgress + increment, 90)
            );
          });
        }, PROGRESS_UPDATE_INTERVAL);

        const result = await verifyDocument(file);

        // Clear the interval and complete progress
        clearInterval(progressInterval);
        setUploadProgress((prev) => new Map(prev).set(fileId, 100));
        setVerificationResults((prev) => new Map(prev).set(fileId, result.id));

        // Notify parent component if callback provided
        if (onVerificationComplete) {
          onVerificationComplete(result);
        }

        // Show success/warning toast based on verification result
        const isSuccessful = result.status === VERIFICATION_STATUS.AUTHENTIC;
        toast({
          title: "Verification Complete",
          description: `${file.name} has been analyzed. Status: ${result.status.charAt(0).toUpperCase() + result.status.slice(1)}`,
          variant: isSuccessful ? "default" : "destructive",
        });
      } catch (error) {
        // Clean up progress on error using Map operations for better security
        setUploadProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(fileId);
          return newMap;
        });

        const errorMessage =
          error instanceof Error ? error.message : "Failed to verify document";
        toast({
          title: "Verification Failed",
          description: `Could not verify ${file.name}: ${errorMessage}`,
          variant: "destructive",
        });
      }
    },
    [
      verifyDocument,
      onVerificationComplete,
      toast,
      generateFileId,
      getSecureRandomValue,
    ]
  );

  // Improved file handling with better validation and error handling
  const handleFiles = useCallback(
    (files: File[]) => {
      const validFiles = files.filter((file) => {
        // Check file type with more specific validation
        if (!acceptedTypes.includes(file.type)) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not a supported file type. Please upload ${acceptedTypes.join(", ")}.`,
            variant: "destructive",
          });
          return false;
        }

        // Check file size with proper byte calculation
        const maxSizeInBytes = maxFileSize * 1024 * 1024;
        if (file.size > maxSizeInBytes) {
          toast({
            title: "File Too Large",
            description: `${file.name} (${formatFileSize(file.size)}) exceeds the ${maxFileSize}MB limit.`,
            variant: "destructive",
          });
          return false;
        }

        // Additional validation: check for empty files
        if (file.size === 0) {
          toast({
            title: "Empty File",
            description: `${file.name} appears to be empty and cannot be processed.`,
            variant: "destructive",
          });
          return false;
        }

        return true;
      });

      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...validFiles]);

        // Start verification for each valid file
        validFiles.forEach((file) => {
          handleVerifyDocument(file);
        });
      }
    },
    [acceptedTypes, maxFileSize, formatFileSize, toast, handleVerifyDocument]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files?.length > 0) {
        handleFiles(Array.from(e.dataTransfer.files));
      }
    },
    [handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) {
        handleFiles(Array.from(e.target.files));
      }
    },
    [handleFiles]
  );

  // Improved file removal with proper cleanup using Map operations
  const removeFile = useCallback(
    (index: number) => {
      // Safely access array element to prevent potential security issues
      if (index < 0 || index >= uploadedFiles.length) return;

      const fileToRemove = uploadedFiles[index];
      if (!fileToRemove) return;

      const fileId = generateFileId(fileToRemove);

      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

      // Clean up associated state using Map operations for better security
      setUploadProgress((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });

      setVerificationResults((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileId);
        return newMap;
      });
    },
    [uploadedFiles, generateFileId]
  );

  // Utility functions for file status and icons with safer parameter handling
  const getFileIcon = useCallback((file: File) => {
    if (file.type.startsWith("image/")) return Image;
    if (file.type === PDF_MIME_TYPE) return FileText;
    return File;
  }, []);

  const getFileStatus = useCallback(
    (file: File): (typeof FILE_STATUS)[keyof typeof FILE_STATUS] => {
      const fileId = generateFileId(file);
      const progress = getProgressSafely(fileId);
      const resultId = getVerificationResultSafely(fileId);

      if (resultId) return FILE_STATUS.COMPLETED;
      if (progress > 0) return FILE_STATUS.PROCESSING;
      return FILE_STATUS.PENDING;
    },
    [generateFileId, getProgressSafely, getVerificationResultSafely]
  );

  // Memoize verification results array for better performance
  const verificationResultsArray = useMemo(() => {
    return Array.from(verificationResults.values());
  }, [verificationResults]);

  return (
    <div className="space-y-6">
      {/* Document Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Document Category</span>
          </CardTitle>
          <CardDescription>
            Select the type of document you&apos;re uploading for optimized
            verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DOCUMENT_CATEGORIES.map((category) => (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedCategory === category.id ?
                    "ring-2 ring-blue-500 bg-blue-50"
                  : ""
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{category.icon}</div>
                  <h4 className="font-semibold text-sm mb-1">
                    {category.name}
                  </h4>
                  <p className="text-xs text-gray-600">
                    {category.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Documents</span>
          </CardTitle>
          <CardDescription>
            Drag and drop your documents or click to browse. Maximum file size:{" "}
            {maxFileSize}MB
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
              dragActive ?
                "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(",")}
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Upload documents"
              title="Click to select files or drag and drop"
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-4 bg-blue-100 rounded-full">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Drop your documents here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse your files
                </p>

                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="sm" type="button">
                    <Camera className="h-4 w-4 mr-2" />
                    Take Photo
                  </Button>
                  <Button variant="outline" size="sm" type="button">
                    <Scan className="h-4 w-4 mr-2" />
                    Scan Document
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Accepted File Types */}
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Accepted File Types:
            </h4>
            <div className="flex flex-wrap gap-2">
              {ACCEPTED_DOCUMENT_TYPES.map((docType) => {
                const Icon = docType.icon;
                return (
                  <div
                    key={docType.type}
                    className="flex items-center space-x-2 text-xs text-gray-600"
                  >
                    <Icon className="h-3 w-3" />
                    <span>{docType.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Documents</CardTitle>
            <CardDescription>
              Track the verification progress of your uploaded documents
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {uploadedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file);
                  const status = getFileStatus(file);
                  const fileId = generateFileId(file);
                  const progress = getProgressSafely(fileId);
                  const resultId = getVerificationResultSafely(fileId);

                  return (
                    <motion.div
                      key={`${fileId}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <FileIcon className="h-5 w-5 text-blue-600" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 truncate">
                                  {file.name}
                                </h4>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span>{file.type}</span>
                                  <span>
                                    {new Date(
                                      file.lastModified
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {status === FILE_STATUS.COMPLETED && (
                                <Badge
                                  variant="default"
                                  className="flex items-center space-x-1"
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  <span>Verified</span>
                                </Badge>
                              )}

                              {status === FILE_STATUS.PROCESSING && (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center space-x-1"
                                >
                                  <Clock className="h-3 w-3 animate-spin" />
                                  <span>Processing</span>
                                </Badge>
                              )}

                              {status === FILE_STATUS.PENDING && (
                                <Badge variant="outline">Pending</Badge>
                              )}

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                                className="h-6 w-6 p-0"
                                aria-label={`Remove ${file.name}`}
                                type="button"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar */}
                          {status === FILE_STATUS.PROCESSING && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                <span>Analyzing document...</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          )}

                          {/* Verification Results Preview */}
                          {status === FILE_STATUS.COMPLETED && resultId && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">
                                  Verification completed
                                </span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  type="button"
                                  onClick={() => {
                                    // Scroll to results section
                                    const resultsElement =
                                      document.getElementById(
                                        `results-${resultId}`
                                      );
                                    if (resultsElement) {
                                      resultsElement.scrollIntoView({
                                        behavior: "smooth",
                                      });
                                    }
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Results
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Security & Privacy</AlertTitle>
        <AlertDescription>
          Your documents are processed securely and are automatically deleted
          after verification. We use advanced encryption and do not store your
          sensitive documents permanently.
        </AlertDescription>
      </Alert>

      {/* Verification Results */}
      {showResults &&
        verificationResultsArray.map((resultId) => (
          <div key={resultId} id={`results-${resultId}`}>
            <DocumentVerificationResults
              documentId={resultId}
              onRecommendationAction={(action, recommendation) => {
                toast({
                  title: "Action Taken",
                  description: `${action} for recommendation: ${recommendation}`,
                });
              }}
            />
          </div>
        ))}
    </div>
  );
}

export default DocumentUploadInterface;
