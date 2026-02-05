// Trust and fraud detection types

export interface DocumentVerificationResult {
  id: string;
  documentId: string;
  verificationStatus: 'verified' | 'pending' | 'failed' | 'suspicious';
  confidence: number;
  riskScore: number;
  findings: DocumentFinding[];
  metadata: DocumentMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFinding {
  type: 'authenticity' | 'tampering' | 'forgery' | 'inconsistency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string[];
  confidence: number;
}

export interface DocumentMetadata {
  fileSize: number;
  fileType: string;
  dimensions?: {
    width: number;
    height: number;
  };
  checksum: string;
  uploadedAt: Date;
}

export interface TrustScore {
  overall: number;
  components: {
    documentVerification: number;
    communityFeedback: number;
    transactionHistory: number;
    expertValidation: number;
  };
  lastUpdated: Date;
}

export interface FraudAlert {
  id: string;
  propertyId: string;
  alertType: 'duplicate_listing' | 'suspicious_pricing' | 'document_fraud' | 'identity_theft';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  createdAt: Date;
  resolvedAt?: Date | undefined;
}