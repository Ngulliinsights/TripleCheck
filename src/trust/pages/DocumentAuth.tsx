import { useMutation } from "@tanstack/react-query";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Shield,
  X,
  Download,
  Clock,
  AlertCircle,
  Zap,
  Send,
  Plus,
} from "lucide-react";
import React, { useState, useRef, useCallback, useMemo } from "react";

import { Button } from "../../shared/components/ui/button";
import { Input } from "../../shared/components/ui/input";
import { Progress } from "../../shared/components/ui/progress";
import { useToast } from "../../shared/hooks/use-toast";

// Constants moved to top level to prevent re-creation on each render
const FILE_CONSTRAINTS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ] as const,
} as const;

const PROGRESS_CONFIG = {
  interval: 500,
  maxProgress: 90,
  incrementRange: 15,
} as const;

// Type definitions with better specificity
interface DocumentFile {
  readonly file: File;
  readonly id: string;
  readonly preview?: string;
}

interface VerificationCheck {
  readonly passed: boolean;
  readonly score: number;
  readonly details: string;
}

interface VerificationResult {
  readonly id: string;
  readonly filename: string;
  readonly documentType: string;
  readonly verified: boolean;
  readonly confidence: number;
  readonly status: "authentic" | "suspicious" | "forged" | "processing";
  readonly checks: {
    readonly metadata: VerificationCheck;
    readonly visual: VerificationCheck;
    readonly signature: VerificationCheck;
    readonly content: VerificationCheck;
  };
  readonly issues: readonly string[];
  readonly recommendations: readonly string[];
  readonly processingTime: number;
}

interface VerificationResponse {
  readonly results: readonly VerificationResult[];
}

// Status configuration with better type safety
const STATUS_CONFIG = {
  authentic: {
    color: "text-green-600 bg-green-50 border-green-200",
    icon: CheckCircle,
    iconColor: "text-green-600",
  },
  suspicious: {
    color: "text-yellow-600 bg-yellow-50 border-yellow-200",
    icon: AlertTriangle,
    iconColor: "text-yellow-600",
  },
  forged: {
    color: "text-red-600 bg-red-50 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-600",
  },
  processing: {
    color: "text-gray-600 bg-gray-50 border-gray-200",
    icon: Clock,
    iconColor: "text-gray-600",
  },
} as const;

