// Webhook endpoint for async results
export async function POST(request) {
  const { verificationId, status, results } = await request.json();
  
  // Forward to customer webhook
  return Response.json({ received: true });
}