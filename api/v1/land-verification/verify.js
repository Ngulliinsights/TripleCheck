// Core land verification endpoint - FIXED: Proper error handling
import { LandVerificationService } from '../../../server/land-verification/LandVerificationService.js';

export async function POST(request) {
  try {
    // Validate request content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return Response.json({
        success: false,
        error: 'Content-Type must be application/json',
        code: 'INVALID_CONTENT_TYPE'
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let requestData;
    try {
      requestData = await request.json();
    } catch (parseError) {
      return Response.json({
        success: false,
        error: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { propertyId, documents, location } = requestData;
    
    // Validate required fields
    if (!propertyId) {
      return Response.json({
        success: false,
        error: 'propertyId is required',
        code: 'MISSING_PROPERTY_ID'
      }, { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const verificationService = new LandVerificationService();
    const result = await verificationService.verifyProperty({
      propertyId,
      documents,
      location,
      requestId: crypto.randomUUID()
    });
    
    return Response.json({
      success: true,
      verificationId: result.verificationId,
      status: result.status,
      riskScore: result.riskScore,
      estimatedCompletion: result.estimatedCompletion,
      webhookUrl: result.webhookUrl
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)
    console.error('Land verification error:', error);
    
    // Return structured error response - NEVER return HTML
    return Response.json({
      success: false,
      error: error.message || 'Internal server error',
      code: 'VERIFICATION_ERROR',
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}