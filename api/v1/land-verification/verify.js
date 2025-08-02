// Core land verification endpoint
import { LandVerificationService } from '../../../server/land-verification/LandVerificationService.js';

export async function POST(request) {
  try {
    const { propertyId, documents, location } = await request.json();
    
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
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 400 });
  }
}