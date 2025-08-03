import { Express, Request, Response } from "express";
import { z } from "zod";

import { AuthenticatedRequest, requireAuth } from "../middleware/auth.middleware";
import { asyncHandler } from "../middleware/error-handler";
import { createMpesaService, STKPushRequest } from "../services/mpesa-service";

// Critical payment warning for property transactions
const CRITICAL_PAYMENT_WARNING = {
  title: "Important: Property Purchase Payments",
  message: "For property purchases, deposits, or large transactions, use bank transfers or escrow services. M-Pesa payments cannot be reversed.",
  recommendedMethods: ["Bank Transfer", "Escrow Service", "Lawyer's Trust Account"],
  maxSafeAmount: 10000 // KES
};

// Payment validation schemas
const InitiatePaymentSchema = z.object({
  phoneNumber: z.string()
    .regex(/^(\+254|254|0)?[17]\d{8}$/, "Invalid Kenyan phone number format"),
  amount: z.number()
    .min(1, "Amount must be at least KES 1")
    .max(10000, "Amount cannot exceed KES 10,000 per transaction for safety. For larger amounts, use bank transfers."),
  propertyId: z.number().int().positive().optional(),
  serviceType: z.enum([
    'property_verification', 
    'premium_listing', 
    'background_check', 
    'document_authentication',
    'tour_booking',
    'consultation_fee'
    // Explicitly excludes: 'property_purchase', 'deposit', 'down_payment'
  ]),
  description: z.string().min(1).max(100)
});

const CallbackSchema = z.object({
  Body: z.object({
    stkCallback: z.object({
      MerchantRequestID: z.string(),
      CheckoutRequestID: z.string(),
      ResultCode: z.number(),
      ResultDesc: z.string(),
      CallbackMetadata: z.object({
        Item: z.array(z.object({
          Name: z.string(),
          Value: z.union([z.string(), z.number()])
        }))
      }).optional()
    })
  })
});

// In-memory storage for demo (replace with database in production)
const paymentTransactions = new Map<string, {
  id: string;
  userId: number;
  merchantRequestId: string;
  checkoutRequestId: string;
  phoneNumber: string;
  amount: number;
  serviceType: string;
  description: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  mpesaReceiptNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}>();

