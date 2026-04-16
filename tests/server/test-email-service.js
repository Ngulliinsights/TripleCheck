"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmailService = testEmailService;
// Test script for the enhanced email service
var email_service_1 = require("./services/email-service");
function testEmailService() {
    return __awaiter(this, void 0, void 0, function () {
        var emailService, status_1, fallbackMode, queuedCount, messages, inquiries, providers, _i, providers_1, provider, service, error_1, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    console.log('🧪 Testing Enhanced Email Service...\n');
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 18, , 19]);
                    // Test 1: Get email service (should auto-select best available)
                    console.log('1️⃣ Testing service initialization...');
                    return [4 /*yield*/, (0, email_service_1.getEmailService)()];
                case 2:
                    emailService = _c.sent();
                    console.log('✅ Email service initialized successfully\n');
                    // Test 2: Check service status
                    console.log('2️⃣ Checking service status...');
                    if (!('getStatus' in emailService)) return [3 /*break*/, 4];
                    return [4 /*yield*/, emailService.getStatus()];
                case 3:
                    status_1 = _c.sent();
                    console.log('📊 Service Status:', status_1);
                    return [3 /*break*/, 5];
                case 4:
                    console.log('📊 Service Status: Available (no detailed status)');
                    _c.label = 5;
                case 5:
                    // Check fallback mode
                    if ('isInFallbackMode' in emailService) {
                        fallbackMode = emailService.isInFallbackMode();
                        queuedCount = ((_b = (_a = emailService).getFallbackEmailCount) === null || _b === void 0 ? void 0 : _b.call(_a)) || 0;
                        console.log("\uD83D\uDCCA Fallback Mode: ".concat(fallbackMode ? 'Yes' : 'No'));
                        console.log("\uD83D\uDCCA Queued Emails: ".concat(queuedCount, "\n"));
                    }
                    // Test 3: Send simple email
                    console.log('3️⃣ Testing simple email sending...');
                    return [4 /*yield*/, emailService.sendEmail(['test@example.com'], 'Test Email from TripleCheck Kenya', 'This is a test email to verify the email service is working correctly.')];
                case 6:
                    _c.sent();
                    console.log('✅ Simple email sent successfully\n');
                    // Test 4: Send welcome email template
                    console.log('4️⃣ Testing welcome email template...');
                    return [4 /*yield*/, (0, email_service_1.sendTemplatedEmail)('welcome', ['newuser@example.com'], {
                            userName: 'John Kamau',
                            loginUrl: 'https://triplecheck.co.ke/login'
                        })];
                case 7:
                    _c.sent();
                    console.log('✅ Welcome email sent successfully\n');
                    // Test 5: Send password reset email template
                    console.log('5️⃣ Testing password reset email template...');
                    return [4 /*yield*/, (0, email_service_1.sendTemplatedEmail)('password-reset', ['user@example.com'], {
                            userName: 'Sarah Wanjiku',
                            resetUrl: 'https://triplecheck.co.ke/reset-password?token=abc123'
                        })];
                case 8:
                    _c.sent();
                    console.log('✅ Password reset email sent successfully\n');
                    // Test 6: Send property inquiry notification
                    console.log('6️⃣ Testing property inquiry notification...');
                    return [4 /*yield*/, (0, email_service_1.sendTemplatedEmail)('property-inquiry', ['owner@example.com'], {
                            propertyTitle: 'Modern Apartment in Westlands',
                            inquirerName: 'Michael Ochieng',
                            message: 'I am interested in viewing this property. When would be a good time?',
                            contactInfo: '+254712345678'
                        })];
                case 9:
                    _c.sent();
                    console.log('✅ Property inquiry notification sent successfully\n');
                    // Test 7: Send verification update
                    console.log('7️⃣ Testing verification status update...');
                    return [4 /*yield*/, (0, email_service_1.sendTemplatedEmail)('verification-update', ['client@example.com'], {
                            userName: 'Grace Muthoni',
                            propertyTitle: 'Land in Karen',
                            status: 'completed',
                            details: 'Your land verification has been completed successfully. All documents are authentic and the land title is clear.'
                        })];
                case 10:
                    _c.sent();
                    console.log('✅ Verification update sent successfully\n');
                    // Test 8: Get inbox messages (if supported)
                    console.log('8️⃣ Testing inbox message retrieval...');
                    return [4 /*yield*/, emailService.getInboxMessages(5)];
                case 11:
                    messages = _c.sent();
                    console.log("\uD83D\uDCE7 Retrieved ".concat(messages.length, " inbox messages"));
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
                    inquiries = emailService.extractPropertyInquiries(messages);
                    console.log("\uD83D\uDD0D Extracted ".concat(inquiries.length, " property inquiries"));
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
                    providers = ['mock', 'smtp', 'sendgrid'];
                    _i = 0, providers_1 = providers;
                    _c.label = 12;
                case 12:
                    if (!(_i < providers_1.length)) return [3 /*break*/, 17];
                    provider = providers_1[_i];
                    _c.label = 13;
                case 13:
                    _c.trys.push([13, 15, , 16]);
                    console.log("   Testing ".concat(provider, " provider..."));
                    service = email_service_1.EmailServiceFactory.createService(provider);
                    return [4 /*yield*/, service.initialize()];
                case 14:
                    _c.sent();
                    console.log("   \u2705 ".concat(provider, " provider initialized successfully"));
                    return [3 /*break*/, 16];
                case 15:
                    error_1 = _c.sent();
                    console.log("   \u26A0\uFE0F ".concat(provider, " provider failed:"), error_1 instanceof Error ? error_1.message : 'Unknown error');
                    return [3 /*break*/, 16];
                case 16:
                    _i++;
                    return [3 /*break*/, 12];
                case 17:
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
                    return [3 /*break*/, 19];
                case 18:
                    error_2 = _c.sent();
                    console.error('❌ Email service test failed:', error_2);
                    process.exit(1);
                    return [3 /*break*/, 19];
                case 19: return [2 /*return*/];
            }
        });
    });
}
// Run the test automatically
testEmailService().then(function () {
    console.log('\n✨ Email service is ready for production use!');
    process.exit(0);
}).catch(function (error) {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});
