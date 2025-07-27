import React, { useState, useCallback, useRef } from "react";
import {
  Upload,
  FileText,
  Shield,
  CheckCircle,
  AlertTriangle,
  X,
  Eye,
  Loader,
  Camera,
  Scan,
} from "lucide-react";

interface DocumentFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  status: "uploading" | "processing" | "verified" | "failed" | "suspicious";
  progress: number;
  verificationResult?: VerificationResult;
}

interface VerificationResult {
  id: string;
  documentId: string;
  overallScore: number;
  status: "authentic" | "suspicious" | "forged";
  confidence: number;
  checks: VerificationCheck[];
  metadata: DocumentMetadata;
  processedAt: Date;
  processingTime: number;
}

interface VerificationCheck {
  type: "metadata" | "visual" | "signature" | "content" | "format";
  name: string;
  status: "pass" | "fail" | "warning";
  score: number;
  description: string;
  details: string[];
}

interface DocumentMetadata {
  creationDate?: Date;
  modificationDate?: Date;
  author?: string;
  software?: string;
  version?: string;
  pageCount?: number;
  fileSize: number;
  hash: string;
  digitalSignature?: boolean;
}

const SUPPORTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export default function DocumentAuthentication(): JSX.Element {
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentFile | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        handleFiles(files);
      }
    },
    []
  );

  const handleFiles = useCallback((files: File[]) => {
    const validFiles = files.filter((file) => {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        // Show error notification for unsupported file type
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        // Show error notification for file too large
        return false;
      }
      return true;
    });

    const newDocuments: DocumentFile[] = validFiles.map((file) => ({
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadedAt: new Date(),
      status: "uploading",
      progress: 0,
    }));

    setDocuments((prev) => [...prev, ...newDocuments]);

    // Start processing each document
    newDocuments.forEach((doc) => {
      processDocument(doc);
    });
  }, []);

  const processDocument = async (document: DocumentFile) => {
    try {
      // Update status to processing
      updateDocumentStatus(document.id, "processing", 10);

      // Simulate file upload progress
      for (let progress = 20; progress <= 80; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateDocumentStatus(document.id, "processing", progress);
      }

      // Call document verification API
      const formData = new FormData();
      formData.append("document", document.file);
      formData.append("documentId", document.id);

      try {
        const response = await fetch("/api/documents/verify", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Verification failed");
        }

        const result: VerificationResult = await response.json();

        // Update document with verification result
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === document.id ?
              {
                ...doc,
                status: mapVerificationStatus(result.status),
                progress: 100,
                verificationResult: result,
              }
            : doc
          )
        );
      } catch (error) {
        console.error('Document verification failed:', error);
        // Update document with error status
        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === document.id ?
              {
                ...doc,
                status: 'error' as const,
                progress: 0,
                error: error instanceof Error ? error.message : 'Verification failed',
              }
            : doc
          )
        );
        throw error;
      }
    } catch (error) {
      updateDocumentStatus(document.id, "failed", 100);
    }
  };

  const updateDocumentStatus = (
    id: string,
    status: DocumentFile["status"],
    progress: number
  ) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, status, progress } : doc))
    );
  };

  const mapVerificationStatus = (
    status: VerificationResult["status"]
  ): DocumentFile["status"] => {
    switch (status) {
      case "authentic":
        return "verified";
      case "suspicious":
        return "suspicious";
      case "forged":
        return "failed";
      default:
        return "failed";
    }
  };

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    if (selectedDocument?.id === id) {
      setSelectedDocument(null);
    }
  };

  const getStatusIcon = (status: DocumentFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "suspicious":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: DocumentFile["status"]) => {
    switch (status) {
      case "verified":
        return "border-green-200 bg-green-50";
      case "suspicious":
        return "border-yellow-200 bg-yellow-50";
      case "failed":
        return "border-red-200 bg-red-50";
      case "processing":
        return "border-blue-200 bg-blue-50";
      default:
        return "border-gray-200 bg-gray-50";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-primary/10 rounded-full">
                <Shield className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Document Authentication
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Advanced AI-powered document verification to detect forgeries,
              alterations, and ensure authenticity. Upload your property
              documents for instant verification.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-trust-verified/10 px-4 py-2 rounded-full">
                <Scan className="w-5 h-5 text-trust-verified" />
                <span className="text-trust-verified font-medium">
                  AI-Powered Analysis
                </span>
              </div>
              <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-primary font-medium">
                  Metadata Verification
                </span>
              </div>
              <div className="flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
                <FileText className="w-5 h-5 text-secondary" />
                <span className="text-secondary font-medium">
                  Multi-Format Support
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Upload Area */}
        <section className="mb-12">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ?
                "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Upload Documents for Verification
            </h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop your documents here, or click to browse
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={SUPPORTED_TYPES.join(",")}
              onChange={handleFileInput}
              className="hidden"
              aria-label="File upload input"
            />
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Supported formats: PDF, JPEG, PNG, TIFF, DOC, DOCX</p>
              <p>Maximum file size: 50MB per file</p>
            </div>
          </div>
        </section>

        {/* Document List */}
        {documents.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">
              Document Verification Results
            </h2>
            <div className="grid gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`border rounded-lg p-6 ${getStatusColor(doc.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-white rounded-lg">
                        <FileText className="w-6 h-6 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {doc.name}
                          </h3>
                          {getStatusIcon(doc.status)}
                        </div>
                        <div className="text-sm text-muted-foreground mb-3">
                          <span>{formatFileSize(doc.size)}</span>
                          <span className="mx-2">•</span>
                          <span>
                            Uploaded {doc.uploadedAt.toLocaleTimeString()}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        {(doc.status === "uploading" ||
                          doc.status === "processing") && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>
                                {doc.status === "uploading" ?
                                  "Uploading..."
                                : "Processing..."}
                              </span>
                              <span>{doc.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${doc.progress}%` }}
                                role="progressbar"
                                aria-valuenow={doc.progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Document processing progress: ${doc.progress}%`}
                              />
                            </div>
                          </div>
                        )}

                        {/* Verification Results */}
                        {doc.verificationResult && (
                          <div className="space-y-3">
                            <div className="flex items-center gap-4">
                              <div className="text-sm">
                                <span className="font-medium">
                                  Overall Score:{" "}
                                </span>
                                <span
                                  className={`font-bold ${
                                    doc.verificationResult.overallScore >= 80 ?
                                      "text-green-600"
                                    : (
                                      doc.verificationResult.overallScore >= 60
                                    ) ?
                                      "text-yellow-600"
                                    : "text-red-600"
                                  }`}
                                >
                                  {doc.verificationResult.overallScore}/100
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">
                                  Confidence:{" "}
                                </span>
                                <span>
                                  {Math.round(
                                    doc.verificationResult.confidence * 100
                                  )}
                                  %
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">
                                  Processing Time:{" "}
                                </span>
                                <span>
                                  {doc.verificationResult.processingTime}ms
                                </span>
                              </div>
                            </div>

                            {/* Verification Checks Summary */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {doc.verificationResult.checks.map(
                                (check, index) => (
                                  <div
                                    key={index}
                                    className={`text-xs px-2 py-1 rounded-full text-center ${
                                      check.status === "pass" ?
                                        "bg-green-100 text-green-800"
                                      : check.status === "warning" ?
                                        "bg-yellow-100 text-yellow-800"
                                      : "bg-red-100 text-red-800"
                                    }`}
                                  >
                                    {check.name}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      {doc.verificationResult && (
                        <button
                          type="button"
                          onClick={() => setSelectedDocument(doc)}
                          className="p-2 text-gray-500 hover:text-primary transition-colors"
                          title="View Details"
                          aria-label="View document details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeDocument(doc.id)}
                        className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove"
                        aria-label="Remove document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Detailed Results Modal */}
        {selectedDocument && selectedDocument.verificationResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    Verification Details: {selectedDocument.name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedDocument(null)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                    aria-label="Close details modal"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Overall Status */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">
                    Overall Assessment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <div
                        className={`text-lg font-bold capitalize ${
                          (
                            selectedDocument.verificationResult.status ===
                            "authentic"
                          ) ?
                            "text-green-600"
                          : (
                            selectedDocument.verificationResult.status ===
                            "suspicious"
                          ) ?
                            "text-yellow-600"
                          : "text-red-600"
                        }`}
                      >
                        {selectedDocument.verificationResult.status}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Overall Score
                      </span>
                      <div className="text-lg font-bold">
                        {selectedDocument.verificationResult.overallScore}/100
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">
                        Confidence
                      </span>
                      <div className="text-lg font-bold">
                        {Math.round(
                          selectedDocument.verificationResult.confidence * 100
                        )}
                        %
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Checks */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Verification Checks
                  </h3>
                  <div className="space-y-4">
                    {selectedDocument.verificationResult.checks.map(
                      (check, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{check.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                Score: {check.score}/100
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  check.status === "pass" ?
                                    "bg-green-100 text-green-800"
                                  : check.status === "warning" ?
                                    "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                                }`}
                              >
                                {check.status}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {check.description}
                          </p>
                          {check.details.length > 0 && (
                            <ul className="text-sm space-y-1">
                              {check.details.map((detail, detailIndex) => (
                                <li
                                  key={detailIndex}
                                  className="flex items-start gap-2"
                                >
                                  <span className="text-muted-foreground">
                                    •
                                  </span>
                                  <span>{detail}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    Document Metadata
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">File Size:</span>
                        <span className="ml-2">
                          {formatFileSize(
                            selectedDocument.verificationResult.metadata
                              .fileSize
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Hash:</span>
                        <span className="ml-2 font-mono text-xs">
                          {selectedDocument.verificationResult.metadata.hash}
                        </span>
                      </div>
                      {selectedDocument.verificationResult.metadata.author && (
                        <div>
                          <span className="font-medium">Author:</span>
                          <span className="ml-2">
                            {
                              selectedDocument.verificationResult.metadata
                                .author
                            }
                          </span>
                        </div>
                      )}
                      {selectedDocument.verificationResult.metadata
                        .software && (
                        <div>
                          <span className="font-medium">Software:</span>
                          <span className="ml-2">
                            {
                              selectedDocument.verificationResult.metadata
                                .software
                            }
                          </span>
                        </div>
                      )}
                      {selectedDocument.verificationResult.metadata
                        .creationDate && (
                        <div>
                          <span className="font-medium">Created:</span>
                          <span className="ml-2">
                            {selectedDocument.verificationResult.metadata.creationDate.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {selectedDocument.verificationResult.metadata
                        .modificationDate && (
                        <div>
                          <span className="font-medium">Modified:</span>
                          <span className="ml-2">
                            {selectedDocument.verificationResult.metadata.modificationDate.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <section className="mt-16 py-12 bg-muted/30 rounded-2xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              How Document Authentication Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our advanced AI system performs multiple layers of analysis to
              ensure document authenticity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 px-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-primary/10 rounded-full">
                  <Scan className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Metadata Analysis
              </h3>
              <p className="text-muted-foreground">
                Examines file creation dates, software signatures, and digital
                fingerprints to detect tampering.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <Camera className="w-8 h-8 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Visual Inspection
              </h3>
              <p className="text-muted-foreground">
                AI-powered image analysis detects alterations, inconsistencies,
                and signs of digital manipulation.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-accent/10 rounded-full">
                  <Shield className="w-8 h-8 text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                Authenticity Score
              </h3>
              <p className="text-muted-foreground">
                Combines all analysis results into a comprehensive authenticity
                score with detailed explanations.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
