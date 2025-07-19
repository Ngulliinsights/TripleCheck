# 🔄 Hybrid Verification API Documentation

## Overview: Community-First with Secure Document Fallback

TripleCheck now implements a **hybrid verification system** that prioritizes community-based trust while offering ultra-secure document verification for users who prefer it.

### **🎯 Verification Priority System**

```
PRIMARY (90% of users):   Community Trust → Behavioral AI → Social Proof → Transaction Ready
SECONDARY (10% of users): Community Trust → Secure Documents → Physical Verification → High-Value Transactions
```

---

## 🏘️ **PRIMARY: Community Trust API**

### **Base URL**: `/api/community`

All community trust endpoints prioritize social verification over document verification.

### **1. Community References**

#### **Add Community Reference**
```http
POST /api/community/references
Content-Type: application/json
Authorization: Session-based

{
  "referenceType": "neighbor" | "church_member" | "colleague" | "family" | "business_partner",
  "referenceName": "John Kamau",
  "referencePhone": "+254712345678",
  "relationship": "We have been neighbors for 3 years and he is very trustworthy",
  "yearsKnown": 3,
  "trustRating": 8,
  "notes": "Always helpful and reliable in community matters"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Community reference added successfully",
  "data": {
    "referenceId": 123,
    "verificationStatus": "pending",
    "nextSteps": [
      "Your reference will receive an SMS verification",
      "Verification typically takes 24-48 hours",
      "You can add more references to increase your trust score"
    ]
  }
}
```

#### **Get Community References**
```http
GET /api/community/references
```

**Response:**
```json
{
  "success": true,
  "data": {
    "references": [
      {
        "id": 123,
        "referenceType": "neighbor",
        "referenceName": "John Kamau",
        "relationship": "We have been neighbors for 3 years",
        "yearsKnown": 3,
        "trustRating": 8,
        "verificationStatus": "verified",
        "verifiedAt": "2025-01-15T10:30:00Z",
        "createdAt": "2025-01-10T14:20:00Z"
      }
    ],
    "summary": {
      "totalReferences": 3,
      "verifiedReferences": 2,
      "pendingReferences": 1,
      "averageTrustRating": 7.8
    },
    "recommendations": [
      "Add references from different relationship types",
      "Follow up with pending references for verification"
    ]
  }
}
```

### **2. Community Endorsements**

#### **Add Community Endorsement**
```http
POST /api/community/endorsements
Content-Type: application/json

{
  "endorserType": "church_leader" | "local_chief" | "business_association" | "womens_group" | "youth_group",
  "endorserName": "Pastor Michael Wanjiku",
  "endorserTitle": "Senior Pastor",
  "endorserContact": "+254722334455",
  "endorsementLevel": 9,
  "endorsementReason": "Active church member for 5 years, leads youth ministry, very trustworthy"
}
```

### **3. Location Trust**

#### **Update Location Trust**
```http
PUT /api/community/location-trust
Content-Type: application/json

{
  "area": "Kilimani",
  "city": "Nairobi",
  "yearsInArea": 5,
  "localKnowledge": "I know this area very well. There's Yaya Centre for shopping, several good schools like Brookhouse, and the area is well-connected with matatus to town. The neighborhood is safe and has good infrastructure.",
  "localBusinessOwner": true,
  "communityInvolvement": "Member of Kilimani Residents Association, volunteer at local dispensary"
}
```

### **4. Trust Score**

#### **Get Comprehensive Trust Score**
```http
GET /api/community/trust-score
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallScore": 650,
    "trustLevel": "verified",
    "maxTransactionValue": 500000,
    "riskLevel": "low",
    "scoreBreakdown": {
      "community": 75,
      "behavior": 68,
      "social": 45,
      "location": 82,
      "endorsement": 90,
      "transaction": 30
    },
    "trustLevelInfo": {
      "current": "verified",
      "requirements": ["successful_transactions_5+", "social_connections_10+"],
      "benefits": [
        "Maximum transaction value: KES 500,000",
        "Access to community-verified listings",
        "Priority customer support",
        "Reduced verification requirements"
      ]
    },
    "lastCalculated": "2025-01-17T15:30:00Z",
    "nextRecalculation": "2025-01-18T15:30:00Z"
  }
}
```

