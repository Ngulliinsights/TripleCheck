# TripleCheck Land Verification API

## Overview
The TripleCheck API provides programmatic access to Kenya's most advanced land verification system. Integrate property verification, fraud detection, and document authentication into your applications.

## Base URL
```
Production: https://api.triplecheck.co.ke/v1
Sandbox: https://sandbox-api.triplecheck.co.ke/v1
```

## Authentication
All API requests require an API key in the header:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Land Verification

#### Start Verification
```http
POST /land-verification/verify
Content-Type: application/json

{
  "propertyId": "LR123456",
  "documents": [
    {
      "type": "title_deed",
      "url": "https://example.com/deed.pdf"
    }
  ],
  "location": {
    "latitude": -1.2921,
    "longitude": 36.8219
  },
  "webhookUrl": "https://yourapp.com/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "verificationId": "ver_123abc",
  "status": "initiated",
  "riskScore": null,
  "estimatedCompletion": "2024-01-15T10:00:00Z"
}
```

#### Check Status
```http
GET /land-verification/status?id=ver_123abc
```

**Response:**
```json
{
  "verificationId": "ver_123abc",
  "status": "completed",
  "progress": 100,
  "results": {
    "riskScore": 0.15,
    "ownership": "verified",
    "encumbrances": "none",
    "recommendations": ["proceed_with_transaction"]
  }
}
```

### Fraud Detection

#### Analyze Documents
```http
POST /fraud-detection/analyze
Content-Type: application/json

{
  "documents": [
    {
      "type": "title_deed",
      "content": "base64_encoded_content"
    }
  ],
  "metadata": {
    "propertyId": "LR123456",
    "transactionValue": 5000000
  }
}
```

**Response:**
```json
{
  "riskScore": 0.23,
  "indicators": ["document_age_mismatch"],
  "confidence": 0.87,
  "recommendations": ["verify_with_registry"]
}
```

### Document Authentication

#### Authenticate Document
```http
POST /document-auth/authenticate
Content-Type: multipart/form-data

document: [file]
```

**Response:**
```json
{
  "authentic": true,
  "confidence": 0.94,
  "analysis": {
    "visual": "passed",
    "metadata": "passed",
    "signature": "passed"
  }
}
```

## Webhooks

When verification is complete, we'll POST to your webhook URL:

```json
{
  "verificationId": "ver_123abc",
  "status": "completed",
  "results": {
    "riskScore": 0.15,
    "ownership": "verified",
    "recommendations": ["proceed_with_transaction"]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Handling

All errors return a consistent format:

```json
{
  "success": false,
  "error": "invalid_property_id",
  "message": "The provided property ID is not valid",
  "code": 400
}
```

## Rate Limits

- 100 requests per minute for verification endpoints
- 1000 requests per minute for status checks
- Contact us for higher limits

## Pricing

- **Pay-per-use**: $3 per verification
- **Starter**: $500/month (1,000 verifications included)
- **Professional**: $1,500/month (5,000 verifications included)
- **Enterprise**: Custom pricing for unlimited usage

## SDKs

- JavaScript/Node.js: `npm install @triplecheck/api`
- Python: `pip install triplecheck-api`
- PHP: `composer require triplecheck/api`

## Support

- Email: api-support@triplecheck.co.ke
- Documentation: https://docs.triplecheck.co.ke
- Status Page: https://status.triplecheck.co.ke
