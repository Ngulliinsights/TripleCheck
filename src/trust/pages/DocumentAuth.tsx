import React, { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  Shield,
  X,
  Eye,
  Download,
  Clock,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Progress } from "@/shared/components/ui/progress";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/use-toast";
import FileUpload from "../../shared/components/forms/FileUpload";

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

  // Memoized utility functions to prevent unnecessary re-renders
  const generateId = useCallback((): string => {
    return Math.random().toString(36).substring(2, 11); // More consistent length
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
            const reader = new (window as any).FileReader();

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

  // Enhanced drag and drop handler with better error handling
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      event.stopPropagation();

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
        console.error('Document verification failed:', error);
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
        const increment = Math.random() * PROGRESS_CONFIG.incrementRange;
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
    } catch (error) {
      // Error handling is managed by the mutation
    } finally {
      clearInterval(progressInterval);
    }
  }, [documents, toast, verifyDocumentsMutation]);

  // Memoized status utilities to prevent recalculation
  const getStatusConfig = useMemo(() => {
    return (status: VerificationResult["status"]) => STATUS_CONFIG[status];
  }, []);

  // Memoized document statistics
  const documentStats = useMemo(() => {
    const authenticCount = results.filter((result) => result.verified).length;
    const totalCount = results.length;
    const hasResults = totalCount > 0;

    return { authenticCount, totalCount, hasResults };
  }, [results]);

  // Memoized file size formatter
  const formatFileSize = useMemo(() => {
    return (bytes: number): string => {
      return (bytes / 1024 / 1024).toFixed(2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with improved semantic structure */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg" aria-hidden="true">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Document Authentication
              </h1>
              <p className="text-muted-foreground">
                Verify document authenticity using AI-powered analysis
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Section with improved accessibility */}
          <section className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" aria-hidden="true" />
                  Upload Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isVerifying ?
                      "border-gray-200 bg-gray-50"
                    : "border-gray-300 hover:border-primary/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  role="button"
                  tabIndex={0}
                  aria-label="Drop files here to upload"
                >
                  <Upload
                    className="w-12 h-12 mx-auto mb-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drag and drop your documents here, or
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isVerifying}
                      aria-label="Browse files to upload"
                    >
                      Browse Files
                    </Button>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      aria-label="File input"
                      aria-describedby="file-upload-help"
                    />
                    <div id="file-upload-help" className="sr-only">
                      Upload PDF, JPG, or PNG files. Maximum size 10MB each.
                    </div>
                    <p className="text-xs text-muted-foreground">
                      PDF, JPG, PNG • Max{" "}
                      {FILE_CONSTRAINTS.maxSize / 1024 / 1024}MB each
                    </p>
                  </div>
                </div>

                {/* Document List with improved accessibility */}
                {documents.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium">
                      Uploaded Documents ({documents.length})
                    </h4>
                    <div className="space-y-2" role="list">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                          role="listitem"
                        >
                          <FileText
                            className="w-4 h-4 text-muted-foreground flex-shrink-0"
                            aria-hidden="true"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              title={doc.file.name}
                            >
                              {doc.file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc.file.size)} MB
                            </p>
                          </div>
                          {doc.preview && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-auto"
                              aria-label={`Preview ${doc.file.name}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto text-muted-foreground hover:text-destructive"
                            onClick={() => removeDocument(doc.id)}
                            disabled={isVerifying}
                            aria-label={`Remove ${doc.file.name}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verify Button with improved state management */}
                {documents.length > 0 && (
                  <div className="mt-6">
                    <Button
                      onClick={startVerification}
                      disabled={isVerifying}
                      className="w-full"
                      size="lg"
                      aria-describedby={
                        isVerifying ? "verification-progress" : undefined
                      }
                    >
                      {isVerifying ?
                        <>
                          <Zap
                            className="w-4 h-4 mr-2 animate-pulse"
                            aria-hidden="true"
                          />
                          Verifying Documents...
                        </>
                      : <>
                          <Shield className="w-4 h-4 mr-2" aria-hidden="true" />
                          Verify Documents
                        </>
                      }
                    </Button>
                  </div>
                )}

                {/* Progress with improved accessibility */}
                {isVerifying && (
                  <div className="mt-4 space-y-2" id="verification-progress">
                    <div className="flex items-center justify-between text-sm">
                      <span>Analyzing documents...</span>
                      <span
                        aria-label={`${Math.round(progress)} percent complete`}
                      >
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2"
                      aria-label="Verification progress"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Results Section with improved structure */}
          <section className="space-y-6">
            {documentStats.hasResults && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" aria-hidden="true" />
                    Verification Results
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.map((result) => {
                    const statusConfig = getStatusConfig(result.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <article
                        key={result.id}
                        className={`border rounded-lg p-4 ${statusConfig.color}`}
                        aria-labelledby={`result-${result.id}-title`}
                      >
                        <div className="flex items-start gap-3">
                          <StatusIcon
                            className={`w-5 h-5 ${statusConfig.iconColor}`}
                            aria-hidden="true"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4
                                id={`result-${result.id}-title`}
                                className="font-medium"
                              >
                                {result.filename}
                              </h4>
                              <span
                                className="text-sm font-medium"
                                aria-label={`${result.confidence} percent confidence`}
                              >
                                {result.confidence}% confidence
                              </span>
                            </div>

                            <p className="text-sm mb-3">
                              Document Type: {result.documentType}
                            </p>

                            {/* Verification Checks with improved accessibility */}
                            <div
                              className="grid grid-cols-2 gap-2 mb-3"
                              role="list"
                              aria-label="Verification checks"
                            >
                              {Object.entries(result.checks).map(
                                ([check, data]) => (
                                  <div
                                    key={check}
                                    className="flex items-center gap-2 text-xs"
                                    role="listitem"
                                  >
                                    {data.passed ?
                                      <CheckCircle
                                        className="w-3 h-3 text-green-500"
                                        aria-label="Passed"
                                      />
                                    : <AlertTriangle
                                        className="w-3 h-3 text-red-500"
                                        aria-label="Failed"
                                      />
                                    }
                                    <span className="capitalize">
                                      {check}: {data.score}%
                                    </span>
                                  </div>
                                )
                              )}
                            </div>

                            {/* Issues with improved structure */}
                            {result.issues.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-1">
                                  Issues Found:
                                </p>
                                <ul className="text-xs space-y-1" role="list">
                                  {result.issues.map((issue, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-1"
                                      role="listitem"
                                    >
                                      <span
                                        className="text-red-500 flex-shrink-0"
                                        aria-hidden="true"
                                      >
                                        •
                                      </span>
                                      <span>{issue}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Recommendations with improved structure */}
                            {result.recommendations.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium mb-1">
                                  Recommendations:
                                </p>
                                <ul className="text-xs space-y-1" role="list">
                                  {result.recommendations.map((rec, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start gap-1"
                                      role="listitem"
                                    >
                                      <span
                                        className="text-blue-500 flex-shrink-0"
                                        aria-hidden="true"
                                      >
                                        •
                                      </span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                Processed in {result.processingTime}ms
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                                aria-label={`Download report for ${result.filename}`}
                              >
                                <Download
                                  className="w-3 h-3 mr-1"
                                  aria-hidden="true"
                                />
                                Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* Info Card with improved semantic structure */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-xs font-bold text-primary"
                      aria-label="Step 1"
                    >
                      1
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Metadata Analysis</p>
                    <p className="text-muted-foreground">
                      Examines file creation data, software signatures, and
                      modification history
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-xs font-bold text-primary"
                      aria-label="Step 2"
                    >
                      2
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Visual Inspection</p>
                    <p className="text-muted-foreground">
                      AI detects digital manipulation, inconsistencies, and
                      forgery patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span
                      className="text-xs font-bold text-primary"
                      aria-label="Step 3"
                    >
                      3
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Content Verification</p>
                    <p className="text-muted-foreground">
                      Validates document structure, fonts, and formatting
                      consistency
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
