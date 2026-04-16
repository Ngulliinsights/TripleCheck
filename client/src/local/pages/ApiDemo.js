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
exports.default = ApiDemo;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var button_1 = require("../components/ui/button");
var card_1 = require("../components/ui/card");
function ApiDemo() {
    var _this = this;
    var _a = (0, react_1.useState)('verification'), activeTab = _a[0], setActiveTab = _a[1];
    var _b = (0, react_1.useState)(false), isRunning = _b[0], setIsRunning = _b[1];
    var _c = (0, react_1.useState)(null), result = _c[0], setResult = _c[1];
    var runDemo = function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            setIsRunning(true);
            // Simulate API call
            setTimeout(function () {
                setResult({
                    success: true,
                    verificationId: "ver_".concat(Math.random().toString(36).substr(2, 9)),
                    status: "completed",
                    riskScore: 0.15,
                    ownership: "verified",
                    recommendations: ["proceed_with_transaction"],
                    processingTime: "8.2 seconds"
                });
                setIsRunning(false);
            }, 2000);
            return [2 /*return*/];
        });
    }); };
    var copyCode = function (code) {
        navigator.clipboard.writeText(code);
    };
    var verificationCode = "// Land Verification API Example\nconst response = await fetch('https://api.triplecheck.co.ke/v1/land-verification/verify', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    propertyId: 'LR123456',\n    documents: [{\n      type: 'title_deed',\n      url: 'https://example.com/deed.pdf'\n    }],\n    location: {\n      latitude: -1.2921,\n      longitude: 36.8219\n    },\n    webhookUrl: 'https://yourapp.com/webhook'\n  })\n});\n\nconst verification = await response.json();\nconsole.log(verification);";
    var fraudDetectionCode = "// Fraud Detection API Example\nconst response = await fetch('https://api.triplecheck.co.ke/v1/fraud-detection/analyze', {\n  method: 'POST',\n  headers: {\n    'Authorization': 'Bearer YOUR_API_KEY',\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    documents: [{\n      type: 'title_deed',\n      content: 'base64_encoded_content'\n    }],\n    metadata: {\n      propertyId: 'LR123456',\n      transactionValue: 5000000\n    }\n  })\n});\n\nconst analysis = await response.json();";
    return (<div className="min-h-screen bg-gray-50 nav-aware-spacing">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <lucide_react_1.Building2 className="w-5 h-5"/>
              <span className="text-sm font-medium">Enterprise API</span>
            </div>
            <h1 className="text-5xl font-bold mb-6">
              TripleCheck Land Verification API
            </h1>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              The same powerful verification you see on our platform, now available as an API 
              for banks, real estate platforms, and insurance companies across Kenya.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button_1.Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={function () { var _a; return (_a = document.getElementById('demo')) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' }); }}>
                <lucide_react_1.Play className="w-5 h-5 mr-2"/>
                Try Live Demo
              </button_1.Button>
              <button_1.Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={function () { return window.location.href = '/contact-sales'; }}>
                Contact Sales
              </button_1.Button>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide_react_1.Zap className="w-8 h-8 text-blue-600"/>
              </div>
              <h3 className="text-xl font-semibold mb-2">10-Minute Verification</h3>
              <p className="text-gray-600">Complete property verification in minutes, not months</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide_react_1.Shield className="w-8 h-8 text-green-600"/>
              </div>
              <h3 className="text-xl font-semibold mb-2">95% Fraud Detection</h3>
              <p className="text-gray-600">AI-powered fraud detection with Kenya-specific models</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <lucide_react_1.Building2 className="w-8 h-8 text-purple-600"/>
              </div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Ready</h3>
              <p className="text-gray-600">Scalable API with SLA guarantees and dedicated support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo */}
      <section id="demo" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Try the API Live</h2>
              <p className="text-gray-600">See how easy it is to integrate land verification into your platform</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Code Example */}
              <div>
                <div className="flex space-x-4 mb-4">
                  <button onClick={function () { return setActiveTab('verification'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(activeTab === 'verification'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900')}>
                    Land Verification
                  </button>
                  <button onClick={function () { return setActiveTab('fraud'); }} className={"px-4 py-2 rounded-md text-sm font-medium transition-colors ".concat(activeTab === 'fraud'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-600 hover:text-gray-900')}>
                    Fraud Detection
                  </button>
                </div>

                <card_1.Card>
                  <card_1.CardHeader className="flex flex-row items-center justify-between">
                    <card_1.CardTitle className="text-lg">API Example</card_1.CardTitle>
                    <button_1.Button size="sm" variant="outline" onClick={function () { return copyCode(activeTab === 'verification' ? verificationCode : fraudDetectionCode); }}>
                      <lucide_react_1.Copy className="w-4 h-4 mr-1"/>
                      Copy
                    </button_1.Button>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-x-auto">
                      <code>{activeTab === 'verification' ? verificationCode : fraudDetectionCode}</code>
                    </pre>
                  </card_1.CardContent>
                </card_1.Card>
              </div>

              {/* Demo Results */}
              <div>
                <card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Live Demo</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-4">
                      <button_1.Button onClick={runDemo} disabled={isRunning} className="w-full bg-blue-600 hover:bg-blue-700">
                        {isRunning ? 'Running Verification...' : 'Run Demo Verification'}
                        <lucide_react_1.Play className="w-4 h-4 ml-2"/>
                      </button_1.Button>

                      {result && (<div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-semibold mb-3 flex items-center">
                            <lucide_react_1.CheckCircle className="w-5 h-5 text-green-500 mr-2"/>
                            Verification Complete
                          </h4>
                          <pre className="text-sm text-gray-700 overflow-x-auto">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </div>)}

                      <div className="text-sm text-gray-600">
                        <p><strong>Processing Time:</strong> 8.2 seconds</p>
                        <p><strong>Risk Score:</strong> 0.15 (Low Risk)</p>
                        <p><strong>Status:</strong> Verified ✓</p>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-gray-600 mb-12">Choose the plan that fits your verification volume</p>

            <div className="grid md:grid-cols-3 gap-8">
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Pay-per-use</card_1.CardTitle>
                  <div className="text-3xl font-bold text-blue-600">$3<span className="text-lg text-gray-600">/verification</span></div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ No monthly commitment</li>
                    <li>✓ All API features</li>
                    <li>✓ Email support</li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card className="border-2 border-blue-500 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm">
                  Most Popular
                </div>
                <card_1.CardHeader>
                  <card_1.CardTitle>Professional</card_1.CardTitle>
                  <div className="text-3xl font-bold text-blue-600">$1,500<span className="text-lg text-gray-600">/month</span></div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ 5,000 verifications included</li>
                    <li>✓ Priority support</li>
                    <li>✓ Custom webhooks</li>
                    <li>✓ Analytics dashboard</li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>

              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle>Enterprise</card_1.CardTitle>
                  <div className="text-3xl font-bold text-blue-600">Custom</div>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>✓ Unlimited verifications</li>
                    <li>✓ Dedicated support</li>
                    <li>✓ Custom integrations</li>
                    <li>✓ SLA guarantees</li>
                  </ul>
                </card_1.CardContent>
              </card_1.Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of companies using TripleCheck API to verify land across Kenya
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button_1.Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100" onClick={function () { return window.location.href = '/contact-sales'; }}>
              Get Your API Key
              <lucide_react_1.ArrowRight className="w-5 h-5 ml-2"/>
            </button_1.Button>
            <button_1.Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={function () { return window.location.href = '/api-docs'; }}>
              View Documentation
            </button_1.Button>
          </div>
        </div>
      </section>
    </div>);
}
