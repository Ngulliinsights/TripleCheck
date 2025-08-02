# TripleCheck Email Service

A comprehensive, production-ready email service with intelligent fallback mechanisms for the TripleCheck Kenya land verification platform.

## 🌟 Features

### ✅ **Multiple Provider Support**
- **SMTP** - Production-ready with Gmail, Outlook, or custom SMTP servers
- **SendGrid** - High-volume transactional email service
- **Gmail API** - OAuth2 integration (placeholder for future implementation)
- **Outlook API** - Microsoft Graph integration (placeholder for future implementation)
- **Mock Service** - Full-featured mock for development and testing

### ✅ **Intelligent Fallback System**
- Automatic provider selection based on availability
- Graceful degradation when services are unavailable
- Email queuing for later delivery when services recover
- Comprehensive error handling and logging

### ✅ **Professional Email Templates**
- Welcome emails for new users
- Password reset notifications
- Property inquiry notifications
- Land verification status updates
- Responsive HTML design with TripleCheck branding

### ✅ **Advanced Features**
- Property inquiry classification and extraction
- Email inbox management (for supported providers)
- Message archiving and read status tracking
- Comprehensive service status monitoring
- Batch email processing

## 🚀 Quick Start

### 1. Installation

The email service uses dynamic imports to handle optional dependencies gracefully:

```bash
# For SMTP support (recommended)
npm install nodemailer
npm install @types/nodemailer --save-dev

# For SendGrid support (optional)
npm install @sendgrid/mail
```

### 2. Environment Configuration

Copy the example configuration:

```bash
cp .env.email.example .env
```

Configure your preferred email provider in `.env`:

```env
# Basic SMTP setup (Gmail example)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@triplecheck.co.ke
FROM_NAME=TripleCheck Kenya
```

### 3. Basic Usage

```typescript
import { getEmailService, sendTemplatedEmail } from './services/email-service';

// Get the best available email service
const emailService = await getEmailService();

// Send a simple email
await emailService.sendEmail(
  ['user@example.com'],
  'Welcome to TripleCheck',
  'Thank you for joining our platform!'
);

// Send a templated email
await sendTemplatedEmail('welcome', ['user@example.com'], {
  userName: 'John Kamau',
  loginUrl: 'https://triplecheck.co.ke/login'
});
```

## 📧 Email Templates

### Welcome Email
```typescript
await sendTemplatedEmail('welcome', ['user@example.com'], {
  userName: 'John Kamau',
  loginUrl: 'https://triplecheck.co.ke/login'
});
```

### Password Reset
```typescript
await sendTemplatedEmail('password-reset', ['user@example.com'], {
  userName: 'John Kamau',
  resetUrl: 'https://triplecheck.co.ke/reset?token=abc123'
});
```

### Property Inquiry Notification
```typescript
await sendTemplatedEmail('property-inquiry', ['owner@example.com'], {
  propertyTitle: 'Modern Apartment in Westlands',
  inquirerName: 'Sarah Wanjiku',
  message: 'I am interested in viewing this property...',
  contactInfo: '+254712345678'
});
```

### Verification Status Update
```typescript
await sendTemplatedEmail('verification-update', ['client@example.com'], {
  userName: 'Grace Muthoni',
  propertyTitle: 'Land in Karen',
  status: 'completed',
  details: 'Your land verification has been completed successfully.'
});
```

## 🔧 Service Providers

### SMTP Service (Recommended)

**Supports:** Gmail, Outlook, custom SMTP servers

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Gmail Setup:**
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use your Gmail address and app password

**Features:**
- ✅ Real email sending
- ✅ Intelligent fallback
- ✅ Email queuing
- ✅ Connection verification
- ❌ Inbox reading (send-only)

### SendGrid Service

**High-volume transactional email service**

```env
SENDGRID_API_KEY=your-sendgrid-api-key
```

**Features:**
- ✅ High deliverability
- ✅ Analytics and tracking
- ✅ Template management
- ❌ Inbox reading (send-only)

### Mock Service

**Full-featured mock for development**

```env
EMAIL_PROVIDER=mock
```

**Features:**
- ✅ Realistic demo emails
- ✅ Inbox simulation
- ✅ Property inquiry extraction
- ✅ Message management
- ✅ No external dependencies

## 🛠️ API Endpoints

The email service includes REST API endpoints for testing and management:

### Send Test Email
```http
POST /api/email/test
Content-Type: application/json

{
  "to": "test@example.com",
  "subject": "Test Email",
  "body": "This is a test email"
}
```

### Send Welcome Email
```http
POST /api/email/welcome
Content-Type: application/json

{
  "email": "user@example.com",
  "userName": "John Kamau",
  "loginUrl": "https://triplecheck.co.ke/login"
}
```

### Get Service Status
```http
GET /api/email/status
```

### Get Inbox Messages
```http
GET /api/email/inbox?limit=50
```

### Extract Property Inquiries
```http
GET /api/email/inquiries
```