---

## 🔒 **SECONDARY: Secure Document API**

### **Base URL**: `/api/documents`

Ultra-secure document verification for users comfortable with document upload.

### **Security Features**
- ✅ **End-to-end encryption** with user-provided password
- ✅ **Zero-knowledge architecture** - we never see unencrypted documents
- ✅ **Automatic deletion** after 30 minutes
- ✅ **Audit logging** for compliance
- ✅ **Rate limiting** - max 5 uploads per day

### **1. Document Upload**

#### **Upload Secure Document**
```http
POST /api/documents/upload
Content-Type: multipart/form-data
Rate-Limited: 5 uploads/day

Form Data:
- document: [FILE] (JPEG, PNG, PDF only, max 10MB)
- documentType: "national_id" | "title_deed" | "bank_statement" | "utility_bill" | "other"
- userPassword: "your-strong-encryption-password"
- purpose: "Property verification for transaction #12345"
- consentAcknowledged: true
```

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded securely and verification started",
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "expiresAt": "2025-01-17T16:30:00Z",
    "verificationStatus": "processing",
    "securityFeatures": {
      "encrypted": true,
      "autoDelete": true,
      "auditLogged": true,
      "zeroKnowledge": true
    }
  }
}
```

### **2. Document Status**

#### **Check Document Status**
```http
GET /api/documents/{documentId}/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "documentId": "550e8400-e29b-41d4-a716-446655440000",
    "documentType": "national_id",
    "uploadedAt": "2025-01-17T16:00:00Z",
    "expiresAt": "2025-01-17T16:30:00Z",
    "verificationStatus": "verified",
    "verificationResults": {
      "isAuthentic": true,
      "confidence": 92,
      "riskIndicators": [],
      "recommendations": ["Document appears authentic and complete"]
    },
    "timeRemaining": 1200000
  }
}
```

### **3. Document Security Info**

#### **Get Security Information**
```http
GET /api/documents/security-info
```

**Response:**
```json
{
  "success": true,
  "data": {
    "securityFeatures": {
      "endToEndEncryption": true,
      "zeroKnowledgeArchitecture": true,
      "automaticDeletion": true,
      "auditLogging": true,
      "accessControl": true,
      "rateLimit": true
    },
    "policies": {
      "maxFileSize": "10MB",
      "allowedTypes": ["image/jpeg", "image/png", "application/pdf"],
      "autoDeleteMinutes": 30,
      "maxUploadsPerDay": 5,
      "auditRetentionDays": 90
    },
    "recommendations": [
      "Only upload documents when absolutely necessary",
      "Use a strong, unique password for encryption",
      "Delete documents immediately after verification",
      "Never share your document password with anyone",
      "Ensure you are on a secure, private network"
    ]
  }
}
```

---

## 🤝 **PHYSICAL VERIFICATION API**

### **Base URL**: `/api/community/physical-verification`

For high-value transactions requiring in-person verification.

### **1. Request Physical Verification**

```http
POST /api/community/physical-verification
Content-Type: application/json

{
  "targetUserId": 456,
  "propertyId": 789,
  "transactionValue": 2000000,
  "verificationType": "in_person_meeting" | "agent_verification" | "document_check",
  "requestReason": "High-value property transaction requires additional verification",
  "meetingLocation": "Yaya Centre, Kilimani - Public area",
  "scheduledAt": "2025-01-20T14:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Physical verification request submitted",
  "data": {
    "requestId": 789,
    "status": "pending",
    "nextSteps": [
      "The other party will be notified of your verification request",
      "They can accept or decline the request",
      "If accepted, you can coordinate meeting details",
      "Verification must be completed before transaction"
    ],
    "estimatedCost": 0
  }
}
```

---

## 🎯 **API Usage Patterns**

### **Typical User Journey - Community First**

```javascript
// 1. User starts with community verification
const addReference = await fetch('/api/community/references', {
  method: 'POST',
  body: JSON.stringify({
    referenceType: 'neighbor',
    referenceName: 'John Kamau',
    referencePhone: '+254712345678',
    relationship: 'Neighbor for 3 years',
    yearsKnown: 3,
    trustRating: 8
  })
});

