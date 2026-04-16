"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentSystemInterface = PaymentSystemInterface;
var lucide_react_1 = require("lucide-react");
var react_1 = require("react");
var alert_1 = require("../../local/components/ui/alert");
var badge_1 = require("../../local/components/ui/badge");
var button_1 = require("../../local/components/ui/button");
var card_1 = require("../../local/components/ui/card");
var input_1 = require("../../local/components/ui/input");
var select_1 = require("../../local/components/ui/select");
var tabs_1 = require("../../local/components/ui/tabs");
var use_toast_1 = require("../../local/hooks/use-toast");
var PAYMENT_METHODS = [
    {
        id: 'mpesa',
        type: 'mpesa',
        name: 'M-Pesa',
        icon: lucide_react_1.Smartphone,
        description: 'Pay with M-Pesa mobile money',
        fees: { fixed: 0, percentage: 1.5 },
        processingTime: 'Instant',
        available: true
    },
    {
        id: 'bank_transfer',
        type: 'bank_transfer',
        name: 'Bank Transfer',
        icon: lucide_react_1.Building2,
        description: 'Direct bank transfer',
        fees: { fixed: 50, percentage: 0 },
        processingTime: '1-3 business days',
        available: true
    },
    {
        id: 'card',
        type: 'card',
        name: 'Credit/Debit Card',
        icon: lucide_react_1.CreditCard,
        description: 'Pay with Visa or Mastercard',
        fees: { fixed: 0, percentage: 2.9 },
        processingTime: 'Instant',
        available: false
    }
];
var MOCK_TRANSACTIONS = [
    {
        id: 'txn-001',
        amount: 2500,
        currency: 'KES',
        method: 'M-Pesa',
        status: 'completed',
        description: 'Land verification service',
        createdAt: new Date('2024-01-20T10:30:00'),
        completedAt: new Date('2024-01-20T10:31:00'),
        reference: 'MP240120001',
        fees: 37.5
    },
    {
        id: 'txn-002',
        amount: 5000,
        currency: 'KES',
        method: 'Bank Transfer',
        status: 'processing',
        description: 'Document authentication service',
        createdAt: new Date('2024-01-20T14:15:00'),
        reference: 'BT240120002',
        fees: 50
    }
];
var STATUS_CONFIG = {
    pending: { color: 'bg-gray-100 text-gray-800', icon: lucide_react_1.Clock },
    processing: { color: 'bg-blue-100 text-blue-800', icon: lucide_react_1.RefreshCw },
    completed: { color: 'bg-green-100 text-green-800', icon: lucide_react_1.CheckCircle },
    failed: { color: 'bg-red-100 text-red-800', icon: lucide_react_1.AlertTriangle },
    cancelled: { color: 'bg-gray-100 text-gray-800', icon: lucide_react_1.AlertTriangle }
};
function PaymentSystemInterface() {
    var _this = this;
    var toast = (0, use_toast_1.useToast)().toast;
    var _a = (0, react_1.useState)(null), selectedMethod = _a[0], setSelectedMethod = _a[1];
    var _b = (0, react_1.useState)(''), paymentAmount = _b[0], setPaymentAmount = _b[1];
    var _c = (0, react_1.useState)(''), phoneNumber = _c[0], setPhoneNumber = _c[1];
    var _d = (0, react_1.useState)(false), isProcessing = _d[0], setIsProcessing = _d[1];
    var _e = (0, react_1.useState)(MOCK_TRANSACTIONS), transactions = _e[0], setTransactions = _e[1];
    var _f = (0, react_1.useState)('payment'), selectedTab = _f[0], setSelectedTab = _f[1];
    var calculateFees = function (amount, method) {
        return method.fees.fixed + (amount * method.fees.percentage / 100);
    };
    var handlePayment = function () { return __awaiter(_this, void 0, void 0, function () {
        var amount_1, fees, newTransaction_1;
        return __generator(this, function (_a) {
            if (!selectedMethod || !paymentAmount) {
                toast({
                    title: "Missing Information",
                    description: "Please select a payment method and enter an amount.",
                    variant: "destructive"
                });
                return [2 /*return*/];
            }
            if (selectedMethod.type === 'mpesa' && !phoneNumber) {
                toast({
                    title: "Phone Number Required",
                    description: "Please enter your M-Pesa phone number.",
                    variant: "destructive"
                });
                return [2 /*return*/];
            }
            setIsProcessing(true);
            try {
                amount_1 = parseFloat(paymentAmount);
                fees = calculateFees(amount_1, selectedMethod);
                newTransaction_1 = {
                    id: "txn-".concat(Date.now()),
                    amount: amount_1,
                    currency: 'KES',
                    method: selectedMethod.name,
                    status: 'processing',
                    description: 'Land verification service',
                    createdAt: new Date(),
                    reference: "".concat(selectedMethod.type.toUpperCase()).concat(Date.now()),
                    fees: fees
                };
                setTransactions(function (prev) { return __spreadArray([newTransaction_1], prev, true); });
                // Simulate processing delay
                setTimeout(function () {
                    setTransactions(function (prev) { return prev.map(function (txn) {
                        return txn.id === newTransaction_1.id
                            ? __assign(__assign({}, txn), { status: 'completed', completedAt: new Date() }) : txn;
                    }); });
                    toast({
                        title: "Payment Successful",
                        description: "Payment of KES ".concat(amount_1.toLocaleString(), " completed successfully."),
                    });
                }, 3000);
                toast({
                    title: "Payment Initiated",
                    description: "Processing payment of KES ".concat(amount_1.toLocaleString(), " via ").concat(selectedMethod.name, "."),
                });
                // Reset form
                setPaymentAmount('');
                setPhoneNumber('');
                setSelectedMethod(null);
            }
            catch (error) {
                toast({
                    title: "Payment Failed",
                    description: "An error occurred while processing your payment.",
                    variant: "destructive"
                });
            }
            finally {
                setIsProcessing(false);
            }
            return [2 /*return*/];
        });
    }); };
    var formatCurrency = function (amount, currency) {
        if (currency === void 0) { currency = 'KES'; }
        return "".concat(currency, " ").concat(amount.toLocaleString());
    };
    var getStatusIcon = function (status) {
        var config = STATUS_CONFIG[status];
        return config.icon;
    };
    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment System</h2>
          <p className="text-gray-600">
            Manage payments and transactions for verification services
          </p>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <lucide_react_1.Receipt className="h-6 w-6 text-blue-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(function (t) { return t.status === 'completed'; }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <lucide_react_1.CheckCircle className="h-6 w-6 text-green-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.filter(function (t) { return t.status === 'processing'; }).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <lucide_react_1.Clock className="h-6 w-6 text-yellow-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>

        <card_1.Card>
          <card_1.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(transactions.reduce(function (sum, t) { return sum + t.amount; }, 0))}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <lucide_react_1.DollarSign className="h-6 w-6 text-purple-600"/>
              </div>
            </div>
          </card_1.CardContent>
        </card_1.Card>
      </div>

      {/* Main Interface */}
      <card_1.Card>
        <card_1.CardHeader>
          <card_1.CardTitle>Payment Management</card_1.CardTitle>
          <card_1.CardDescription>
            Process payments and manage transaction history
          </card_1.CardDescription>
        </card_1.CardHeader>
        <card_1.CardContent>
          <tabs_1.Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <tabs_1.TabsList className="grid w-full grid-cols-3">
              <tabs_1.TabsTrigger value="payment">Make Payment</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="transactions">Transactions</tabs_1.TabsTrigger>
              <tabs_1.TabsTrigger value="methods">Payment Methods</tabs_1.TabsTrigger>
            </tabs_1.TabsList>

            <tabs_1.TabsContent value="payment" className="space-y-6">
              {/* Payment Amount */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Payment Details</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Amount (KES)
                    </label>
                    <input_1.Input type="number" placeholder="Enter amount" value={paymentAmount} onChange={function (e) { return setPaymentAmount(e.target.value); }} className="text-lg"/>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Service Type
                    </label>
                    <select_1.Select defaultValue="land_verification">
                      <select_1.SelectTrigger>
                        <select_1.SelectValue />
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        <select_1.SelectItem value="land_verification">Land Verification</select_1.SelectItem>
                        <select_1.SelectItem value="document_auth">Document Authentication</select_1.SelectItem>
                        <select_1.SelectItem value="fraud_detection">Fraud Detection</select_1.SelectItem>
                        <select_1.SelectItem value="expert_consultation">Expert Consultation</select_1.SelectItem>
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              {/* Payment Methods */}
              <card_1.Card>
                <card_1.CardHeader>
                  <card_1.CardTitle className="text-lg">Select Payment Method</card_1.CardTitle>
                </card_1.CardHeader>
                <card_1.CardContent>
                  <div className="grid gap-4">
                    {PAYMENT_METHODS.map(function (method) {
            var Icon = method.icon;
            var isSelected = (selectedMethod === null || selectedMethod === void 0 ? void 0 : selectedMethod.id) === method.id;
            var fees = paymentAmount ? calculateFees(parseFloat(paymentAmount) || 0, method) : 0;
            return (<card_1.Card key={method.id} className={"cursor-pointer transition-all duration-200 ".concat(isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-md', " ").concat(!method.available ? 'opacity-50 cursor-not-allowed' : '')} onClick={function () { return method.available && setSelectedMethod(method); }}>
                          <card_1.CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4">
                                <div className={"p-3 rounded-lg ".concat(isSelected ? 'bg-blue-100' : 'bg-gray-100')}>
                                  <Icon className={"h-6 w-6 ".concat(isSelected ? 'text-blue-600' : 'text-gray-600')}/>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                                    <span>{method.name}</span>
                                    {!method.available && (<badge_1.Badge variant="outline" className="text-xs">
                                        Coming Soon
                                      </badge_1.Badge>)}
                                  </h4>
                                  <p className="text-sm text-gray-600">{method.description}</p>
                                  <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                    <span>Processing: {method.processingTime}</span>
                                    {paymentAmount && (<span>Fees: KES {fees.toFixed(2)}</span>)}
                                  </div>
                                </div>
                              </div>
                              
                              {isSelected && (<lucide_react_1.CheckCircle className="h-5 w-5 text-blue-500"/>)}
                            </div>
                          </card_1.CardContent>
                        </card_1.Card>);
        })}
                  </div>
                </card_1.CardContent>
              </card_1.Card>

              {/* M-Pesa Phone Number */}
              {(selectedMethod === null || selectedMethod === void 0 ? void 0 : selectedMethod.type) === 'mpesa' && (<card_1.Card>
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">M-Pesa Details</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Phone Number
                      </label>
                      <div className="relative">
                        <lucide_react_1.Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                        <input_1.Input type="tel" placeholder="254712345678" value={phoneNumber} onChange={function (e) { return setPhoneNumber(e.target.value); }} className="pl-10"/>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Enter your M-Pesa registered phone number
                      </p>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>)}

              {/* Payment Summary */}
              {selectedMethod && paymentAmount && (<card_1.Card className="bg-gray-50">
                  <card_1.CardHeader>
                    <card_1.CardTitle className="text-lg">Payment Summary</card_1.CardTitle>
                  </card_1.CardHeader>
                  <card_1.CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span className="font-medium">KES {parseFloat(paymentAmount).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fees:</span>
                        <span className="font-medium">KES {calculateFees(parseFloat(paymentAmount), selectedMethod).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>KES {(parseFloat(paymentAmount) + calculateFees(parseFloat(paymentAmount), selectedMethod)).toFixed(2)}</span>
                      </div>
                    </div>
                  </card_1.CardContent>
                </card_1.Card>)}

              {/* Payment Button */}
              <div className="flex justify-end">
                <button_1.Button onClick={handlePayment} disabled={!selectedMethod || !paymentAmount || isProcessing} className="min-w-[150px]">
                  {isProcessing ? (<>
                      <lucide_react_1.RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                      Processing...
                    </>) : (<>
                      <lucide_react_1.Shield className="h-4 w-4 mr-2"/>
                      Pay Securely
                    </>)}
                </button_1.Button>
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="transactions" className="space-y-4">
              <div className="space-y-4">
                {transactions.map(function (transaction) {
            var StatusIcon = getStatusIcon(transaction.status);
            var statusConfig = STATUS_CONFIG[transaction.status];
            return (<card_1.Card key={transaction.id}>
                      <card_1.CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={"p-2 rounded-lg ".concat(statusConfig.color.replace('text-', 'text-').replace('bg-', 'bg-'))}>
                              <StatusIcon className="h-5 w-5"/>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </h4>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                <span>{transaction.method}</span>
                                <span>Ref: {transaction.reference}</span>
                                <span>{transaction.createdAt.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <badge_1.Badge className={statusConfig.color}>
                              {transaction.status}
                            </badge_1.Badge>
                            <button_1.Button variant="outline" size="sm">
                              <lucide_react_1.Eye className="h-3 w-3 mr-1"/>
                              View
                            </button_1.Button>
                          </div>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>);
        })}
              </div>
            </tabs_1.TabsContent>

            <tabs_1.TabsContent value="methods" className="space-y-4">
              <alert_1.Alert>
                <lucide_react_1.Shield className="h-4 w-4"/>
                <alert_1.AlertTitle>Secure Payment Processing</alert_1.AlertTitle>
                <alert_1.AlertDescription>
                  All payments are processed securely through encrypted channels. 
                  We support multiple payment methods for your convenience.
                </alert_1.AlertDescription>
              </alert_1.Alert>

              <div className="grid gap-4">
                {PAYMENT_METHODS.map(function (method) {
            var Icon = method.icon;
            return (<card_1.Card key={method.id}>
                      <card_1.CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="p-3 bg-gray-100 rounded-lg">
                            <Icon className="h-6 w-6 text-gray-600"/>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{method.name}</h4>
                              <badge_1.Badge variant={method.available ? "default" : "outline"}>
                                {method.available ? "Available" : "Coming Soon"}
                              </badge_1.Badge>
                            </div>
                            
                            <p className="text-gray-600 mb-3">{method.description}</p>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Processing Time:</span>
                                <div className="font-medium">{method.processingTime}</div>
                              </div>
                              <div>
                                <span className="text-gray-500">Fees:</span>
                                <div className="font-medium">
                                  {method.fees.fixed > 0 && "KES ".concat(method.fees.fixed, " + ")}
                                  {method.fees.percentage}%
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </card_1.CardContent>
                    </card_1.Card>);
        })}
              </div>
            </tabs_1.TabsContent>
          </tabs_1.Tabs>
        </card_1.CardContent>
      </card_1.Card>
    </div>);
}
exports.default = PaymentSystemInterface;
