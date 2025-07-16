# Email Service Setup Guide

This document explains how to configure TripleCheck's email service integration for real email providers.

## Current Status

- **Mock Service**: Currently active for demo purposes
- **Real Services**: Infrastructure ready, implementations pending
- **Supported Providers**: Gmail, Outlook, SendGrid (planned)

## Configuration

### Environment Variables

Add these to your `.env` file to configure email services:

```bash
# Email Service Configuration
EMAIL_PROVIDER=mock  # Options: mock, gmail, outlook, sendgrid
EMAIL_MAX_MESSAGES=100
EMAIL_SYNC_INTERVAL=300000  # 5 minutes in milliseconds
EMAIL_AUTO_MARK_READ=false

# Gmail OAuth2 Configuration (when EMAIL_PROVIDER=gmail)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token
GMAIL_ACCESS_TOKEN=your_gmail_access_token

# Outlook OAuth2 Configuration (when EMAIL_PROVIDER=outlook)
OUTLOOK_CLIENT_ID=your_outlook_client_id
OUTLOOK_CLIENT_SECRET=your_outlook_client_secret
OUTLOOK_TENANT_ID=your_outlook_tenant_id
OUTLOOK_REFRESH_TOKEN=your_outlook_refresh_token
OUTLOOK_ACCESS_TOKEN=your_outlook_access_token

# SendGrid Configuration (when EMAIL_PROVIDER=sendgrid)
SENDGRID_API_KEY=your_sendgrid_api_key
```

## Service Setup Instructions

### Gmail Integration

1. **Create Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Gmail API

2. **Configure OAuth2**
   - Go to APIs & Services > Credentials
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URIs
   - Download credentials JSON

3. **Get Refresh Token**
   - Use Google OAuth2 Playground or implement OAuth flow
   - Exchange authorization code for refresh token
   - Store tokens securely

4. **Update Environment**
   ```bash
   EMAIL_PROVIDER=gmail
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_client_secret
   GMAIL_REFRESH_TOKEN=your_refresh_token
   ```

### Outlook Integration

1. **Register Azure App**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register new application
   - Configure API permissions for Microsoft Graph
   - Add Mail.Read, Mail.Send permissions

2. **Configure Authentication**
   - Set redirect URIs
   - Generate client secret
   - Note tenant ID

3. **Get OAuth Tokens**
   - Implement OAuth2 flow
   - Get authorization code
   - Exchange for access/refresh tokens

4. **Update Environment**
   ```bash
   EMAIL_PROVIDER=outlook
   OUTLOOK_CLIENT_ID=your_client_id
   OUTLOOK_CLIENT_SECRET=your_client_secret
   OUTLOOK_TENANT_ID=your_tenant_id
   OUTLOOK_REFRESH_TOKEN=your_refresh_token
   ```

### SendGrid Integration

1. **Create SendGrid Account**
   - Sign up at [SendGrid](https://sendgrid.com/)
   - Verify your account and domain

2. **Generate API Key**
   - Go to Settings > API Keys
   - Create new API key with Mail Send permissions
   - Store key securely

3. **Update Environment**
   ```bash
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your_api_key
   ```

   **Note**: SendGrid is primarily for sending emails. For receiving, consider using Gmail or Outlook.

## API Endpoints

The email service provides these endpoints:

- `GET /api/email/inquiries` - Get all inquiries
- `GET /api/email/inquiries/:id` - Get specific inquiry
- `POST /api/email/inquiries/:id/reply` - Reply to inquiry
- `PATCH /api/email/inquiries/:id/read` - Mark as read/unread
- `PATCH /api/email/inquiries/:id/archive` - Archive/unarchive
- `DELETE /api/email/inquiries/:id` - Delete inquiry
- `GET /api/email/inquiries/search/:query` - Search inquiries
- `GET /api/email/status` - Get service status
- `POST /api/email/send` - Send new email

## Implementation Status

### ✅ Completed
- Email service interfaces and types
- Mock email service (for demo)
- API routes and endpoints
- Frontend integration with fallback
- Configuration system
- Error handling and logging

### 🚧 Pending Implementation
- Gmail API integration
- Outlook/Microsoft Graph integration
- SendGrid API integration
- OAuth2 token refresh logic
- Webhook handling for real-time updates
- Email parsing and classification improvements

## Testing

### Mock Service Testing
The mock service is automatically active and provides:
- 4 sample inquiries with different types and priorities
- Simulated reply functionality
- Status management (read/unread/archived)
- Search functionality

### Real Service Testing
When implementing real services:
1. Set up test email accounts
2. Configure OAuth2 credentials
3. Test with small message volumes
4. Verify token refresh mechanisms
5. Test error handling scenarios

## Security Considerations

1. **Token Storage**: Store OAuth tokens securely, consider encryption
2. **API Keys**: Never commit API keys to version control
3. **Permissions**: Use minimal required permissions for email access
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Data Privacy**: Handle email data according to privacy regulations

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check OAuth2 credentials
   - Verify token expiration
   - Ensure proper scopes/permissions

2. **API Rate Limits**
   - Implement exponential backoff
   - Monitor API usage quotas
   - Cache responses when appropriate

3. **Email Parsing Issues**
   - Improve classification algorithms
   - Handle various email formats
   - Test with real email data

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will provide detailed logs for email service operations.

## Future Enhancements

1. **AI-Powered Classification**
   - Improve inquiry type detection
   - Automatic priority assignment
   - Sentiment analysis

2. **Real-time Updates**
   - WebSocket integration
   - Push notifications
   - Live inbox updates

3. **Advanced Features**
   - Email templates
   - Automated responses
   - Integration with CRM systems
   - Analytics and reporting

## Support

For implementation assistance:
- Check server logs for detailed error messages
- Use the `/api/email/status` endpoint to verify service health
- Test with mock service first before implementing real providers