// 2. Check trust score
const trustScore = await fetch('/api/community/trust-score');

// 3. If trust score sufficient, proceed with transaction
// 4. If not sufficient, add more references or endorsements

// 5. Only for high-value transactions, request physical verification
if (transactionValue > 1000000) {
  const physicalVerification = await fetch('/api/community/physical-verification', {
    method: 'POST',
    body: JSON.stringify({
      targetUserId: otherUserId,
      transactionValue: 2000000,
      verificationType: 'in_person_meeting'
    })
  });
}
```

### **Alternative Journey - Document Verification**

```javascript
// Only for users comfortable with document upload
const documentUpload = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData // Contains encrypted document
});

// Check verification status
const status = await fetch(`/api/documents/${documentId}/status`);

// Document auto-deletes after 30 minutes
```

---

## 🔐 **Security Considerations**

### **Community Trust Security**
- ✅ **SMS Verification** for all references
- ✅ **Rate Limiting** to prevent spam
- ✅ **Cross-validation** of reference information
- ✅ **Behavioral Analysis** to detect fake references

### **Document Security**
- ✅ **AES-256-GCM Encryption** with user password
- ✅ **PBKDF2** key derivation (100,000 iterations)
- ✅ **Zero-knowledge** - server never sees unencrypted data
- ✅ **Automatic deletion** after 30 minutes
- ✅ **Audit trails** for compliance
- ✅ **File type validation** and size limits

### **API Security**
- ✅ **Session-based authentication**
- ✅ **Rate limiting** on all endpoints
- ✅ **Input validation** with Zod schemas
- ✅ **CORS protection**
- ✅ **Helmet security headers**

---

## 📊 **Trust Level System**

| Trust Level | Score Range | Max Transaction | Requirements |
|-------------|-------------|-----------------|--------------|
| **Newcomer** | 0-199 | KES 50,000 | Phone verified, profile complete |
| **Community** | 200-399 | KES 200,000 | 2+ community references, behavior score 6+ |
| **Verified** | 400-699 | KES 500,000 | 5+ successful transactions, 10+ social connections |
| **Premium** | 700-899 | KES 2,000,000 | Community endorsement, location trust 8+, behavior 8+ |
| **Champion** | 900-1000 | KES 10,000,000 | Multiple endorsements, 50+ transactions, zero flags |

---

## 🚀 **Implementation Benefits**

### **For Users**
- ✅ **No sensitive documents required** for most transactions
- ✅ **Build trust gradually** through community connections
- ✅ **Cultural alignment** with Kenyan trust networks
- ✅ **Optional document verification** for those who prefer it
- ✅ **Ultra-secure** document handling when needed

### **For Platform**
- ✅ **Higher adoption** due to community-first approach
- ✅ **Reduced liability** from document storage
- ✅ **Better fraud detection** through behavioral analysis
- ✅ **Scalable trust system** that grows with users
- ✅ **Compliance ready** with audit trails

### **For Market**
- ✅ **Culturally appropriate** for Kenyan market
- ✅ **Addresses real trust issues** in real estate
- ✅ **AI-powered intelligence** without document dependency
- ✅ **Enterprise-grade security** when documents are needed
- ✅ **Progressive trust building** from small to large transactions

This hybrid approach makes TripleCheck **actually usable** in the Kenyan market while maintaining the AI sophistication and security standards needed for enterprise adoption! 🚀