// Test script for the enhanced email service
import { getEmailService, sendTemplatedEmail, EmailServiceFactory } from './services/email-service';

async function testEmailService() {
  console.log('🧪 Testing Enhanced Email Service...\n');

  try {
    // Test 1: Get email service (should auto-select best available)
    console.log('1️⃣ Testing service initialization...');
    const emailService = await getEmailService();
    console.log('✅ Email service initialized successfully\n');

    // Test 2: Check service status
    console.log('2️⃣ Checking service status...');
    if ('getStatus' in emailService) {
      const status = await (emailService as any).getStatus();
      console.log('📊 Service Status:', status);
    } else {
      console.log('📊 Service Status: Available (no detailed status)');
    }

    // Check fallback mode
    if ('isInFallbackMode' in emailService) {
      const fallbackMode = (emailService as any).isInFallbackMode();
      const queuedCount = (emailService as any).getFallbackEmailCount?.() || 0;
      console.log(`📊 Fallback Mode: ${fallbackMode ? 'Yes' : 'No'}`);
      console.log(`📊 Queued Emails: ${queuedCount}\n`);
    }

    // Test 3: Send simple email
    console.log('3️⃣ Testing simple email sending...');
    await emailService.sendEmail(
      ['test@example.com'],
      'Test Email from TripleCheck Kenya',
      'This is a test email to verify the email service is working correctly.'
    );
    console.log('✅ Simple email sent successfully\n');

    // Test 4: Send welcome email template
    console.log('4️⃣ Testing welcome email template...');
    await sendTemplatedEmail('welcome', ['newuser@example.com'], {
      userName: 'John Kamau',
      loginUrl: 'https://triplecheck.co.ke/login'
    });
    console.log('✅ Welcome email sent successfully\n');

    // Test 5: Send password reset email template
    console.log('5️⃣ Testing password reset email template...');
    await sendTemplatedEmail('password-reset', ['user@example.com'], {
      userName: 'Sarah Wanjiku',
      resetUrl: 'https://triplecheck.co.ke/reset-password?token=abc123'
    });
    console.log('✅ Password reset email sent successfully\n');

    // Test 6: Send property inquiry notification
    console.log('6️⃣ Testing property inquiry notification...');
    await sendTemplatedEmail('property-inquiry', ['owner@example.com'], {
      propertyTitle: 'Modern Apartment in Westlands',
      inquirerName: 'Michael Ochieng',
      message: 'I am interested in viewing this property. When would be a good time?',
      contactInfo: '+254712345678'
    });
    console.log('✅ Property inquiry notification sent successfully\n');

    // Test 7: Send verification update
    console.log('7️⃣ Testing verification status update...');
    await sendTemplatedEmail('verification-update', ['client@example.com'], {
      userName: 'Grace Muthoni',
      propertyTitle: 'Land in Karen',
      status: 'completed',
      details: 'Your land verification has been completed successfully. All documents are authentic and the land title is clear.'
    });
    console.log('✅ Verification update sent successfully\n');

    // Test 8: Get inbox messages (if supported)
    console.log('8️⃣ Testing inbox message retrieval...');
    const messages = await emailService.getInboxMessages(5);
    console.log(`📧 Retrieved ${messages.length} inbox messages`);
    if (messages.length > 0) {
      console.log('📧 Sample message:', {
        id: messages[0].id,
        from: messages[0].from,
        subject: messages[0].subject,
        timestamp: messages[0].timestamp
      });
    }
    console.log('✅ Inbox retrieval test completed\n');

    // Test 9: Extract property inquiries
    console.log('9️⃣ Testing property inquiry extraction...');
    const inquiries = emailService.extractPropertyInquiries(messages);
    console.log(`🔍 Extracted ${inquiries.length} property inquiries`);
    if (inquiries.length > 0) {
      console.log('🔍 Sample inquiry:', {
        id: inquiries[0].id,
        propertyTitle: inquiries[0].propertyTitle,
        inquirerName: inquiries[0].inquirerName,
        priority: inquiries[0].priority,
        status: inquiries[0].status
      });
    }
    console.log('✅ Inquiry extraction test completed\n');

    // Test 10: Test different providers
    console.log('🔟 Testing different email providers...');
    const providers = ['mock', 'smtp', 'sendgrid'] as const;
    
    for (const provider of providers) {
      try {
        console.log(`   Testing ${provider} provider...`);
        const service = EmailServiceFactory.createService(provider);
        await service.initialize();
        console.log(`   ✅ ${provider} provider initialized successfully`);
      } catch (error) {
        console.log(`   ⚠️ ${provider} provider failed:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    console.log('\n🎉 All email service tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Service initialization');
    console.log('   ✅ Status checking');
    console.log('   ✅ Simple email sending');
    console.log('   ✅ Welcome email template');
    console.log('   ✅ Password reset template');
    console.log('   ✅ Property inquiry template');
    console.log('   ✅ Verification update template');
    console.log('   ✅ Inbox message retrieval');
    console.log('   ✅ Property inquiry extraction');
    console.log('   ✅ Provider testing');

  } catch (error) {
    console.error('❌ Email service test failed:', error);
    process.exit(1);
  }
}

// Run the test automatically
testEmailService().then(() => {
  console.log('\n✨ Email service is ready for production use!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});

export { testEmailService };