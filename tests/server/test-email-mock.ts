// Test the mock email service specifically to see inbox functionality
import { EmailServiceFactory } from './infrastructure/email/email.service';

async function testMockEmailService() {
  console.log('🧪 Testing Mock Email Service with Inbox...\n');

  try {
    // Create mock service specifically
    const mockService = EmailServiceFactory.createService('mock');
    await mockService.initialize();
    console.log('✅ Mock email service initialized\n');

    // Get inbox messages
    console.log('📧 Getting inbox messages...');
    const messages = await mockService.getInboxMessages(10);
    console.log(`📧 Retrieved ${messages.length} messages\n`);

    // Display messages
    messages.forEach((msg, index) => {
      console.log(`📨 Message ${index + 1}:`);
      console.log(`   ID: ${msg.id}`);
      console.log(`   From: ${msg.from}`);
      console.log(`   Subject: ${msg.subject}`);
      console.log(`   Read: ${msg.isRead ? '✅' : '❌'}`);
      console.log(`   Labels: ${msg.labels?.join(', ') || 'None'}`);
      console.log(`   Preview: ${msg.body.substring(0, 100)}...`);
      console.log('');
    });

    // Extract property inquiries
    console.log('🔍 Extracting property inquiries...');
    const inquiries = mockService.extractPropertyInquiries(messages);
    console.log(`🔍 Found ${inquiries.length} property inquiries\n`);

    // Display inquiries
    inquiries.forEach((inquiry, index) => {
      console.log(`🏠 Inquiry ${index + 1}:`);
      console.log(`   ID: ${inquiry.id}`);
      console.log(`   Property: ${inquiry.propertyTitle}`);
      console.log(`   From: ${inquiry.inquirerName} (${inquiry.inquirerEmail})`);
      console.log(`   Phone: ${inquiry.inquirerPhone || 'Not provided'}`);
      console.log(`   Priority: ${inquiry.priority}`);
      console.log(`   Status: ${inquiry.status}`);
      console.log(`   Message: ${inquiry.message.substring(0, 100)}...`);
      console.log('');
    });

    // Test marking as read
    if (messages.length > 0) {
      console.log('📖 Testing mark as read...');
      await mockService.markAsRead(messages[0].id);
      console.log(`✅ Marked message ${messages[0].id} as read\n`);
    }

    // Test archiving
    if (messages.length > 1) {
      console.log('📁 Testing archive message...');
      await mockService.archiveMessage(messages[1].id);
      console.log(`✅ Archived message ${messages[1].id}\n`);
    }

    console.log('🎉 Mock email service test completed successfully!');

  } catch (error) {
    console.error('❌ Mock email service test failed:', error);
    process.exit(1);
  }
}

// Run the test
testMockEmailService().then(() => {
  console.log('\n✨ Mock email service is working perfectly!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});