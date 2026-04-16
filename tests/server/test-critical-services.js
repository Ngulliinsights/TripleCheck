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
exports.testCriticalServices = testCriticalServices;
// Comprehensive test script for all critical TripleCheck services
var ai_ml_service_1 = require("./services/ai-ml-service");
var email_service_1 = require("./services/email-service");
var file_storage_service_1 = require("./services/file-storage-service");
var mpesa_service_enhanced_1 = require("./services/mpesa-service-enhanced");
function testCriticalServices() {
    return __awaiter(this, void 0, void 0, function () {
        var allTestsPassed, testResults, emailService, messages, inquiries, error_1, fileService, status_1, mockFile, uploadResult, error_2, mpesaService, status_2, paymentResult, statusResult, error_3, aiService, status_3, mockImageBuffer, analysisResult, fraudResult, error_4, mockTitleDeed, documentUpload, documentAnalysis, verificationPayment, error_5, passedTests, totalTests;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log('🧪 Testing All Critical TripleCheck Services...\n');
                    console.log('='.repeat(60));
                    allTestsPassed = true;
                    testResults = [];
                    // Test 1: Email Service
                    console.log('\n📧 1. TESTING EMAIL SERVICE');
                    console.log('-'.repeat(40));
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    return [4 /*yield*/, (0, email_service_1.getEmailService)()];
                case 2:
                    emailService = _a.sent();
                    // Test simple email
                    return [4 /*yield*/, emailService.sendEmail(['test@example.com'], 'Test Email', 'This is a test email')];
                case 3:
                    // Test simple email
                    _a.sent();
                    // Test templated email
                    return [4 /*yield*/, (0, email_service_1.sendTemplatedEmail)('welcome', ['user@example.com'], {
                            userName: 'John Kamau',
                            loginUrl: 'https://triplecheck.co.ke/login'
                        })];
                case 4:
                    // Test templated email
                    _a.sent();
                    return [4 /*yield*/, emailService.getInboxMessages(5)];
                case 5:
                    messages = _a.sent();
                    inquiries = emailService.extractPropertyInquiries(messages);
                    console.log("\u2705 Email service working - ".concat(messages.length, " messages, ").concat(inquiries.length, " inquiries"));
                    testResults.push({ service: 'Email', status: 'PASS', details: "".concat(messages.length, " messages processed") });
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    console.error('❌ Email service failed:', error_1);
                    testResults.push({ service: 'Email', status: 'FAIL', details: error_1 instanceof Error ? error_1.message : 'Unknown error' });
                    allTestsPassed = false;
                    return [3 /*break*/, 7];
                case 7:
                    // Test 2: File Storage Service
                    console.log('\n📁 2. TESTING FILE STORAGE SERVICE');
                    console.log('-'.repeat(40));
                    _a.label = 8;
                case 8:
                    _a.trys.push([8, 10, , 11]);
                    fileService = (0, file_storage_service_1.getFileStorageService)();
                    status_1 = fileService.getStatus();
                    console.log("\uD83D\uDCCA File Storage Status:", {
                        provider: status_1.provider,
                        fallbackMode: status_1.fallbackMode,
                        healthy: status_1.healthy
                    });
                    mockFile = {
                        originalname: 'test-property.jpg',
                        mimetype: 'image/jpeg',
                        size: 1024 * 50, // 50KB
                        buffer: Buffer.from('mock image data for testing purposes')
                    };
                    return [4 /*yield*/, (0, file_storage_service_1.uploadPropertyImage)(mockFile, 'prop_123', 'user_456')];
                case 9:
                    uploadResult = _a.sent();
                    if (uploadResult.success) {
                        console.log("\u2705 File upload successful - ID: ".concat(uploadResult.fileId));
                        console.log("\uD83D\uDCF8 Image URL: ".concat(uploadResult.url));
                        if (uploadResult.thumbnailUrl) {
                            console.log("\uD83D\uDDBC\uFE0F Thumbnail URL: ".concat(uploadResult.thumbnailUrl));
                        }
                        testResults.push({ service: 'File Storage', status: 'PASS', details: "Upload successful, fallback: ".concat(uploadResult.fallbackUsed) });
                    }
                    else {
                        throw new Error(uploadResult.error || 'Upload failed');
                    }
                    return [3 /*break*/, 11];
                case 10:
                    error_2 = _a.sent();
                    console.error('❌ File storage service failed:', error_2);
                    testResults.push({ service: 'File Storage', status: 'FAIL', details: error_2 instanceof Error ? error_2.message : 'Unknown error' });
                    allTestsPassed = false;
                    return [3 /*break*/, 11];
                case 11:
                    // Test 3: M-Pesa Payment Service
                    console.log('\n💳 3. TESTING M-PESA PAYMENT SERVICE');
                    console.log('-'.repeat(40));
                    _a.label = 12;
                case 12:
                    _a.trys.push([12, 18, , 19]);
                    mpesaService = (0, mpesa_service_enhanced_1.getMpesaService)();
                    status_2 = mpesaService.getStatus();
                    console.log("\uD83D\uDCCA M-Pesa Status:", {
                        connected: status_2.connected,
                        fallbackMode: status_2.fallbackMode,
                        environment: status_2.environment,
                        pendingTransactions: status_2.pendingTransactions
                    });
                    return [4 /*yield*/, (0, mpesa_service_enhanced_1.processPropertyPayment)('254712345678', 5000, 'prop_123', 'user_456')];
                case 13:
                    paymentResult = _a.sent();
                    if (!paymentResult.success) return [3 /*break*/, 16];
                    console.log("\u2705 Payment initiated successfully");
                    console.log("\uD83D\uDCB0 Transaction ID: ".concat(paymentResult.transactionId));
                    console.log("\uD83D\uDCF1 Customer Message: ".concat(paymentResult.customerMessage));
                    if (paymentResult.fallbackUsed) {
                        console.log("\uD83D\uDD04 Fallback mode used");
                    }
                    if (!paymentResult.checkoutRequestId) return [3 /*break*/, 15];
                    return [4 /*yield*/, mpesaService.querySTKPushStatus(paymentResult.checkoutRequestId)];
                case 14:
                    statusResult = _a.sent();
                    console.log("\uD83D\uDCCB Transaction Status: ".concat(statusResult.resultDesc));
                    _a.label = 15;
                case 15:
                    testResults.push({ service: 'M-Pesa', status: 'PASS', details: "Payment initiated, fallback: ".concat(paymentResult.fallbackUsed) });
                    return [3 /*break*/, 17];
                case 16: throw new Error(paymentResult.error || 'Payment failed');
                case 17: return [3 /*break*/, 19];
                case 18:
                    error_3 = _a.sent();
                    console.error('❌ M-Pesa service failed:', error_3);
                    testResults.push({ service: 'M-Pesa', status: 'FAIL', details: error_3 instanceof Error ? error_3.message : 'Unknown error' });
                    allTestsPassed = false;
                    return [3 /*break*/, 19];
                case 19:
                    // Test 4: AI/ML Service
                    console.log('\n🤖 4. TESTING AI/ML SERVICE');
                    console.log('-'.repeat(40));
                    _a.label = 20;
                case 20:
                    _a.trys.push([20, 25, , 26]);
                    aiService = (0, ai_ml_service_1.getAIMLService)();
                    status_3 = aiService.getStatus();
                    console.log("\uD83D\uDCCA AI/ML Status:", {
                        connected: status_3.connected,
                        fallbackMode: status_3.fallbackMode,
                        availableProviders: status_3.availableProviders
                    });
                    mockImageBuffer = Buffer.from('mock title deed image data');
                    return [4 /*yield*/, (0, ai_ml_service_1.analyzePropertyDocument)('title_deed', mockImageBuffer, {
                            propertyId: 'prop_123',
                            location: 'Westlands, Nairobi',
                            expectedOwner: 'John Kamau'
                        })];
                case 21:
                    analysisResult = _a.sent();
                    if (!analysisResult.success) return [3 /*break*/, 23];
                    console.log("\u2705 Document analysis successful");
                    console.log("\uD83D\uDCC4 Document Type: ".concat(analysisResult.documentType));
                    console.log("\uD83C\uDFAF Confidence: ".concat((analysisResult.confidence * 100).toFixed(1), "%"));
                    console.log("\uD83D\uDD0D Risk Level: ".concat(analysisResult.fraudIndicators.riskLevel));
                    console.log("\u2705 Authentic: ".concat(analysisResult.authenticity.isAuthentic));
                    if (analysisResult.fallbackUsed) {
                        console.log("\uD83D\uDD04 Fallback mode used");
                    }
                    return [4 /*yield*/, (0, ai_ml_service_1.detectTransactionFraud)({
                            propertyId: 'prop_123',
                            sellerId: 'seller_789',
                            buyerId: 'buyer_456',
                            amount: 5000000,
                            location: 'Westlands, Nairobi'
                        }, ['http://example.com/title_deed.pdf', 'http://example.com/sale_agreement.pdf'])];
                case 22:
                    fraudResult = _a.sent();
                    console.log("\uD83D\uDD75\uFE0F Fraud Detection - Risk Score: ".concat(fraudResult.riskScore, "/100"));
                    console.log("\u26A0\uFE0F Risk Level: ".concat(fraudResult.riskLevel));
                    console.log("\uD83D\uDC68\u200D\uD83D\uDCBC Manual Review Required: ".concat(fraudResult.requiresManualReview));
                    testResults.push({ service: 'AI/ML', status: 'PASS', details: "Analysis completed, fallback: ".concat(analysisResult.fallbackUsed) });
                    return [3 /*break*/, 24];
                case 23: throw new Error(analysisResult.error || 'Analysis failed');
                case 24: return [3 /*break*/, 26];
                case 25:
                    error_4 = _a.sent();
                    console.error('❌ AI/ML service failed:', error_4);
                    testResults.push({ service: 'AI/ML', status: 'FAIL', details: error_4 instanceof Error ? error_4.message : 'Unknown error' });
                    allTestsPassed = false;
                    return [3 /*break*/, 26];
                case 26:
                    // Test 5: Integration Test - Complete Workflow
                    console.log('\n🔄 5. TESTING COMPLETE WORKFLOW INTEGRATION');
                    console.log('-'.repeat(40));
                    _a.label = 27;
                case 27:
                    _a.trys.push([27, 32, , 33]);
                    console.log('🏠 Simulating complete property verification workflow...');
                    mockTitleDeed = {
                        originalname: 'title_deed.pdf',
                        mimetype: 'application/pdf',
                        size: 1024 * 200, // 200KB
                        buffer: Buffer.from('mock title deed PDF content')
                    };
                    return [4 /*yield*/, (0, file_storage_service_1.uploadDocument)(mockTitleDeed, 'title_deed', 'user_123')];
                case 28:
                    documentUpload = _a.sent();
                    console.log("\uD83D\uDCC4 Document uploaded: ".concat(documentUpload.fileId));
                    return [4 /*yield*/, (0, ai_ml_service_1.analyzePropertyDocument)('title_deed', mockTitleDeed.buffer, { propertyId: 'prop_123', location: 'Karen, Nairobi' })];
                case 29:
                    documentAnalysis = _a.sent();
                    console.log("\uD83E\uDD16 Document analyzed - Confidence: ".concat((documentAnalysis.confidence * 100).toFixed(1), "%"));
                    return [4 /*yield*/, (0, mpesa_service_enhanced_1.getMpesaService)().processVerificationPayment('254712345678', 2500, 'verification_789', 'user_123')];
                case 30:
                    verificationPayment = _a.sent();
                    console.log("\uD83D\uDCB3 Verification payment: ".concat(verificationPayment.success ? 'SUCCESS' : 'FAILED'));
                    // Step 4: Send notification email
                    return [4 /*yield*/, (0, email_service_1.sendTemplatedEmail)('verification-update', ['user@example.com'], {
                            userName: 'John Kamau',
                            propertyTitle: 'Land in Karen',
                            status: 'completed',
                            details: 'Your land verification has been completed successfully.'
                        })];
                case 31:
                    // Step 4: Send notification email
                    _a.sent();
                    console.log("\uD83D\uDCE7 Notification email sent");
                    console.log("\u2705 Complete workflow integration successful!");
                    testResults.push({ service: 'Integration', status: 'PASS', details: 'Complete workflow executed successfully' });
                    return [3 /*break*/, 33];
                case 32:
                    error_5 = _a.sent();
                    console.error('❌ Integration test failed:', error_5);
                    testResults.push({ service: 'Integration', status: 'FAIL', details: error_5 instanceof Error ? error_5.message : 'Unknown error' });
                    allTestsPassed = false;
                    return [3 /*break*/, 33];
                case 33:
                    // Test Results Summary
                    console.log("\n".concat('='.repeat(60)));
                    console.log('📊 CRITICAL SERVICES TEST RESULTS');
                    console.log('='.repeat(60));
                    testResults.forEach(function (result) {
                        var statusIcon = result.status === 'PASS' ? '✅' : '❌';
                        console.log("".concat(statusIcon, " ").concat(result.service.padEnd(15), " | ").concat(result.status.padEnd(4), " | ").concat(result.details));
                    });
                    console.log("\n".concat('='.repeat(60)));
                    passedTests = testResults.filter(function (r) { return r.status === 'PASS'; }).length;
                    totalTests = testResults.length;
                    if (allTestsPassed) {
                        console.log("\uD83C\uDF89 ALL TESTS PASSED! (".concat(passedTests, "/").concat(totalTests, ")"));
                        console.log('✨ TripleCheck critical services are ready for production!');
                        console.log('\n🇰🇪 Ready to secure land transactions across Kenya!');
                    }
                    else {
                        console.log("\u26A0\uFE0F SOME TESTS FAILED (".concat(passedTests, "/").concat(totalTests, " passed)"));
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
                    return [2 /*return*/, allTestsPassed];
            }
        });
    });
}
// Run the comprehensive test automatically
testCriticalServices().then(function (success) {
    process.exit(success ? 0 : 1);
}).catch(function (error) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
});
