# TripleCheck Payment System Guide

## Overview

TripleCheck implements a secure, multi-method payment system specifically designed for the Kenyan real estate market. The system prioritizes user safety by restricting M-Pesa to appropriate use cases and guiding users toward secure payment methods for property transactions.

## Payment Methods

### 1. M-Pesa (Mobile Money)
**✅ Recommended For:**
- Service fees (verification, listings)
- Small consultation fees (under KES 10,000)
- Tour bookings
- Document authentication

**❌ NOT Recommended For:**
- Property purchases
- Property deposits
- Large service packages
- Any transaction above KES 10,000

**Key Limitations:**
- Payments are **irreversible**
- No dispute resolution mechanism
- Maximum safe amount: KES 10,000
- Limited to registered M-Pesa users

### 2. Bank Transfer
**✅ Recommended For:**
- Property purchases
- Large deposits
- High-value services
- Escrow transactions

**Advantages:**
- Reversible with proper documentation
- Bank dispute resolution available
- Higher transaction limits
- Better audit trail

### 3. Escrow Service
**✅ Recommended For:**
- Property purchases
- Large transactions (above KES 50,000)
- International buyers
- High-risk transactions

**Advantages:**
- Maximum security for both parties
- Professional dispute resolution
- Legal protection
- Conditional release of funds

## Implementation Details

### API Endpoints

#### Get Payment Guidance
```
GET /api/payments/guidance
```
Returns comprehensive guidance on payment methods, suitable use cases, and warnings.

#### Get Service Pricing
```
GET /api/payments/pricing
```
Returns pricing for all services with recommended payment methods.

#### Initiate M-Pesa Payment
```
POST /api/payments/mpesa/initiate
```
Initiates M-Pesa payment with built-in safety checks and warnings.

### Safety Features

1. **Amount Limits**: M-Pesa transactions are limited to KES 10,000
2. **Transaction Type Validation**: Prevents M-Pesa for property-related transactions
3. **Warning Messages**: Clear warnings about M-Pesa's irreversible nature
4. **Payment Method Guidance**: Automatic recommendations based on transaction type and amount

### Environment Configuration

```bash
# M-Pesa Configuration (SERVICE FEES ONLY)
MPESA_CONSUMER_KEY="your-mpesa-consumer-key"
MPESA_CONSUMER_SECRET="your-mpesa-consumer-secret"
MPESA_BUSINESS_SHORT_CODE="your-business-short-code"
MPESA_PASSKEY="your-mpesa-passkey"
MPESA_ENVIRONMENT="sandbox" # or "production"
MPESA_MAX_SAFE_AMOUNT="10000" # Maximum safe amount for M-Pesa
```

## Frontend Components

### PaymentGuidance Component
```tsx
import PaymentGuidance from '@shared/components/PaymentGuidance';

// For service payments
<PaymentGuidance transactionType="service" amount={500} />

// For property transactions
<PaymentGuidance transactionType="property" amount={50000} />
```

### usePaymentGuidance Hook
```tsx
import { usePaymentGuidance } from '@shared/hooks/usePaymentGuidance';

const { guidance, getRecommendedMethod, isAmountSafeForMpesa } = usePaymentGuidance();

// Check if amount is safe for M-Pesa
const isSafe = isAmountSafeForMpesa(5000); // true

// Get recommended payment method
const method = getRecommendedMethod(50000, 'property_purchase'); // 'bankTransfer'
```

## Service Types and Pricing

| Service | Price (KES) | Payment Methods | Description |
|---------|-------------|-----------------|-------------|
| Property Verification | 500 | M-Pesa, Bank Transfer | Complete ownership and legal checks |
| Premium Listing | 1,000 | M-Pesa, Bank Transfer | Featured listing with analytics |
| Background Check | 300 | M-Pesa, Bank Transfer | Tenant screening and verification |
| Document Authentication | 200 | M-Pesa, Bank Transfer | AI-powered document verification |
| Tour Booking | 100 | M-Pesa | Property viewing appointment |
| Expert Consultation | 800 | M-Pesa, Bank Transfer | 30-minute expert session |

## Security Best Practices

1. **Never use M-Pesa for property purchases** - Always use bank transfers or escrow
2. **Verify payment limits** - Check amount against safe limits before processing
3. **Provide clear warnings** - Always inform users about M-Pesa's irreversible nature
4. **Guide users appropriately** - Recommend suitable payment methods based on transaction type
5. **Log suspicious transactions** - Monitor for attempts to use M-Pesa inappropriately

## Error Handling

The system includes comprehensive error handling for:
- Amount exceeding safe limits
- Invalid phone number formats
- M-Pesa API failures
- Configuration issues
- Suspicious transaction patterns

## Monitoring and Alerts

- All M-Pesa transactions above KES 5,000 are logged with warnings
- Property-related M-Pesa attempts trigger alerts
- Failed transactions are tracked for analysis
- Payment method usage is monitored for optimization

## Future Enhancements

1. **Integration with Kenyan Banks** - Direct bank transfer API integration
2. **Escrow Service Partnership** - Automated escrow service integration
3. **Payment Installments** - Support for payment plans on large transactions
4. **International Payments** - Support for diaspora property investments
5. **Cryptocurrency Support** - For tech-savvy international buyers

## Support and Troubleshooting

For payment-related issues:
1. Check environment configuration
2. Verify M-Pesa credentials
3. Review transaction logs
4. Contact M-Pesa support for API issues
5. Escalate property transaction disputes to legal team

---

**Remember**: The primary goal is user safety. When in doubt, always recommend the most secure payment method for the transaction type and amount.