export default function DocumentAuth(): JSX.Element {
  const { toast } = useToast();

  // State management with better typing
  const [documents, setDocuments] = useState<readonly DocumentFile[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<readonly VerificationResult[]>([]);

  // Ref for file input with proper typing
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag state for visual feedback
  const [isDragOver, setIsDragOver] = useState(false);

  // Memoized utility functions to prevent unnecessary re-renders
  const generateId = useCallback((): string => {
    return `doc-${Date.now()}-${performance.now().toString(36)}`;
  }, []);

  // Enhanced file validation with better error handling
  const validateFile = useCallback(
    (file: File): boolean => {
      if (file.size > FILE_CONSTRAINTS.maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${FILE_CONSTRAINTS.maxSize / 1024 / 1024}MB limit`,
          variant: "destructive",
        });
        return false;
      }

      if (
        !FILE_CONSTRAINTS.allowedTypes.includes(
          file.type as (typeof FILE_CONSTRAINTS.allowedTypes)[number]
        )
      ) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported format (${FILE_CONSTRAINTS.allowedTypes.join(", ")})`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    },
    [toast]
  );

  // Optimized document addition with better error handling
  const addDocuments = useCallback(
    (fileList: FileList): void => {
      const validFiles: DocumentFile[] = [];

      Array.from(fileList).forEach((file) => {
        if (validateFile(file)) {
          const docFile: DocumentFile = {
            file,
            id: generateId(),
          };

          // Generate preview for images with proper error handling
          if (file.type.startsWith("image/")) {
            const reader = new FileReader();

            reader.onload = (event: Event) => {
              const target = event.target as FileReader;
              const result = target?.result;
              if (typeof result === "string") {
                setDocuments((prev) =>
                  prev.map((doc) =>
                    doc.id === docFile.id ? { ...doc, preview: result } : doc
                  )
                );
              }
            };

            reader.onerror = () => {
              // Failed to generate preview - silently handle
            };

            reader.readAsDataURL(file);
          }

          validFiles.push(docFile);
        }
      });

      if (validFiles.length > 0) {
        setDocuments((prev) => [...prev, ...validFiles]);
      }
    },
    [validateFile, generateId]
  );

  // Memoized remove function to prevent unnecessary re-renders
  const removeDocument = useCallback((id: string): void => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    setResults((prev) => prev.filter((result) => result.id !== id));
  }, []);

  // Enhanced drag and drop handlers with visual feedback
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      const { files } = event.dataTransfer;
      if (files && files.length > 0) {
        addDocuments(files);
      }
    },
    [addDocuments]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();
      // Only set drag over to false if we're leaving the drop zone entirely
      if (!event.currentTarget.contains(event.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    },
    []
  );

  // File upload handler with input reset
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      const { files } = event.target;
      if (files && files.length > 0) {
        addDocuments(files);
      }
      // Reset input value to allow re-uploading same file
      event.target.value = "";
    },
    [addDocuments]
  );

  // Enhanced verification mutation with better error handling
  const verifyDocumentsMutation = useMutation<
    VerificationResponse,
    Error,
    readonly DocumentFile[]
  >({
    mutationFn: async (
      documentsToVerify: readonly DocumentFile[]
    ): Promise<VerificationResponse> => {
      const formData = new FormData();

      documentsToVerify.forEach((doc, index) => {
        formData.append("documents", doc.file);
        formData.append(`documentId_${index}`, doc.id);
      });

      try {
        const response = await fetch("/api/document-auth/verify", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ message: "Network error" }));
          throw new Error(
            errorData.message || `Server error: ${response.status}`
          );
        }

        return response.json();
      } catch (error) {
        // Log error in development mode only
        if (import.meta.env.MODE === "development") {
          // eslint-disable-next-line no-console
          console.error("Document verification failed:", error);
        }
        throw error;
      }
    },
    onSuccess: (data: VerificationResponse) => {
      const { results: verificationResults = [] } = data;
      setResults(verificationResults);
      setProgress(100);
      setIsVerifying(false);

      const authenticCount = verificationResults.filter(
        (result) => result.verified
      ).length;
      const totalCount = verificationResults.length;

      toast({
        title: "Verification Complete",
        description: `${authenticCount} of ${totalCount} documents verified as authentic`,
        variant: authenticCount === totalCount ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      setIsVerifying(false);
      setProgress(0);
      toast({
        title: "Verification Failed",
        description:
          error.message || "There was an error verifying your documents",
        variant: "destructive",
      });
    },
  });

  // Enhanced verification process with proper cleanup
  const startVerification = useCallback(async (): Promise<void> => {
    if (documents.length === 0) {
      toast({
        title: "No documents",
        description: "Please upload documents to verify",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    setProgress(0);
    setResults([]);

    // Simulate progress with proper cleanup
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const increment =
          ((performance.now() % 100) / 100) * PROGRESS_CONFIG.incrementRange;
        const newProgress = prev + increment;

        if (newProgress >= PROGRESS_CONFIG.maxProgress) {
          clearInterval(progressInterval);
          return PROGRESS_CONFIG.maxProgress;
        }

        return newProgress;
      });
    }, PROGRESS_CONFIG.interval);

    try {
      await verifyDocumentsMutation.mutateAsync(documents);
    } catch {
      // Error handling is managed by the mutation
    } finally {
      clearInterval(progressInterval);
    }
  }, [documents, toast, verifyDocumentsMutation]);

  // Memoized status utilities to prevent recalculation
  const getStatusConfig = useCallback(
    (status: VerificationResult["status"]) => {
      switch (status) {
        case "authentic":
          return STATUS_CONFIG.authentic;
        case "suspicious":
          return STATUS_CONFIG.suspicious;
        case "forged":
          return STATUS_CONFIG.forged;
        case "processing":
          return STATUS_CONFIG.processing;
        default:
          return STATUS_CONFIG.processing;
      }
    },
    []
  );

  // Memoized file size formatter
  const formatFileSize = useMemo(() => {
    return (bytes: number): string => {
      return (bytes / 1024 / 1024).toFixed(2);
    };
  }, []);

  // Helper function to get upload area classes
  const getUploadAreaClasses = useCallback(
    (isLarge: boolean) => {
      const baseClasses =
        isLarge ?
          "relative border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer min-h-[200px] flex flex-col items-center justify-center p-8 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        : "border-2 border-dashed rounded-xl p-4 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2";

      if (isDragOver) {
        return `${baseClasses} border-primary bg-primary/5 ${isLarge ? "scale-[1.02] shadow-lg" : ""}`;
      }
      if (isVerifying) {
        return `${baseClasses} border-gray-200 bg-gray-50 cursor-not-allowed`;
      }
      return `${baseClasses} border-gray-300 hover:border-primary/70 hover:bg-primary/5 ${isLarge ? "hover:shadow-md" : ""}`;
    },
    [isDragOver, isVerifying]
  );

  // Helper function to handle upload click
  const handleUploadClick = useCallback(() => {
    if (!isVerifying && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isVerifying]);

  // Helper function to handle keyboard events
  const handleUploadKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === "Enter" || e.key === " ") && !isVerifying) {
        e.preventDefault();
        fileInputRef.current?.click();
      }
    },
    [isVerifying]
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Minimal Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Document Authentication</h1>
          </div>
        </div>
      </header>

      {/* Chat-like Interface */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Welcome Message */}
        {documents.length === 0 && results.length === 0 && !isVerifying && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4">
                Verify Your Documents with AI
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Upload your documents and I'll analyze them for
                authenticity using advanced AI detection.
              </p>

              {/* Quick Start Examples */}
              <div className="grid md:grid-cols-3 gap-4 mb-8">
                <div className="p-4 border rounded-lg text-left">
                  <FileText className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium text-sm">Title Deeds</p>
                  <p className="text-xs text-muted-foreground">
                    Verify land ownership documents
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-left">
                  <FileText className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium text-sm">Contracts</p>
                  <p className="text-xs text-muted-foreground">
                    Check legal agreements
                  </p>
                </div>
                <div className="p-4 border rounded-lg text-left">
                  <FileText className="w-6 h-6 text-primary mb-2" />
                  <p className="font-medium text-sm">Certificates</p>
                  <p className="text-xs text-muted-foreground">
                    Validate official documents
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Document Messages */}
          {documents.map((doc) => (
            <div key={doc.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-medium text-blue-600">You</span>
              </div>
              <div className="flex-1">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 max-w-md">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">{doc.file.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file.size)} MB • {doc.file.type}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-6 px-2 text-xs"
                    onClick={() => removeDocument(doc.id)}
                    disabled={isVerifying}
                  >
                    <X className="w-3 h-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Processing Message */}
          {isVerifying && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <div className="bg-card border rounded-lg p-4 max-w-2xl">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                    <span className="font-medium">
                      Analyzing your documents...
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Running AI verification checks</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results Messages */}
          {results.map((result) => {
            const statusConfig = getStatusConfig(result.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div key={result.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="bg-card border rounded-lg p-4 max-w-2xl">
                    <div className="flex items-center gap-2 mb-3">
                      <StatusIcon
                        className={`w-5 h-5 ${statusConfig.iconColor}`}
                      />
                      <span className="font-medium">{result.filename}</span>
                      <span className="text-sm text-muted-foreground ml-auto">
                        {result.confidence}% confidence
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm">
                        <span className="font-medium">Document Type:</span>{" "}
                        {result.documentType}
                      </p>

                      {/* Verification Checks */}
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(result.checks).map(([check, data]) => (
                          <div
                            key={check}
                            className="flex items-center gap-2 text-sm"
                          >
                            {data.passed ?
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            : <AlertTriangle className="w-4 h-4 text-red-500" />
                            }
                            <span className="capitalize">
                              {check}: {data.score}%
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Issues */}
                      {result.issues.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2 text-red-600">
                            Issues Found:
                          </p>
                          <ul className="text-sm space-y-1">
                            {result.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{issue}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {result.recommendations.length > 0 && (
                        <div>
                          <p className="font-medium text-sm mb-2 text-blue-600">
                            Recommendations:
                          </p>
                          <ul className="text-sm space-y-1">
                            {result.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Processed in {result.processingTime}ms
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download Report
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Large Upload Area */}
        <div className="border-t bg-card/50 backdrop-blur-sm p-6">
          <div className="max-w-4xl mx-auto">
            {
              documents.length === 0 ?
                // Large prominent upload area when no documents
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload documents by clicking or dragging files here"
                  className={getUploadAreaClasses(true)}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleUploadClick}
                  onKeyDown={handleUploadKeyDown}
                >
                  <div className="text-center space-y-4">
                    <div
                      className={`
                      w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors
                      ${
                        isDragOver ? "bg-primary/20" : (
                          "bg-primary/10 group-hover:bg-primary/20"
                        )
                      }
                    `}
                    >
                      <Upload
                        className={`
                        w-8 h-8 transition-colors
                        ${isDragOver ? "text-primary" : "text-primary/70"}
                      `}
                      />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">
                        {isDragOver ?
                          "Drop your documents here"
                        : "Upload Documents to Verify"}
                      </h3>
                      <p className="text-muted-foreground text-lg">
                        {isDragOver ?
                          "Release to upload your files"
                        : "Drag and drop files here, or click to browse"}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
                      <span className="px-3 py-1 bg-background rounded-full border">
                        PDF
                      </span>
                      <span className="px-3 py-1 bg-background rounded-full border">
                        JPG
                      </span>
                      <span className="px-3 py-1 bg-background rounded-full border">
                        PNG
                      </span>
                      <span className="px-3 py-1 bg-background rounded-full border">
                        Max 10MB
                      </span>
                    </div>

                    <Button
                      size="lg"
                      className="mt-4"
                      disabled={isVerifying}
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Choose Files
                    </Button>
                  </div>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                  />
                </div>
                // Compact upload area when documents exist
              : <div className="space-y-4">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label="Add more documents by clicking or dragging files here"
                    className={getUploadAreaClasses(false)}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleUploadClick}
                    onKeyDown={handleUploadKeyDown}
                  >
                    <div className="flex items-center justify-center gap-3 py-2">
                      <Upload className="w-5 h-5 text-primary" />
                      <span className="font-medium">
                        {isDragOver ?
                          "Drop more documents here"
                        : "Add more documents"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isVerifying}
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                      >
                        Browse
                      </Button>
                    </div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={startVerification}
                      disabled={isVerifying}
                      size="lg"
                      className="px-8"
                    >
                      {isVerifying ?
                        <>
                          <Zap className="w-5 h-5 mr-2 animate-pulse" />
                          Analyzing {documents.length} document
                          {documents.length > 1 ? "s" : ""}...
                        </>
                      : <>
                          <Send className="w-5 h-5 mr-2" />
                          Verify {documents.length} Document
                          {documents.length > 1 ? "s" : ""}
                        </>
                      }
                    </Button>
                  </div>
                </div>

            }
          </div>
        </div>
      </main>
    </div>
  );
}