export function registerPaymentRoutes(app: Express) {
  const mpesaService = createMpesaService();

  /**
   * Initiate M-Pesa payment
   */
  app.post("/api/payments/mpesa/initiate",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const validatedData = InitiatePaymentSchema.parse(req.body);
        const userId = req.session?.userId;

        if (!userId) {
          return res.status(401).json({
            success: false,
            error: "Authentication required",
            message: "Please log in to make payments"
          });
        }

        // Create callback URL
        const callbackUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/payments/mpesa/callback`;

        // Prepare STK Push request
        const stkRequest: STKPushRequest = {
          phoneNumber: validatedData.phoneNumber,
          amount: validatedData.amount,
          accountReference: `TC-${validatedData.serviceType}-${Date.now()}`,
          transactionDesc: validatedData.description,
          callbackUrl
        };

        // Initiate STK Push
        const stkResponse = await mpesaService.initiateSTKPush(stkRequest);

        // Store transaction details
        const transactionId = `txn_${Date.now()}_${userId}`;
        paymentTransactions.set(transactionId, {
          id: transactionId,
          userId,
          merchantRequestId: stkResponse.MerchantRequestID,
          checkoutRequestId: stkResponse.CheckoutRequestID,
          phoneNumber: validatedData.phoneNumber,
          amount: validatedData.amount,
          serviceType: validatedData.serviceType,
          description: validatedData.description,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        res.json({
          success: true,
          data: {
            transactionId,
            merchantRequestId: stkResponse.MerchantRequestID,
            checkoutRequestId: stkResponse.CheckoutRequestID,
            customerMessage: stkResponse.CustomerMessage
          },
          message: "Payment initiated successfully. Please check your phone for M-Pesa prompt.",
          warning: "M-Pesa payments are irreversible. Only use for service fees, not property purchases."
        });

      } catch (error: any) {
        console.error('Payment initiation error:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: "Validation failed",
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            }))
          });
        }

        res.status(500).json({
          success: false,
          error: "Payment initiation failed",
          message: error.message || "An error occurred while initiating payment"
        });
      }
    })
  );

  /**
   * Check payment status
   */
  app.get("/api/payments/:transactionId/status",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { transactionId } = req.params;
        const userId = req.session?.userId;

        const transaction = paymentTransactions.get(transactionId);
        
        if (!transaction) {
          return res.status(404).json({
            success: false,
            error: "Transaction not found",
            message: "The specified transaction could not be found"
          });
        }

        // Verify user owns this transaction
        if (transaction.userId !== userId) {
          return res.status(403).json({
            success: false,
            error: "Access denied",
            message: "You don't have permission to view this transaction"
          });
        }

        // If still pending, query M-Pesa for latest status
        if (transaction.status === 'pending') {
          try {
            const statusResponse = await mpesaService.querySTKPushStatus(transaction.checkoutRequestId);
            
            // Update transaction status based on M-Pesa response
            if (statusResponse.ResultCode === '0') {
              transaction.status = 'completed';
              transaction.updatedAt = new Date();
            } else if (statusResponse.ResultCode !== '1037') { // 1037 means still pending
              transaction.status = 'failed';
              transaction.updatedAt = new Date();
            }
          } catch (error) {
            console.error('Error querying M-Pesa status:', error);
            // Don't fail the request, just return current status
          }
        }

        res.json({
          success: true,
          data: {
            transactionId: transaction.id,
            status: transaction.status,
            amount: transaction.amount,
            serviceType: transaction.serviceType,
            description: transaction.description,
            mpesaReceiptNumber: transaction.mpesaReceiptNumber,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt
          }
        });

      } catch (error: any) {
        console.error('Payment status check error:', error);
        res.status(500).json({
          success: false,
          error: "Status check failed",
          message: "An error occurred while checking payment status"
        });
      }
    })
  );

  /**
   * M-Pesa callback endpoint
   */
  app.post("/api/payments/mpesa/callback",
    asyncHandler(async (req: Request, res: Response) => {
      try {
        console.log('M-Pesa callback received:', JSON.stringify(req.body, null, 2));

        // Validate callback data
        const callbackData = CallbackSchema.parse(req.body);
        
        // Process callback
        const callback = mpesaService.processCallback(callbackData);
        
        // Find transaction by checkout request ID
        let transaction = null;
        for (const [key, txn] of paymentTransactions.entries()) {
          if (txn.checkoutRequestId === callback.checkoutRequestId) {
            transaction = txn;
            break;
          }
        }

        if (!transaction) {
          console.error('Transaction not found for callback:', callback.checkoutRequestId);
          return res.status(404).json({
            success: false,
            error: "Transaction not found"
          });
        }

        // Update transaction status
        if (callback.resultCode === 0) {
          // Payment successful
          transaction.status = 'completed';
          transaction.mpesaReceiptNumber = callback.mpesaReceiptNumber;
          transaction.updatedAt = new Date();
          
          console.log(`Payment completed: ${transaction.id}, Receipt: ${callback.mpesaReceiptNumber}`);
          
          // Here you would typically:
          // 1. Update user's account/credits
          // 2. Activate purchased services
          // 3. Send confirmation email/SMS
          // 4. Trigger any business logic
          
        } else {
          // Payment failed or cancelled
          transaction.status = callback.resultCode === 1032 ? 'cancelled' : 'failed';
          transaction.updatedAt = new Date();
          
          console.log(`Payment ${transaction.status}: ${transaction.id}, Reason: ${callback.resultDesc}`);
        }

        // Acknowledge callback
        res.json({
          success: true,
          message: "Callback processed successfully"
        });

      } catch (error: any) {
        console.error('M-Pesa callback processing error:', error);
        
        // Still acknowledge to prevent retries
        res.json({
          success: false,
          error: "Callback processing failed",
          message: error.message
        });
      }
    })
  );

  /**
   * Get user's payment history
   */
  app.get("/api/payments/history",
    requireAuth,
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.session?.userId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

        // Filter transactions for current user
        const userTransactions = Array.from(paymentTransactions.values())
          .filter(txn => txn.userId === userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        // Paginate results
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedTransactions = userTransactions.slice(startIndex, endIndex);

        res.json({
          success: true,
          data: {
            transactions: paginatedTransactions.map(txn => ({
              id: txn.id,
              amount: txn.amount,
              serviceType: txn.serviceType,
              description: txn.description,
              status: txn.status,
              mpesaReceiptNumber: txn.mpesaReceiptNumber,
              createdAt: txn.createdAt,
              updatedAt: txn.updatedAt
            })),
            pagination: {
              page,
              limit,
              total: userTransactions.length,
              pages: Math.ceil(userTransactions.length / limit)
            }
          }
        });

      } catch (error: any) {
        console.error('Payment history error:', error);
        res.status(500).json({
          success: false,
          error: "Failed to fetch payment history",
          message: error.message
        });
      }
    })
  );

  /**
   * Get payment method guidance
   */
  app.get("/api/payments/guidance",
    asyncHandler(async (req: Request, res: Response) => {
      const guidance = {
        mpesa: {
          name: "M-Pesa",
          description: "Mobile money payment system",
          suitableFor: [
            "Service fees (verification, listings)",
            "Small consultation fees",
            "Tour bookings",
            "Document authentication"
          ],
          notSuitableFor: [
            "Property purchases",
            "Property deposits",
            "Rent payments above KES 10,000",
            "Large service packages"
          ],
          maxRecommendedAmount: 10000,
          warnings: [
            "Payments are irreversible",
            "No dispute resolution mechanism",
            "Limited to registered M-Pesa users"
          ]
        },
        bankTransfer: {
          name: "Bank Transfer",
          description: "Direct bank-to-bank transfer",
          suitableFor: [
            "Property purchases",
            "Large deposits",
            "High-value services",
            "Escrow transactions"
          ],
          advantages: [
            "Reversible with proper documentation",
            "Bank dispute resolution available",
            "Higher transaction limits",
            "Better audit trail"
          ]
        },
        escrow: {
          name: "Escrow Service",
          description: "Third-party secured payment holding",
          suitableFor: [
            "Property purchases",
            "Large transactions",
            "International buyers",
            "High-risk transactions"
          ],
          advantages: [
            "Maximum security for both parties",
            "Professional dispute resolution",
            "Legal protection",
            "Conditional release of funds"
          ]
        }
      };

      res.json({
        success: true,
        data: guidance,
        recommendation: "Use M-Pesa only for service fees under KES 10,000. For property transactions, always use bank transfers or escrow services."
      });
    })
  );

  /**
   * Get payment service pricing
   */
  app.get("/api/payments/pricing",
    asyncHandler(async (req: Request, res: Response) => {
      const pricing = {
        property_verification: {
          name: "Property Verification",
          price: 500, // KES
          description: "Complete property verification including ownership and legal checks",
          features: ["Ownership verification", "Legal status check", "Market value assessment"],
          paymentMethods: ["M-Pesa", "Bank Transfer"]
        },
        premium_listing: {
          name: "Premium Property Listing",
          price: 1000, // KES
          description: "Featured listing with enhanced visibility and analytics",
          features: ["Featured placement", "Enhanced photos", "Analytics dashboard", "Priority support"],
          paymentMethods: ["M-Pesa", "Bank Transfer"]
        },
        background_check: {
          name: "Tenant Background Check",
          price: 300, // KES
          description: "Comprehensive tenant screening and verification",
          features: ["Identity verification", "Credit check", "Reference verification"],
          paymentMethods: ["M-Pesa", "Bank Transfer"]
        },
        document_authentication: {
          name: "Document Authentication",
          price: 200, // KES
          description: "AI-powered document verification and authentication",
          features: ["Document authenticity check", "Data extraction", "Fraud detection"],
          paymentMethods: ["M-Pesa", "Bank Transfer"]
        },
        tour_booking: {
          name: "Property Tour Booking",
          price: 100, // KES
          description: "Schedule and secure a property viewing appointment",
          features: ["Confirmed appointment", "Expert guide", "Detailed property walkthrough"],
          paymentMethods: ["M-Pesa"]
        },
        consultation_fee: {
          name: "Expert Consultation",
          price: 800, // KES
          description: "One-on-one consultation with property experts",
          features: ["30-minute session", "Expert advice", "Written recommendations"],
          paymentMethods: ["M-Pesa", "Bank Transfer"]
        }
      };

      res.json({
        success: true,
        data: pricing,
        paymentGuidance: CRITICAL_PAYMENT_WARNING
      });
    })
  );
}