## 🧪 Testing

### Run Comprehensive Tests
```bash
npx tsx server/test-email-service.ts
```

### Test Mock Service
```bash
npx tsx server/test-email-mock.ts
```

### Test Results
```
🧪 Testing Enhanced Email Service...

✅ Service initialization
✅ Status checking  
✅ Simple email sending
✅ Welcome email template
✅ Password reset template
✅ Property inquiry template
✅ Verification update template
✅ Inbox message retrieval
✅ Property inquiry extraction
✅ Provider testing

🎉 All email service tests completed successfully!
```

## 🔍 Property Inquiry Classification

The service automatically classifies incoming emails:

```typescript
const inquiries = emailService.extractPropertyInquiries(messages);

// Each inquiry includes:
{
  id: 'inquiry_1',
  propertyTitle: 'Modern Apartment in Westlands',
  inquirerName: 'John Kamau',
  inquirerEmail: 'john.kamau@email.com',
  inquirerPhone: '+254712345678',
  message: 'I am interested in viewing...',
  priority: 'high' | 'medium' | 'low',
  status: 'new' | 'responded' | 'closed'
}
```

**Classification Features:**
- Automatic inquiry type detection (viewing, offer, complaint)
- Priority assessment based on keywords
- Contact information extraction
- Property title extraction from subject lines

## 📊 Monitoring & Status

### Service Status
```typescript
const emailService = await getEmailService();
const status = await emailService.getStatus();

console.log(status);
// {
//   connected: true,
//   fallbackMode: false,
//   queuedEmails: 0,
//   lastSync: '2025-01-01T12:00:00Z'
// }
```

### Fallback Management
```typescript
// Check if service is in fallback mode
if (emailService.isInFallbackMode()) {
  console.log(`${emailService.getFallbackEmailCount()} emails queued`);
  
  // Send queued emails when service recovers
  await emailService.sendQueuedEmails();
}
```

## 🔒 Security Best Practices

### Environment Variables
- Never commit credentials to version control
- Use environment-specific configurations
- Rotate API keys and passwords regularly

### Email Security
- Implement SPF, DKIM, and DMARC records
- Monitor for unauthorized email sending
- Use rate limiting for email endpoints
- Validate all email addresses before sending

### Production Recommendations
- Use SendGrid or AWS SES for high-volume email
- Set up proper DNS records for your domain
- Monitor email deliverability and bounce rates
- Implement email templates for consistent branding

## 🚨 Troubleshooting

### Common Issues

**SMTP Authentication Failed**
```
❌ SMTP service falling back to mock mode: Error: Invalid login
```
- Check your email and password
- For Gmail, use an App Password, not your regular password
- Ensure 2FA is enabled for Gmail

**SendGrid API Key Invalid**
```
❌ SendGrid service falling back to mock mode: Unauthorized
```
- Verify your SendGrid API key
- Check API key permissions (needs "Full Access")
- Ensure your sender identity is verified

**Service in Fallback Mode**
```
⚠️ Email service running in fallback mode - no real credentials configured
```
- Check your environment variables
- Ensure credentials are not placeholder values
- Verify service configuration

### Debug Mode

Enable debug logging:
```env
EMAIL_DEBUG=true
```

This will provide detailed logging for troubleshooting email issues.

## 🔄 Migration from Old Service

If you're migrating from the previous email service:

1. **Update imports:**
   ```typescript
   // Old
   import { emailService } from './old-email-service';
   
   // New
   import { getEmailService, sendTemplatedEmail } from './services/email-service';
   ```

2. **Update method calls:**
   ```typescript
   // Old
   await emailService.sendEmail(request);
   
   // New
   await emailService.sendEmail([to], subject, body, htmlBody);
   ```

3. **Use templated emails:**
   ```typescript
   // Old
   await emailService.sendWelcomeEmail(user);
   
   // New
   await sendTemplatedEmail('welcome', [user.email], {
     userName: user.name,
     loginUrl: 'https://triplecheck.co.ke/login'
   });
   ```

## 📈 Performance Considerations

### Batch Processing
- Process emails in batches to avoid rate limits
- Use queuing for high-volume scenarios
- Monitor email delivery rates

### Caching
- Cache email templates for better performance
- Store frequently used configurations
- Implement connection pooling for SMTP

### Monitoring
- Track email delivery success rates
- Monitor service health and fallback usage
- Set up alerts for service failures

## 🤝 Contributing

When contributing to the email service:

1. **Test all providers** - Ensure changes work with all email providers
2. **Maintain fallback compatibility** - Don't break the fallback system
3. **Update templates** - Keep email templates consistent with branding
4. **Add tests** - Include tests for new functionality
5. **Document changes** - Update this README for new features

## 📝 License

This email service is part of the TripleCheck Kenya platform and follows the same licensing terms.

---

**🇰🇪 Built for Kenya, by Kenyans** - Securing land transactions across Kenya with reliable, professional email communication.