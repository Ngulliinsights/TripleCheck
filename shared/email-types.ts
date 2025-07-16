// Email service types and interfaces for TripleCheck
export interface EmailMessage {
  id: string;
  from: {
    email: string;
    name: string;
  };
  to: {
    email: string;
    name?: string;
  };
  subject: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  labels?: string[];
  threadId?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  data?: string; // base64 encoded
}

export interface EmailSendRequest {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  replyToMessageId?: string;
}

export interface EmailServiceConfig {
  provider: 'mock' | 'gmail' | 'outlook' | 'sendgrid';
  credentials?: {
    // Gmail OAuth2
    clientId?: string;
    clientSecret?: string;
    refreshToken?: string;
    accessToken?: string;
    
    // Outlook OAuth2
    tenantId?: string;
    
    // SendGrid
    apiKey?: string;
    
    // SMTP (generic)
    host?: string;
    port?: number;
    secure?: boolean;
    username?: string;
    password?: string;
  };
  settings?: {
    maxMessages?: number;
    syncInterval?: number;
    autoMarkAsRead?: boolean;
  };
}

export interface EmailService {
  // Initialize the service with configuration
  initialize(config: EmailServiceConfig): Promise<void>;
  
  // Fetch messages from inbox
  getMessages(limit?: number, pageToken?: string): Promise<{
    messages: EmailMessage[];
    nextPageToken?: string;
  }>;
  
  // Get a specific message by ID
  getMessage(messageId: string): Promise<EmailMessage | null>;
  
  // Send a new email
  sendEmail(request: EmailSendRequest): Promise<string>; // returns message ID
  
  // Reply to an existing email
  replyToEmail(messageId: string, body: string, isHtml?: boolean): Promise<string>;
  
  // Mark message as read/unread
  markAsRead(messageId: string, isRead: boolean): Promise<void>;
  
  // Archive/unarchive message
  archiveMessage(messageId: string, archive: boolean): Promise<void>;
  
  // Delete message
  deleteMessage(messageId: string): Promise<void>;
  
  // Search messages
  searchMessages(query: string, limit?: number): Promise<EmailMessage[]>;
  
  // Get service status
  getStatus(): Promise<{
    connected: boolean;
    lastSync?: Date;
    error?: string;
  }>;
}

// Property inquiry specific types
export interface PropertyInquiry extends EmailMessage {
  propertyId?: number;
  propertyTitle?: string;
  propertyLocation?: string;
  propertyPrice?: number;
  inquiryType: 'viewing_request' | 'offer' | 'complaint' | 'general_inquiry';
  priority: 'low' | 'medium' | 'high';
  senderPhone?: string;
}

export interface InquiryClassificationResult {
  inquiryType: PropertyInquiry['inquiryType'];
  priority: PropertyInquiry['priority'];
  extractedData: {
    propertyId?: number;
    propertyTitle?: string;
    propertyLocation?: string;
    propertyPrice?: number;
    senderPhone?: string;
  };
  confidence: number;
}