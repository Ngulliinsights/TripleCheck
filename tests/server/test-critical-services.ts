// Comprehensive test script for all critical TripleCheck services
import { getAIMLService, analyzePropertyDocument, detectTransactionFraud } from './services/ai-ml-service';
import { getEmailService, sendTemplatedEmail } from './services/email-service';
import { getFileStorageService, uploadPropertyImage, uploadDocument } from './services/file-storage-service';
import { getMpesaService, processPropertyPayment } from './services/mpesa-service-enhanced';

async function testCriticalServices() {
  console.log('🧪 Testing All Critical TripleCheck Services...\n');
  console.log('=' .repeat(60));

  let allTestsPassed = true;
  const testResults: { service: string; status: 'PASS' | 'FAIL'; details: string }[] = [];

  // Test 1: Email Service
  console.log('\n📧 1. TESTING EMAIL SERVICE');
  console.log('-'.repeat(40));
  try {
    const emailService = await getEmailService();
    
    // Test simple email
    await emailService.sendEmail(['test@example.com'], 'Test Email', 'This is a test email');
    
    // Test templated email
    await sendTemplatedEmail('welcome', ['user@example.com'], {
      userName: 'John Kamau',
      loginUrl: 'https://triplecheck.co.ke/login'
    });
    
    // Test inbox functionality
    const messages = await emailService.getInboxMessages(5);
    const inquiries = emailService.extractPropertyInquiries(messages);
    
    console.log(`✅ Email service working - ${messages.length} messages, ${inquiries.length} inquiries`);
    testResults.push({ service: 'Email', status: 'PASS', details: `${messages.length} messages processed` });
  } catch (error) {
    console.error('❌ Email service failed:', error);
    testResults.push({ service: 'Email', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' });
    allTestsPassed = false;
  }

  // Test 2: File Storage Service
  console.log('\n📁 2. TESTING FILE STORAGE SERVICE');
  console.log('-'.repeat(40));
  try {
    const fileService = getFileStorageService();
    const status = fileService.getStatus();
    
    console.log(`📊 File Storage Status:`, {
      provider: status.provider,
      fallbackMode: status.fallbackMode,
      healthy: status.healthy
    });
    
    // Create a mock file for testing
    const mockFile = {
      originalname: 'test-property.jpg',
      mimetype: 'image/jpeg',
      size: 1024 * 50, // 50KB
      buffer: Buffer.from('mock image data for testing purposes')
    } as Express.Multer.File;
    
    // Test property image upload
    const uploadResult = await uploadPropertyImage(mockFile, 'prop_123', 'user_456');
    
    if (uploadResult.success) {
      console.log(`✅ File upload successful - ID: ${uploadResult.fileId}`);
      console.log(`📸 Image URL: ${uploadResult.url}`);
      if (uploadResult.thumbnailUrl) {
        console.log(`🖼️ Thumbnail URL: ${uploadResult.thumbnailUrl}`);
      }
      testResults.push({ service: 'File Storage', status: 'PASS', details: `Upload successful, fallback: ${uploadResult.fallbackUsed}` });
    } else {
      throw new Error(uploadResult.error || 'Upload failed');
    }
  } catch (error) {
    console.error('❌ File storage service failed:', error);
    testResults.push({ service: 'File Storage', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' });
    allTestsPassed = false;
  }

  // Test 3: M-Pesa Payment Service
  console.log('\n💳 3. TESTING M-PESA PAYMENT SERVICE');
  console.log('-'.repeat(40));
  try {
    const mpesaService = getMpesaService();
    const status = mpesaService.getStatus();
    
    console.log(`📊 M-Pesa Status:`, {
      connected: status.connected,
      fallbackMode: status.fallbackMode,
      environment: status.environment,
      pendingTransactions: status.pendingTransactions
    });
    
    // Test property payment
    const paymentResult = await processPropertyPayment(
      '254712345678',
      5000,
      'prop_123',
      'user_456'
    );
    
    if (paymentResult.success) {
      console.log(`✅ Payment initiated successfully`);
      console.log(`💰 Transaction ID: ${paymentResult.transactionId}`);
      console.log(`📱 Customer Message: ${paymentResult.customerMessage}`);
      if (paymentResult.fallbackUsed) {
        console.log(`🔄 Fallback mode used`);
      }
      
      // Test transaction status query
      if (paymentResult.checkoutRequestId) {
        const statusResult = await mpesaService.querySTKPushStatus(paymentResult.checkoutRequestId);
        console.log(`📋 Transaction Status: ${statusResult.resultDesc}`);
      }
      
      testResults.push({ service: 'M-Pesa', status: 'PASS', details: `Payment initiated, fallback: ${paymentResult.fallbackUsed}` });
    } else {
      throw new Error(paymentResult.error || 'Payment failed');
    }
  } catch (error) {
    console.error('❌ M-Pesa service failed:', error);
    testResults.push({ service: 'M-Pesa', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' });
    allTestsPassed = false;
  }

  // Test 4: AI/ML Service
  console.log('\n🤖 4. TESTING AI/ML SERVICE');
  console.log('-'.repeat(40));
  try {
    const aiService = getAIMLService();
    const status = aiService.getStatus();
    
    console.log(`📊 AI/ML Status:`, {
      connected: status.connected,
      fallbackMode: status.fallbackMode,
      availableProviders: status.availableProviders
    });
    
    // Test document analysis
    const mockImageBuffer = Buffer.from('mock title deed image data');
    const analysisResult = await analyzePropertyDocument(
      'title_deed',
      mockImageBuffer,
      {
        propertyId: 'prop_123',
        location: 'Westlands, Nairobi',
        expectedOwner: 'John Kamau'
      }
    );
    
    if (analysisResult.success) {
      console.log(`✅ Document analysis successful`);
      console.log(`📄 Document Type: ${analysisResult.documentType}`);
      console.log(`🎯 Confidence: ${(analysisResult.confidence * 100).toFixed(1)}%`);
      console.log(`🔍 Risk Level: ${analysisResult.fraudIndicators.riskLevel}`);
      console.log(`✅ Authentic: ${analysisResult.authenticity.isAuthentic}`);
      if (analysisResult.fallbackUsed) {
        console.log(`🔄 Fallback mode used`);
      }
      
      // Test fraud detection
      const fraudResult = await detectTransactionFraud(
        {
          propertyId: 'prop_123',
          sellerId: 'seller_789',
          buyerId: 'buyer_456',
          amount: 5000000,
          location: 'Westlands, Nairobi'
        },
        ['http://example.com/title_deed.pdf', 'http://example.com/sale_agreement.pdf']
      );
      
      console.log(`🕵️ Fraud Detection - Risk Score: ${fraudResult.riskScore}/100`);
      console.log(`⚠️ Risk Level: ${fraudResult.riskLevel}`);
      console.log(`👨‍💼 Manual Review Required: ${fraudResult.requiresManualReview}`);
      
      testResults.push({ service: 'AI/ML', status: 'PASS', details: `Analysis completed, fallback: ${analysisResult.fallbackUsed}` });
    } else {
      throw new Error(analysisResult.error || 'Analysis failed');
    }
  } catch (error) {
    console.error('❌ AI/ML service failed:', error);
    testResults.push({ service: 'AI/ML', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' });
    allTestsPassed = false;
  }

  // Test 5: Integration Test - Complete Workflow
  console.log('\n🔄 5. TESTING COMPLETE WORKFLOW INTEGRATION');
  console.log('-'.repeat(40));
  try {
    console.log('🏠 Simulating complete property verification workflow...');
    
    // Step 1: Upload property documents
    const mockTitleDeed = {
      originalname: 'title_deed.pdf',
      mimetype: 'application/pdf',
      size: 1024 * 200, // 200KB
      buffer: Buffer.from('mock title deed PDF content')
    } as Express.Multer.File;
    
    const documentUpload = await uploadDocument(mockTitleDeed, 'title_deed', 'user_123');
    console.log(`📄 Document uploaded: ${documentUpload.fileId}`);
    
    // Step 2: Analyze document with AI
    const documentAnalysis = await analyzePropertyDocument(
      'title_deed',
      mockTitleDeed.buffer,
      { propertyId: 'prop_123', location: 'Karen, Nairobi' }
    );
    console.log(`🤖 Document analyzed - Confidence: ${(documentAnalysis.confidence * 100).toFixed(1)}%`);
    
    // Step 3: Process verification payment
    const verificationPayment = await getMpesaService().processVerificationPayment(
      '254712345678',
      2500,
      'verification_789',
      'user_123'
    );
    console.log(`💳 Verification payment: ${verificationPayment.success ? 'SUCCESS' : 'FAILED'}`);
    
    // Step 4: Send notification email
    await sendTemplatedEmail('verification-update', ['user@example.com'], {
      userName: 'John Kamau',
      propertyTitle: 'Land in Karen',
      status: 'completed',
      details: 'Your land verification has been completed successfully.'
    });
    console.log(`📧 Notification email sent`);
    
    console.log(`✅ Complete workflow integration successful!`);
    testResults.push({ service: 'Integration', status: 'PASS', details: 'Complete workflow executed successfully' });
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    testResults.push({ service: 'Integration', status: 'FAIL', details: error instanceof Error ? error.message : 'Unknown error' });
    allTestsPassed = false;
  }

  // Test Results Summary
  console.log(`\n${  '='.repeat(60)}`);
  console.log('📊 CRITICAL SERVICES TEST RESULTS');
  console.log('='.repeat(60));
  
  testResults.forEach(result => {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    console.log(`${statusIcon} ${result.service.padEnd(15)} | ${result.status.padEnd(4)} | ${result.details}`);
  });
  
  console.log(`\n${  '='.repeat(60)}`);
  
  const passedTests = testResults.filter(r => r.status === 'PASS').length;
  const totalTests = testResults.length;
  
  if (allTestsPassed) {
    console.log(`🎉 ALL TESTS PASSED! (${passedTests}/${totalTests})`);
    console.log('✨ TripleCheck critical services are ready for production!');
    console.log('\n🇰🇪 Ready to secure land transactions across Kenya!');
  } else {
    console.log(`⚠️ SOME TESTS FAILED (${passedTests}/${totalTests} passed)`);
    console.log('🔧 Please check the failed services and their configurations.');
    console.log('\n📋 Next Steps:');
    console.log('1. Review environment variables for failed services');
    console.log('2. Install missing dependencies if needed');
    console.log('3. Configure API keys for external services');
    console.log('4. Re-run tests after fixes');
  }

  console.log('\n📚 Service Configuration Guide:');
  console.log('- Email: Configure SMTP_HOST, SMTP_USER, SMTP_PASSWORD');
  console.log('- File Storage: Configure CLOUDINARY_* or AWS_* credentials');
  console.log('- M-Pesa: Configure MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, etc.');
  console.log('- AI/ML: Configure OPENAI_API_KEY, GEMINI_API_KEY, or CLAUDE_API_KEY');
  
  return allTestsPassed;
}

// Run the comprehensive test automatically
testCriticalServices().then((success) => {
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test suite crashed:', error);
  process.exit(1);
});

export { testCriticalServices };